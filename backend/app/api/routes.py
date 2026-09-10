from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.database.session import get_db
from app.models.all_models import Route, FareObservation
from app.schemas.all_schemas import RouteResponse, RouteDetailResponse
from app.analytics.anomaly_detector import classify_anomaly_status, classify_spike_type
from app.analytics.elasticity import calculate_booking_window_elasticity

router = APIRouter(prefix="/routes", tags=["Routes"])

@router.get("", response_model=List[RouteResponse])
def get_routes(db: Session = Depends(get_db)):
    """
    Get all active flight routes with current fare, 30-day baseline, and anomaly status.
    """
    routes = db.query(Route).filter(Route.is_active == True).all()
    results = []

    now = datetime.utcnow()
    d30_ago = now - timedelta(days=30)

    for route in routes:
        # Latest observations for this route
        latest_obs = db.query(FareObservation).filter(
            FareObservation.origin == route.origin,
            FareObservation.destination == route.destination
        ).order_by(FareObservation.timestamp.desc()).limit(5).all()

        current_fare = None
        baseline_30d = None
        change_pct = None
        anomaly_status = "NORMAL"
        is_demo = True

        if latest_obs:
            current_fare = sum(o.total_fare for o in latest_obs) / len(latest_obs)
            is_demo = latest_obs[0].is_demo

            obs_30d = db.query(FareObservation.total_fare).filter(
                FareObservation.origin == route.origin,
                FareObservation.destination == route.destination,
                FareObservation.timestamp >= d30_ago
            ).all()

            if obs_30d:
                baseline_30d = sum(p[0] for p in obs_30d) / len(obs_30d)
                change_pct = ((current_fare - baseline_30d) / baseline_30d) * 100.0
                anomaly_status = classify_anomaly_status(change_pct)

        results.append(RouteResponse(
            id=route.id,
            code=route.code,
            origin=route.origin,
            destination=route.destination,
            origin_name=route.origin_name,
            destination_name=route.destination_name,
            origin_lat=route.origin_lat,
            origin_lng=route.origin_lng,
            dest_lat=route.dest_lat,
            dest_lng=route.dest_lng,
            distance_km=route.distance_km,
            cpi_weight=route.cpi_weight,
            is_active=route.is_active,
            current_fare=round(current_fare, 2) if current_fare else None,
            baseline_30d=round(baseline_30d, 2) if baseline_30d else None,
            change_pct=round(change_pct, 1) if change_pct is not None else None,
            anomaly_status=anomaly_status,
            is_demo=is_demo
        ))

    return results

@router.get("/{route_code}", response_model=RouteDetailResponse)
def get_route_detail(route_code: str, db: Session = Depends(get_db)):
    """
    Get in-depth analytics, baseline statistics, airline breakdown,
    and spike classification for a specific route (e.g. DEL-BOM).
    """
    route = db.query(Route).filter(Route.code == route_code).first()
    if not route:
        raise HTTPException(status_code=404, detail=f"Route '{route_code}' not found")

    now = datetime.utcnow()
    d7_ago = now - timedelta(days=7)
    d30_ago = now - timedelta(days=30)

    # Observations for this route
    all_obs = db.query(FareObservation).filter(
        FareObservation.origin == route.origin,
        FareObservation.destination == route.destination
    ).order_by(FareObservation.timestamp.desc()).all()

    if not all_obs:
        return RouteDetailResponse(
            id=route.id,
            code=route.code,
            origin=route.origin,
            destination=route.destination,
            origin_name=route.origin_name,
            destination_name=route.destination_name,
            origin_lat=route.origin_lat,
            origin_lng=route.origin_lng,
            dest_lat=route.dest_lat,
            dest_lng=route.dest_lng,
            distance_km=route.distance_km,
            cpi_weight=route.cpi_weight,
            is_active=route.is_active,
            anomaly_status="NORMAL",
            is_demo=True
        )

    all_fares = [o.total_fare for o in all_obs]
    all_fares_sorted = sorted(all_fares)
    lowest_fare = all_fares_sorted[0]
    highest_fare = all_fares_sorted[-1]
    median_fare = all_fares_sorted[len(all_fares_sorted) // 2]
    average_fare = sum(all_fares) / len(all_fares)

    recent_5 = all_obs[:5]
    current_fare = sum(o.total_fare for o in recent_5) / len(recent_5)

    obs_7d = [o.total_fare for o in all_obs if o.timestamp >= d7_ago]
    baseline_7d = (sum(obs_7d) / len(obs_7d)) if obs_7d else average_fare

    obs_30d = [o.total_fare for o in all_obs if o.timestamp >= d30_ago]
    baseline_30d = (sum(obs_30d) / len(obs_30d)) if obs_30d else average_fare

    change_pct = ((current_fare - baseline_30d) / baseline_30d) * 100.0 if baseline_30d else 0.0
    anomaly_status = classify_anomaly_status(change_pct)

    # Airline stats
    airline_map = {}
    for o in all_obs[:60]:
        if o.airline not in airline_map:
            airline_map[o.airline] = []
        airline_map[o.airline].append(o.total_fare)

    airline_stats = []
    for name, fares in airline_map.items():
        avg = sum(fares) / len(fares)
        airline_stats.append({
            "airline": name,
            "current_fare": round(fares[0], 2),
            "average_fare": round(avg, 2),
            "sample_count": len(fares)
        })

    # Booking window stats
    booking_elasticity = calculate_booking_window_elasticity(db, route.code)

    # Trajectory spike analysis
    recent_trend = [o.total_fare for o in reversed(all_obs[:12])]
    spike_analysis = classify_spike_type(recent_trend, baseline_30d)

    is_demo = recent_5[0].is_demo if recent_5 else True

    return RouteDetailResponse(
        id=route.id,
        code=route.code,
        origin=route.origin,
        destination=route.destination,
        origin_name=route.origin_name,
        destination_name=route.destination_name,
        origin_lat=route.origin_lat,
        origin_lng=route.origin_lng,
        dest_lat=route.dest_lat,
        dest_lng=route.dest_lng,
        distance_km=route.distance_km,
        cpi_weight=route.cpi_weight,
        is_active=route.is_active,
        current_fare=round(current_fare, 2),
        lowest_fare=round(lowest_fare, 2),
        highest_fare=round(highest_fare, 2),
        median_fare=round(median_fare, 2),
        average_fare=round(average_fare, 2),
        baseline_7d=round(baseline_7d, 2),
        baseline_30d=round(baseline_30d, 2),
        change_pct=round(change_pct, 1),
        anomaly_status=anomaly_status,
        is_demo=is_demo,
        airline_stats=airline_stats,
        booking_window_stats=booking_elasticity["windows"],
        spike_analysis=spike_analysis,
        recent_observations=all_obs[:20]
    )
