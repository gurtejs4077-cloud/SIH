from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.all_models import FareObservation

ADVANCE_WINDOWS = [1, 7, 15, 30, 45]

def calculate_booking_window_elasticity(db: Session, route_code: Optional[str] = None) -> Dict[str, Any]:
    """
    Computes airfare elasticity across advance booking windows:
    T+1, T+7, T+15, T+30, T+45.
    Calculates consumer price premium for late bookings and savings for early planning.
    """
    query = db.query(FareObservation)
    if route_code and route_code != "ALL":
        parts = route_code.split("-")
        if len(parts) == 2:
            query = query.filter(
                FareObservation.origin == parts[0],
                FareObservation.destination == parts[1]
            )

    window_data: List[Dict[str, Any]] = []
    base_t1_fare = 0.0

    for days in ADVANCE_WINDOWS:
        obs = query.filter(FareObservation.advance_days == days).all()
        fares = [o.total_fare for o in obs]

        if fares:
            fares.sort()
            avg_fare = sum(fares) / len(fares)
            median_fare = fares[len(fares) // 2]
            min_fare = fares[0]
            max_fare = fares[-1]
            count = len(fares)
        else:
            avg_fare = median_fare = min_fare = max_fare = 0.0
            count = 0

        if days == 1:
            base_t1_fare = avg_fare

        window_data.append({
            "advance_days": days,
            "label": f"T+{days}",
            "average_fare": round(avg_fare, 2),
            "median_fare": round(median_fare, 2),
            "min_fare": round(min_fare, 2),
            "max_fare": round(max_fare, 2),
            "sample_count": count,
            "savings_vs_last_minute_pct": 0.0,
            "savings_vs_last_minute_inr": 0.0
        })

    # Compute savings relative to T+1 (last-minute fare)
    max_saving_desc = "No booking window comparison available."
    if base_t1_fare > 0:
        for item in window_data:
            if item["advance_days"] > 1 and item["average_fare"] > 0:
                saving_inr = base_t1_fare - item["average_fare"]
                saving_pct = (saving_inr / base_t1_fare) * 100.0
                item["savings_vs_last_minute_inr"] = round(saving_inr, 2)
                item["savings_vs_last_minute_pct"] = round(saving_pct, 1)

        # Highlight T+30 savings per prompt specification
        t30 = next((w for w in window_data if w["advance_days"] == 30), None)
        if t30 and t30["savings_vs_last_minute_inr"] > 0:
            max_saving_desc = (
                f"Average saving from booking 30 days early: ₹{int(t30['savings_vs_last_minute_inr']):,} / {t30['savings_vs_last_minute_pct']:.1f}%"
            )
        else:
            t45 = next((w for w in window_data if w["advance_days"] == 45), None)
            if t45:
                max_saving_desc = f"Maximum advance booking discount: ₹{int(t45['savings_vs_last_minute_inr']):,} / {t45['savings_vs_last_minute_pct']:.1f}%"

    return {
        "route": route_code or "ALL",
        "windows": window_data,
        "max_saving_description": max_saving_desc
    }
