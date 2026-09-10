import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.all_models import Route, FareObservation, DataSource, CollectionLog, PriceIndex
from app.providers import get_data_provider
from app.analytics.index_calculator import calculate_airfare_price_index

logger = logging.getLogger(__name__)

ADVANCE_WINDOWS = [1, 7, 15, 30, 45]

async def run_collection_cycle(db: Session) -> Dict[str, Any]:
    """
    Executes a single data collection cycle across active routes and booking windows.
    Normalizes data, de-duplicates, stores records, updates data source metrics, and writes an audit log.
    """
    start_time = time.time()
    provider = get_data_provider()
    routes = db.query(Route).filter(Route.is_active == True).all()

    total_records = 0
    now = datetime.utcnow()
    status_str = "SUCCESS"
    error_msg = None

    try:
        if hasattr(provider, "batch_search_fares"):
            tasks = []
            # For live web scraping, query key booking windows (1, 7, 15 days) to ensure fast, high-density live telemetry
            active_windows = [1, 7, 15] if not provider.is_demo else ADVANCE_WINDOWS
            for route in routes:
                for days in active_windows:
                    target_date = (now + timedelta(days=days)).strftime("%Y-%m-%d")
                    tasks.append({
                        "origin": route.origin,
                        "destination": route.destination,
                        "departure_date": target_date,
                        "advance_days": days,
                        "distance_km": route.distance_km
                    })
            observations = await provider.batch_search_fares(tasks, concurrency=2)

            for obs in observations:
                # Normalization rule: total_fare = base_fare + taxes + fees
                normalized_total = round(obs.base_fare + obs.taxes + obs.fees, 2)

                # Deduplication check: same flight on same departure date within last 2 hours
                existing = db.query(FareObservation).filter(
                    FareObservation.flight_number == obs.flight_number,
                    FareObservation.departure_date == obs.departure_date,
                    FareObservation.advance_days == obs.advance_days,
                    FareObservation.timestamp >= now - timedelta(hours=2)
                ).first()

                if existing:
                    continue

                db_record = FareObservation(
                    timestamp=now,
                    source=obs.source,
                    source_url=obs.source_url,
                    airline=obs.airline,
                    flight_number=obs.flight_number,
                    origin=obs.origin,
                    destination=obs.destination,
                    departure_date=obs.departure_date,
                    departure_time=obs.departure_time,
                    arrival_time=obs.arrival_time,
                    advance_days=obs.advance_days,
                    fare_class=obs.fare_class,
                    base_fare=obs.base_fare,
                    taxes=obs.taxes,
                    fees=obs.fees,
                    total_fare=normalized_total,
                    currency=obs.currency,
                    availability=obs.availability,
                    is_demo=obs.is_demo,
                    raw_payload=obs.raw_payload
                )
                db.add(db_record)
                total_records += 1
        else:
            for route in routes:
                for days in ADVANCE_WINDOWS:
                    target_date = (now + timedelta(days=days)).strftime("%Y-%m-%d")
                    observations = await provider.search_fares(
                        origin=route.origin,
                        destination=route.destination,
                        departure_date=target_date,
                        advance_days=days,
                        distance_km=route.distance_km
                    )

                    for obs in observations:
                        normalized_total = round(obs.base_fare + obs.taxes + obs.fees, 2)

                        existing = db.query(FareObservation).filter(
                            FareObservation.flight_number == obs.flight_number,
                            FareObservation.departure_date == obs.departure_date,
                            FareObservation.advance_days == obs.advance_days,
                            FareObservation.timestamp >= now - timedelta(hours=2)
                        ).first()

                        if existing:
                            continue

                        db_record = FareObservation(
                            timestamp=now,
                            source=obs.source,
                            source_url=obs.source_url,
                            airline=obs.airline,
                            flight_number=obs.flight_number,
                            origin=obs.origin,
                            destination=obs.destination,
                            departure_date=obs.departure_date,
                            departure_time=obs.departure_time,
                            arrival_time=obs.arrival_time,
                            advance_days=obs.advance_days,
                            fare_class=obs.fare_class,
                            base_fare=obs.base_fare,
                            taxes=obs.taxes,
                            fees=obs.fees,
                            total_fare=normalized_total,
                            currency=obs.currency,
                            availability=obs.availability,
                            is_demo=obs.is_demo,
                            raw_payload=obs.raw_payload
                        )
                        db.add(db_record)
                        total_records += 1

        db.commit()

        # Update or create DataSource entry
        provider_name = provider.provider_name
        data_source = db.query(DataSource).filter(DataSource.name == provider_name).first()
        if not data_source:
            data_source = DataSource(
                name=provider_name,
                provider_type="DEMO" if provider.is_demo else "API",
                base_url=getattr(provider, "base_url", "http://internal-simulator"),
                status="SIMULATION" if provider.is_demo else "ACTIVE",
                last_run=now,
                total_records=total_records,
                description="Automated collection pipeline for Indian domestic airfares."
            )
            db.add(data_source)
        else:
            data_source.last_run = now
            data_source.total_records += total_records
            data_source.status = "SIMULATION" if provider.is_demo else "ACTIVE"

        # Record snapshot of the index
        idx_data = calculate_airfare_price_index(db)
        index_entry = PriceIndex(
            timestamp=now,
            index_type="NATIONAL",
            reference_code="ALL",
            base_value=100.0,
            current_value=idx_data["national_index"],
            index_score=idx_data["national_index"],
            daily_change_pct=idx_data["daily_change_pct"],
            weekly_change_pct=idx_data["weekly_change_pct"],
            monthly_change_pct=idx_data["monthly_change_pct"],
            is_demo=provider.is_demo
        )
        db.add(index_entry)
        db.commit()

    except Exception as e:
        logger.error(f"Error during collection cycle: {e}")
        db.rollback()
        status_str = "FAILED"
        error_msg = str(e)

    duration_ms = int((time.time() - start_time) * 1000)

    # Write CollectionLog
    log_entry = CollectionLog(
        timestamp=now,
        provider_type=provider.provider_name,
        status=status_str,
        records_fetched=total_records,
        duration_ms=duration_ms,
        error_message=error_msg,
        is_demo=provider.is_demo
    )
    db.add(log_entry)
    db.commit()

    return {
        "status": status_str,
        "provider_used": provider.provider_name,
        "records_collected": total_records,
        "duration_ms": duration_ms,
        "is_demo": provider.is_demo,
        "message": f"Successfully collected {total_records} fare observations via {provider.provider_name}" if status_str == "SUCCESS" else f"Failed: {error_msg}"
    }
