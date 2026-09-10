from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.all_models import FareObservation, Route, Airline, PriceIndex

def calculate_airfare_price_index(db: Session) -> Dict[str, Any]:
    """
    Computes the Prototype Airfare Price Index for CPI Augmentation.
    Methodology:
      Laspeyres-style weighted basket where each route r has weight w_r.
      Route Index I_r = (Current Average Fare / Base Fare) * 100
      National Index I_nat = Sum(w_r * I_r) / Sum(w_r)
    """
    routes = db.query(Route).filter(Route.is_active == True).all()
    if not routes:
        return {
            "national_index": 100.0,
            "daily_change_pct": 0.0,
            "weekly_change_pct": 0.0,
            "monthly_change_pct": 0.0,
            "route_indices": [],
            "airline_indices": []
        }

    now = datetime.utcnow()
    d1_ago = now - timedelta(days=1)
    d7_ago = now - timedelta(days=7)
    d30_ago = now - timedelta(days=30)

    total_weight = sum(r.cpi_weight for r in routes) or 1.0
    weighted_index_sum = 0.0
    weighted_d1_sum = 0.0
    weighted_d7_sum = 0.0
    weighted_d30_sum = 0.0

    route_indices: List[Dict[str, Any]] = []

    for route in routes:
        # Base fare: 30-day historical average
        obs_all = db.query(FareObservation.total_fare).filter(
            FareObservation.origin == route.origin,
            FareObservation.destination == route.destination
        ).all()

        if not obs_all:
            continue

        base_fare = sum(o[0] for o in obs_all) / len(obs_all)

        # Current fare (latest 10 observations)
        latest_obs = db.query(FareObservation.total_fare).filter(
            FareObservation.origin == route.origin,
            FareObservation.destination == route.destination
        ).order_by(FareObservation.timestamp.desc()).limit(10).all()

        current_fare = (sum(o[0] for o in latest_obs) / len(latest_obs)) if latest_obs else base_fare

        # 1-day ago fare
        obs_1d = db.query(FareObservation.total_fare).filter(
            FareObservation.origin == route.origin,
            FareObservation.destination == route.destination,
            FareObservation.timestamp <= d1_ago
        ).order_by(FareObservation.timestamp.desc()).limit(10).all()
        fare_1d = (sum(o[0] for o in obs_1d) / len(obs_1d)) if obs_1d else current_fare

        # 7-day ago fare
        obs_7d = db.query(FareObservation.total_fare).filter(
            FareObservation.origin == route.origin,
            FareObservation.destination == route.destination,
            FareObservation.timestamp <= d7_ago
        ).order_by(FareObservation.timestamp.desc()).limit(10).all()
        fare_7d = (sum(o[0] for o in obs_7d) / len(obs_7d)) if obs_7d else base_fare

        # 30-day baseline
        fare_30d = base_fare

        # Calculate indices (base 100.0)
        route_index = (current_fare / max(base_fare, 1.0)) * 100.0
        route_index_1d = (fare_1d / max(base_fare, 1.0)) * 100.0
        route_index_7d = (fare_7d / max(base_fare, 1.0)) * 100.0

        daily_change = ((current_fare - fare_1d) / max(fare_1d, 1.0)) * 100.0
        weekly_change = ((current_fare - fare_7d) / max(fare_7d, 1.0)) * 100.0
        monthly_change = ((current_fare - fare_30d) / max(fare_30d, 1.0)) * 100.0

        weight = route.cpi_weight
        weighted_index_sum += route_index * weight
        weighted_d1_sum += route_index_1d * weight
        weighted_d7_sum += route_index_7d * weight
        weighted_d30_sum += 100.0 * weight

        route_indices.append({
            "route": route.code,
            "origin": route.origin,
            "destination": route.destination,
            "weight": weight,
            "current_fare": round(current_fare, 2),
            "base_fare": round(base_fare, 2),
            "index_score": round(route_index, 1),
            "daily_change_pct": round(daily_change, 2),
            "weekly_change_pct": round(weekly_change, 2),
            "monthly_change_pct": round(monthly_change, 2)
        })

    national_index = weighted_index_sum / total_weight if total_weight else 100.0
    national_1d = weighted_d1_sum / total_weight if total_weight else 100.0
    national_7d = weighted_d7_sum / total_weight if total_weight else 100.0

    nat_daily_change = ((national_index - national_1d) / national_1d) * 100.0 if national_1d else 0.0
    nat_weekly_change = ((national_index - national_7d) / national_7d) * 100.0 if national_7d else 0.0
    nat_monthly_change = national_index - 100.0 # vs base 100

    # Calculate Airline Price Indices
    airlines = db.query(Airline).filter(Airline.is_active == True).all()
    airline_indices: List[Dict[str, Any]] = []
    for airline in airlines:
        airline_obs = db.query(FareObservation.total_fare).filter(
            FareObservation.airline == airline.name
        ).order_by(FareObservation.timestamp.desc()).limit(30).all()

        if airline_obs:
            fares = [o[0] for o in airline_obs]
            current_avg = sum(fares[:10]) / min(len(fares), 10)
            baseline_avg = sum(fares) / len(fares)
            idx_score = (current_avg / max(baseline_avg, 1.0)) * 100.0
            airline_indices.append({
                "airline_code": airline.code,
                "airline_name": airline.name,
                "market_share_pct": airline.market_share_pct,
                "current_avg_fare": round(current_avg, 2),
                "baseline_avg_fare": round(baseline_avg, 2),
                "index_score": round(idx_score, 1),
                "change_pct": round(((current_avg - baseline_avg) / baseline_avg) * 100.0, 2)
            })

    return {
        "national_index": round(national_index, 1),
        "daily_change_pct": round(nat_daily_change, 2),
        "weekly_change_pct": round(nat_weekly_change, 2),
        "monthly_change_pct": round(nat_monthly_change, 2),
        "route_indices": route_indices,
        "airline_indices": airline_indices
    }
