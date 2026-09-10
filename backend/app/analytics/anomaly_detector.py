import math
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.all_models import FareObservation, Route

def classify_anomaly_status(pct_diff: float) -> str:
    """
    Classify route pricing anomaly status using defined percentage thresholds:
    - NORMAL: <= 15%
    - ELEVATED: 15% to 35%
    - UNUSUALLY HIGH: 35% to 60%
    - EXTREME: > 60%
    """
    if pct_diff > 60.0:
        return "EXTREME"
    elif pct_diff > 35.0:
        return "UNUSUALLY HIGH"
    elif pct_diff > 15.0:
        return "ELEVATED"
    return "NORMAL"

def classify_spike_type(prices: List[float], baseline_30d: float) -> Dict[str, Any]:
    """
    Distinguishes between TEMPORARY SPIKE and PERSISTENT INCREASE.
    
    Temporary Spike:
      Single-day or short (1-2 day) sharp jump with high coefficient of variation
      or subsequent mean reversion.
      Example: [5000, 5100, 8900, 5200, 5000]
    
    Persistent Increase:
      Multi-day continuous increase or consistently elevated for 3+ consecutive periods.
      Example: [5000, 5500, 6000, 6400, 6800, 7100]
    """
    if not prices or len(prices) < 3:
        return {
            "classification": "NORMAL",
            "reason": "Insufficient observation sequence for trajectory classification.",
            "is_persistent": False,
            "consecutive_increases": 0
        }

    current_price = prices[-1]
    pct_above_baseline = ((current_price - baseline_30d) / max(baseline_30d, 1.0)) * 100.0

    # Count consecutive increases in the sequence
    consecutive_increases = 0
    for i in range(len(prices) - 1, 0, -1):
        if prices[i] >= prices[i - 1]:
            consecutive_increases += 1
        else:
            break

    # Calculate recent average of last 3 vs prior
    recent_3 = prices[-3:]
    all_recent_elevated = all((p - baseline_30d) / baseline_30d > 0.15 for p in recent_3)

    if consecutive_increases >= 3 or (all_recent_elevated and pct_above_baseline > 20.0):
        return {
            "classification": "PERSISTENT INCREASE",
            "reason": f"Price increased for {consecutive_increases + 1} consecutive observations. Current price is {pct_above_baseline:+.1f}% above 30-day baseline.",
            "is_persistent": True,
            "consecutive_increases": consecutive_increases + 1
        }
    
    # Check if there is a spike that subsided or a standalone spike
    max_price = max(prices)
    max_idx = prices.index(max_price)
    if max_price > baseline_30d * 1.4:
        if max_idx < len(prices) - 1 and current_price < max_price * 0.85:
            return {
                "classification": "TEMPORARY SPIKE",
                "reason": f"Transient surge detected: peak of ₹{int(max_price):,} reverted to ₹{int(current_price):,} (-{((max_price-current_price)/max_price)*100:.1f}% from peak).",
                "is_persistent": False,
                "consecutive_increases": consecutive_increases
            }
        elif pct_above_baseline > 30.0:
            return {
                "classification": "TEMPORARY SPIKE",
                "reason": f"Isolated sharp spike of {pct_above_baseline:+.1f}% above baseline with high short-term variance.",
                "is_persistent": False,
                "consecutive_increases": consecutive_increases
            }

    if pct_above_baseline > 15.0:
        return {
            "classification": "ELEVATED",
            "reason": f"Fare is {pct_above_baseline:+.1f}% above baseline, within expected seasonal band.",
            "is_persistent": False,
            "consecutive_increases": consecutive_increases
        }

    return {
        "classification": "NORMAL",
        "reason": f"Price is aligned with historical baseline ({pct_above_baseline:+.1f}%).",
        "is_persistent": False,
        "consecutive_increases": consecutive_increases
    }

def detect_route_anomalies(db: Session) -> List[Dict[str, Any]]:
    """
    Calculates current price, 7-day average, 30-day average, standard deviation,
    and anomaly classification for every active route.
    """
    routes = db.query(Route).filter(Route.is_active == True).all()
    results = []

    now = datetime.utcnow()
    d7_ago = now - timedelta(days=7)
    d30_ago = now - timedelta(days=30)

    for route in routes:
        # Latest observations (last 24 hours or most recent available)
        recent_obs = db.query(FareObservation).filter(
            FareObservation.origin == route.origin,
            FareObservation.destination == route.destination
        ).order_by(FareObservation.timestamp.desc()).limit(15).all()

        if not recent_obs:
            continue

        # Current price: median or average of the latest observation batch (e.g. T+1 to T+7 window)
        current_prices = [o.total_fare for o in recent_obs[:5]]
        current_price = sum(current_prices) / len(current_prices)

        # 30-day baseline
        obs_30d = db.query(FareObservation.total_fare).filter(
            FareObservation.origin == route.origin,
            FareObservation.destination == route.destination,
            FareObservation.timestamp >= d30_ago
        ).all()

        prices_30d = [p[0] for p in obs_30d] if obs_30d else current_prices
        baseline_30d = sum(prices_30d) / len(prices_30d) if prices_30d else current_price

        # 7-day baseline
        obs_7d = db.query(FareObservation.total_fare).filter(
            FareObservation.origin == route.origin,
            FareObservation.destination == route.destination,
            FareObservation.timestamp >= d7_ago
        ).all()

        prices_7d = [p[0] for p in obs_7d] if obs_7d else current_prices
        baseline_7d = sum(prices_7d) / len(prices_7d) if prices_7d else baseline_30d

        # Standard deviation
        variance = sum((x - baseline_30d) ** 2 for x in prices_30d) / max(len(prices_30d), 1)
        std_dev = math.sqrt(variance)
        z_score = (current_price - baseline_30d) / (std_dev if std_dev > 0 else 1.0)

        # Percentage difference vs 30-day baseline
        pct_diff = ((current_price - baseline_30d) / max(baseline_30d, 1.0)) * 100.0

        # Anomaly Status
        status = classify_anomaly_status(pct_diff)

        # Trajectory classification (Spike vs Persistent)
        recent_trend_prices = [o.total_fare for o in reversed(recent_obs[:8])]
        spike_info = classify_spike_type(recent_trend_prices, baseline_30d)

        # Find cheapest airline currently
        cheapest_airline = min(recent_obs[:5], key=lambda o: o.total_fare).airline if recent_obs else None
        is_demo_mode = any(o.is_demo for o in recent_obs[:5])

        results.append({
            "route": route.code,
            "origin": route.origin,
            "destination": route.destination,
            "current_price": round(current_price, 2),
            "baseline_7d": round(baseline_7d, 2),
            "baseline_30d": round(baseline_30d, 2),
            "std_dev": round(std_dev, 2),
            "percentage_difference": round(pct_diff, 1),
            "z_score": round(z_score, 2),
            "status": status,
            "classification_type": spike_info["classification"],
            "classification_reason": spike_info["reason"],
            "cheapest_airline": cheapest_airline,
            "is_demo": is_demo_mode,
        })

    # Sort so most anomalous routes appear first
    results.sort(key=lambda x: x["percentage_difference"], reverse=True)
    return results
