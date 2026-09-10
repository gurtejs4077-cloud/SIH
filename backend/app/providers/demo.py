import random
import datetime
from typing import List, Optional
from app.providers.base import FareDataProvider
from app.schemas.all_schemas import FareObservationCreate

AIRLINE_FLEET = [
    {"code": "6E", "name": "IndiGo", "multiplier": 1.00, "flight_prefix": "6E-"},
    {"code": "AI", "name": "Air India", "multiplier": 1.12, "flight_prefix": "AI-"},
    {"code": "QP", "name": "Akasa Air", "multiplier": 0.94, "flight_prefix": "QP-"},
    {"code": "SG", "name": "SpiceJet", "multiplier": 0.98, "flight_prefix": "SG-"},
    {"code": "UK", "name": "Vistara", "multiplier": 1.18, "flight_prefix": "UK-"},
]

DEPARTURE_SLOTS = [
    ("06:00", "08:15"),
    ("08:30", "10:45"),
    ("11:15", "13:30"),
    ("14:20", "16:40"),
    ("17:45", "20:00"),
    ("20:30", "22:45"),
    ("22:15", "00:30"),
]

# Booking window elasticity curve multipliers (relative to baseline T+15)
ADVANCE_WINDOW_FACTORS = {
    1: 1.85,   # T+1: last-minute surge (+85%)
    7: 1.32,   # T+7: elevated (+32%)
    15: 1.00,  # T+15: standard baseline
    30: 0.78,  # T+30: early bird discount (-22%)
    45: 0.69,  # T+45: deep advance booking discount (-31%)
}

class DemoProvider(FareDataProvider):
    """
    Demo/Simulated airfare provider.
    Generates realistic, statistically calibrated Indian airfare observations.
    ALWAYS sets is_demo = True and clearly marks data source.
    """

    @property
    def provider_name(self) -> str:
        return "DemoProvider (Simulated Engine)"

    @property
    def is_demo(self) -> bool:
        return True

    async def search_fares(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        advance_days: int,
        distance_km: Optional[float] = None
    ) -> List[FareObservationCreate]:
        results: List[FareObservationCreate] = []
        route_code = f"{origin}-{destination}"

        # Baseline cost per km in India (~₹3.40 to ₹4.20 per km base fare for metro routes)
        dist = distance_km or 1150.0
        base_route_price = dist * 3.75

        # Route-specific market demand bias
        route_bias = 1.0
        if route_code in ["DEL-BOM", "BOM-DEL"]:
            # Heavy business trunk route with higher persistent baseline
            route_bias = 1.35
        elif route_code in ["DEL-CCU"]:
            # Route with recent surge
            route_bias = 1.25
        elif route_code in ["BLR-HYD", "HYD-DEL"]:
            route_bias = 1.05

        # Parse departure date to check day of week
        try:
            dep_dt = datetime.datetime.strptime(departure_date, "%Y-%m-%d")
            day_of_week = dep_dt.weekday() # 4=Fri, 5=Sat, 6=Sun
            weekend_multiplier = 1.15 if day_of_week in [4, 6] else 1.0
        except Exception:
            weekend_multiplier = 1.0

        # Booking window factor
        window_factor = ADVANCE_WINDOW_FACTORS.get(advance_days, 1.0)

        # Generate observations for 3-5 airlines operating this route
        for airline in AIRLINE_FLEET:
            # Deterministic noise based on airline and date for reproducible consistency
            noise = random.uniform(-0.06, 0.06)
            combined_multiplier = airline["multiplier"] * route_bias * weekend_multiplier * window_factor * (1 + noise)
            
            raw_base_fare = round(base_route_price * combined_multiplier, -1) # Round to nearest 10
            
            # Realistic taxes and fees for Indian domestic flights:
            # - GST is typically 5% on economy domestic base fare
            # - User Development Fee (UDF) / Passenger Service Fee (PSF) / Airport charges: ₹350 - ₹950
            taxes = round(raw_base_fare * 0.05 + random.uniform(150, 300), 2)
            fees = round(random.uniform(400, 750), 2)
            total_fare = round(raw_base_fare + taxes + fees, 2)

            slot = random.choice(DEPARTURE_SLOTS)
            flight_num = f"{airline['flight_prefix']}{random.randint(101, 999)}"

            observation = FareObservationCreate(
                source="DEMO_SIMULATOR",
                source_url="demo://simulated-fare-engine",
                airline=airline["name"],
                flight_number=flight_num,
                origin=origin,
                destination=destination,
                departure_date=departure_date,
                departure_time=slot[0],
                arrival_time=slot[1],
                advance_days=advance_days,
                fare_class="Economy",
                base_fare=raw_base_fare,
                taxes=taxes,
                fees=fees,
                total_fare=total_fare,
                currency="INR",
                availability=random.randint(1, 9),
                is_demo=True,
                raw_payload=f'{{"mode": "demo", "simulated_at": "{datetime.datetime.utcnow().isoformat()}", "algorithm": "synthetic_elasticity_v1"}}'
            )
            results.append(observation)

        return results
