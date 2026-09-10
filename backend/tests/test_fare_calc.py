import asyncio
import pytest
from app.providers.demo import DemoProvider

def test_fare_normalization_math():
    async def _run():
        provider = DemoProvider()
        fares = await provider.search_fares(
            origin="DEL",
            destination="BOM",
            departure_date="2026-10-15",
            advance_days=7,
            distance_km=1148.0
        )

        assert len(fares) > 0
        for fare in fares:
            # Enforce exact normalization: total_fare == base_fare + taxes + fees
            expected_total = round(fare.base_fare + fare.taxes + fare.fees, 2)
            assert abs(fare.total_fare - expected_total) < 0.01
            assert fare.total_fare > 0
            assert fare.is_demo is True
            assert fare.source == "DEMO_SIMULATOR"

    asyncio.run(_run())

def test_booking_window_elasticity_ordering():
    async def _run():
        provider = DemoProvider()
        
        # Compare T+1 (last-minute) vs T+45 (early booking)
        t1_fares = await provider.search_fares("DEL", "BOM", "2026-10-01", advance_days=1, distance_km=1148.0)
        t45_fares = await provider.search_fares("DEL", "BOM", "2026-11-15", advance_days=45, distance_km=1148.0)

        avg_t1 = sum(f.total_fare for f in t1_fares) / len(t1_fares)
        avg_t45 = sum(f.total_fare for f in t45_fares) / len(t45_fares)

        # Late bookings must be substantially more expensive than 45-day early bookings
        assert avg_t1 > avg_t45
        assert (avg_t1 / avg_t45) > 1.8

    asyncio.run(_run())
