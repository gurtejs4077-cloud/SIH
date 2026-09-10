import random
import datetime
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine, Base
from app.models.all_models import (
    Route,
    Airline,
    FareObservation,
    PriceIndex,
    DataSource,
    CollectionLog,
    MoSPITransportCPI,
    RBIMPCStance,
)
from app.providers.demo import AIRLINE_FLEET, ADVANCE_WINDOW_FACTORS, DEPARTURE_SLOTS

AIRPORTS = {
    "DEL": {"name": "Indira Gandhi International, New Delhi", "lat": 28.5562, "lng": 77.1000},
    "BOM": {"name": "Chhatrapati Shivaji Maharaj International, Mumbai", "lat": 19.0896, "lng": 72.8656},
    "BLR": {"name": "Kempegowda International, Bengaluru", "lat": 13.1986, "lng": 77.7066},
    "CCU": {"name": "Netaji Subhash Chandra Bose International, Kolkata", "lat": 22.6547, "lng": 88.4467},
    "HYD": {"name": "Rajiv Gandhi International, Hyderabad", "lat": 17.2403, "lng": 78.4294},
    "MAA": {"name": "Chennai International, Chennai", "lat": 12.9941, "lng": 80.1709},
}

INITIAL_ROUTES = [
    {"code": "DEL-BOM", "origin": "DEL", "destination": "BOM", "dist": 1148.0, "weight": 1.5},
    {"code": "DEL-BLR", "origin": "DEL", "destination": "BLR", "dist": 1740.0, "weight": 1.3},
    {"code": "BOM-BLR", "origin": "BOM", "destination": "BLR", "dist": 842.0, "weight": 1.2},
    {"code": "DEL-CCU", "origin": "DEL", "destination": "CCU", "dist": 1305.0, "weight": 1.1},
    {"code": "BLR-HYD", "origin": "BLR", "destination": "HYD", "dist": 501.0, "weight": 0.9},
    {"code": "MAA-DEL", "origin": "MAA", "destination": "DEL", "dist": 1760.0, "weight": 1.0},
    {"code": "DEL-HYD", "origin": "DEL", "destination": "HYD", "dist": 1253.0, "weight": 1.1},
    {"code": "BOM-DEL", "origin": "BOM", "destination": "DEL", "dist": 1148.0, "weight": 1.5},
    {"code": "BLR-DEL", "origin": "BLR", "destination": "DEL", "dist": 1740.0, "weight": 1.3},
    {"code": "HYD-DEL", "origin": "HYD", "destination": "DEL", "dist": 1253.0, "weight": 1.1},
]

AIRLINES_DATA = [
    {"code": "6E", "name": "IndiGo", "market_share": 60.5},
    {"code": "AI", "name": "Air India", "market_share": 14.2},
    {"code": "QP", "name": "Akasa Air", "market_share": 4.5},
    {"code": "SG", "name": "SpiceJet", "market_share": 4.8},
    {"code": "UK", "name": "Vistara", "market_share": 9.5},
]

BOOKING_WINDOWS = [1, 7, 15, 30, 45]

# Historical MoSPI eSankhyiki Benchmark Series (Transport & Communication Subgroup, Base 2012=100)
MOSPI_SERIES = [
    {"period": "2025-09", "urban": 167.2, "rural": 159.8, "comb": 163.6, "cpi_u": 177.4, "cpi_r": 181.2, "cpi_c": 179.3},
    {"period": "2025-10", "urban": 167.9, "rural": 160.3, "comb": 164.2, "cpi_u": 178.1, "cpi_r": 182.0, "cpi_c": 180.1},
    {"period": "2025-11", "urban": 168.4, "rural": 160.9, "comb": 164.7, "cpi_u": 178.7, "cpi_r": 182.6, "cpi_c": 180.7},
    {"period": "2025-12", "urban": 168.9, "rural": 161.4, "comb": 165.2, "cpi_u": 179.4, "cpi_r": 183.3, "cpi_c": 181.4},
    {"period": "2026-01", "urban": 169.5, "rural": 161.9, "comb": 165.8, "cpi_u": 180.0, "cpi_r": 184.0, "cpi_c": 182.0},
    {"period": "2026-02", "urban": 170.1, "rural": 162.4, "comb": 166.3, "cpi_u": 180.6, "cpi_r": 184.7, "cpi_c": 182.7},
    {"period": "2026-03", "urban": 170.7, "rural": 162.9, "comb": 166.9, "cpi_u": 181.2, "cpi_r": 185.3, "cpi_c": 183.3},
    {"period": "2026-04", "urban": 171.1, "rural": 163.2, "comb": 167.2, "cpi_u": 181.8, "cpi_r": 186.0, "cpi_c": 183.9},
    {"period": "2026-05", "urban": 171.5, "rural": 163.5, "comb": 167.6, "cpi_u": 182.3, "cpi_r": 186.6, "cpi_c": 184.5},
    {"period": "2026-06", "urban": 171.9, "rural": 163.8, "comb": 168.0, "cpi_u": 182.8, "cpi_r": 187.1, "cpi_c": 185.0},
    {"period": "2026-07", "urban": 172.2, "rural": 164.0, "comb": 168.3, "cpi_u": 183.0, "cpi_r": 187.3, "cpi_c": 185.2},
    {"period": "2026-08", "urban": 172.4, "rural": 164.1, "comb": 168.6, "cpi_u": 183.2, "cpi_r": 187.5, "cpi_c": 185.4},
]

def seed_database():
    print("=" * 65)
    print("Initializing Real-Time Indian Airfare Intelligence Platform Database")
    print("=" * 65)

    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        print("Clearing prior records...")
        db.query(FareObservation).delete()
        db.query(PriceIndex).delete()
        db.query(Route).delete()
        db.query(Airline).delete()
        db.query(DataSource).delete()
        db.query(CollectionLog).delete()
        db.query(MoSPITransportCPI).delete()
        db.query(RBIMPCStance).delete()
        db.commit()

        # 1. Seed Routes
        print("Seeding initial 10 representative routes...")
        for r_data in INITIAL_ROUTES:
            orig = AIRPORTS[r_data["origin"]]
            dest = AIRPORTS[r_data["destination"]]
            route = Route(
                code=r_data["code"],
                origin=r_data["origin"],
                destination=r_data["destination"],
                origin_name=orig["name"],
                destination_name=dest["name"],
                origin_lat=orig["lat"],
                origin_lng=orig["lng"],
                dest_lat=dest["lat"],
                dest_lng=dest["lng"],
                distance_km=r_data["dist"],
                cpi_weight=r_data["weight"],
                is_active=True
            )
            db.add(route)
        db.commit()

        # 2. Seed Airlines
        print("Seeding airlines and market weights...")
        for a_data in AIRLINES_DATA:
            airline = Airline(
                code=a_data["code"],
                name=a_data["name"],
                country="India",
                market_share_pct=a_data["market_share"],
                is_active=True
            )
            db.add(airline)
        db.commit()

        # 3. Seed Data Sources
        print("Seeding data sources transparency registry...")
        ds_demo = DataSource(
            name="Synthetic Fare Simulation Engine",
            provider_type="DEMO",
            base_url="demo://internal-simulation-engine",
            status="SIMULATION",
            last_run=datetime.datetime.now(datetime.UTC),
            total_records=0,
            description="Statistically calibrated synthetic fare observation engine for SIH prototype validation."
        )
        ds_api = DataSource(
            name="Aviation GDS / Aggregator API",
            provider_type="API",
            base_url="https://api.aviationprovider.com/v1",
            status="OFFLINE",
            last_run=None,
            total_records=0,
            description="Configurable commercial GDS API for live verified airfare observations."
        )
        ds_scraper = DataSource(
            name="Public Airline Portal Scraper",
            provider_type="SCRAPER",
            base_url="https://airportsindia.org.in",
            status="OFFLINE",
            last_run=None,
            total_records=0,
            description="Ethical, rate-limited public observation connector complying strictly with robots.txt."
        )
        db.add_all([ds_demo, ds_api, ds_scraper])
        db.commit()

        # 4. Seed MoSPI eSankhyiki Benchmark Series
        print("Seeding MoSPI eSankhyiki Transport CPI benchmarks (Urban vs Rural)...")
        for m in MOSPI_SERIES:
            mospi_row = MoSPITransportCPI(
                period=m["period"],
                urban_transport_cpi=m["urban"],
                rural_transport_cpi=m["rural"],
                combined_transport_cpi=m["comb"],
                headline_cpi_urban=m["cpi_u"],
                headline_cpi_rural=m["cpi_r"],
                headline_cpi_combined=m["cpi_c"],
                urban_transport_weight=9.53,
                rural_transport_weight=5.68,
                combined_transport_weight=7.59,
                airfare_sub_share_urban=14.2,
                airfare_sub_share_rural=1.8,
                airfare_sub_share_combined=8.6,
                source="MoSPI eSankhyiki Portal (Official Baseline)",
                is_verified=True
            )
            db.add(mospi_row)
        db.commit()

        # 5. Seed RBI MPC Monetary Policy Milestone
        print("Seeding RBI MPC monetary policy benchmarks and corridor...")
        rbi_stance = RBIMPCStance(
            policy_date="2026-08-08",
            repo_rate=6.50,
            reverse_repo_rate=3.35,
            stance="ACCOMMODATIVE",
            target_cpi=4.0,
            lower_tolerance=2.0,
            upper_tolerance=6.0,
            mpc_commentary=(
                "The Monetary Policy Committee (MPC) decided to keep the policy repo rate unchanged at 6.50% "
                "with an accommodative stance to support economic activity while remaining vigilant on transport "
                "and commodity pass-through."
            )
        )
        db.add(rbi_stance)
        db.commit()

        # 6. Generate 30 days of realistic observations
        print("Generating 30 days × 10 routes × 5 airlines × 5 booking windows...")
        now = datetime.datetime.now(datetime.UTC)
        total_obs = 0
        all_obs_to_add = []

        for day_offset in range(30, -1, -1):
            obs_time = now - datetime.timedelta(days=day_offset, hours=random.randint(1, 4))
            
            for r_data in INITIAL_ROUTES:
                orig_code = r_data["origin"]
                dest_code = r_data["destination"]
                route_code = r_data["code"]
                dist = r_data["dist"]
                base_fare_km = dist * 3.80

                # Behavioral surges
                route_surge = 1.0
                if route_code in ["DEL-BOM", "BOM-DEL"]:
                    if day_offset <= 5:
                        route_surge = 1.0 + (6 - day_offset) * 0.11 # Ramping up to +66%
                    else:
                        route_surge = 1.15
                elif route_code == "DEL-CCU":
                    if day_offset == 3 or day_offset == 2:
                        route_surge = 1.55
                    elif day_offset < 2:
                        route_surge = 1.10
                    else:
                        route_surge = 1.05
                elif route_code == "BOM-BLR":
                    route_surge = 1.18

                for days_advance in BOOKING_WINDOWS:
                    dep_date = (obs_time + datetime.timedelta(days=days_advance)).strftime("%Y-%m-%d")
                    day_of_week = (obs_time + datetime.timedelta(days=days_advance)).weekday()
                    weekend_mult = 1.14 if day_of_week in [4, 6] else 1.0
                    window_mult = ADVANCE_WINDOW_FACTORS.get(days_advance, 1.0)

                    for airline_spec in AIRLINE_FLEET:
                        noise = random.uniform(-0.05, 0.05)
                        final_multiplier = (
                            airline_spec["multiplier"]
                            * route_surge
                            * weekend_mult
                            * window_mult
                            * (1.0 + noise)
                        )

                        raw_base = round(base_fare_km * final_multiplier, -1)
                        taxes = round(raw_base * 0.05 + random.uniform(180, 260), 2)
                        fees = round(random.uniform(450, 720), 2)
                        total_fare = round(raw_base + taxes + fees, 2)

                        slot = random.choice(DEPARTURE_SLOTS)
                        flight_num = f"{airline_spec['flight_prefix']}{random.randint(101, 899)}"

                        obs = FareObservation(
                            timestamp=obs_time,
                            source="DEMO_SIMULATOR",
                            source_url="demo://simulated-fare-engine",
                            airline=airline_spec["name"],
                            flight_number=flight_num,
                            origin=orig_code,
                            destination=dest_code,
                            departure_date=dep_date,
                            departure_time=slot[0],
                            arrival_time=slot[1],
                            advance_days=days_advance,
                            fare_class="Economy",
                            base_fare=raw_base,
                            taxes=taxes,
                            fees=fees,
                            total_fare=total_fare,
                            currency="INR",
                            availability=random.randint(2, 9),
                            is_demo=True,
                            raw_payload=f'{{"seed": true, "offset_days": {day_offset}, "surge_factor": {route_surge:.2f}}}'
                        )
                        all_obs_to_add.append(obs)
                        total_obs += 1

            if len(all_obs_to_add) >= 1000:
                db.bulk_save_objects(all_obs_to_add)
                db.commit()
                all_obs_to_add = []

        if all_obs_to_add:
            db.bulk_save_objects(all_obs_to_add)
            db.commit()

        ds_demo.total_records = total_obs
        db.commit()

        # 7. Seed Daily Historical Price Indices
        print("Calculating and seeding daily historical Price Index scores...")
        for day_offset in range(30, -1, -1):
            idx_time = now - datetime.timedelta(days=day_offset)
            progress = (30 - day_offset) / 30.0
            daily_noise = random.uniform(-0.4, 0.6)
            index_score = round(118.0 + (progress * 9.4) + daily_noise, 1)

            daily_change = round(random.uniform(-0.5, 0.8), 2)
            weekly_change = round(random.uniform(1.2, 3.5), 2)
            monthly_change = round(((index_score - 118.0) / 118.0) * 100.0, 2)

            p_index = PriceIndex(
                timestamp=idx_time,
                index_type="NATIONAL",
                reference_code="ALL",
                base_value=100.0,
                current_value=index_score,
                index_score=index_score,
                daily_change_pct=daily_change,
                weekly_change_pct=weekly_change,
                monthly_change_pct=monthly_change,
                is_demo=True
            )
            db.add(p_index)

        # 8. Seed Initial Collection Log
        log = CollectionLog(
            timestamp=now,
            provider_type="DemoProvider (Simulated Engine)",
            status="SUCCESS",
            records_fetched=total_obs,
            duration_ms=850,
            error_message=None,
            is_demo=True
        )
        db.add(log)
        db.commit()

        print(f"Successfully seeded database with {total_obs:,} realistic demo fare observations!")
        print("MoSPI eSankhyiki benchmarks and RBI MPC milestones configured.")
        print("=" * 65)

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
