from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Dict, Any, List
from app.database.session import get_db
from app.models.all_models import Route
from app.schemas.all_schemas import AnomalyListResponse, BookingWindowResponse
from app.analytics.anomaly_detector import detect_route_anomalies
from app.analytics.elasticity import calculate_booking_window_elasticity

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/anomalies", response_model=AnomalyListResponse)
def get_anomalies(db: Session = Depends(get_db)):
    """
    Detects unusually expensive routes, calculates Z-score, % difference vs baseline,
    and categorizes as NORMAL, ELEVATED, UNUSUALLY HIGH, or EXTREME.
    Also provides algorithmically determined classification (TEMPORARY SPIKE vs PERSISTENT INCREASE).
    """
    anomalies = detect_route_anomalies(db)

    unusual_count = sum(1 for a in anomalies if a["status"] in ["UNUSUALLY HIGH", "EXTREME"])
    elevated_count = sum(1 for a in anomalies if a["status"] == "ELEVATED")
    normal_count = sum(1 for a in anomalies if a["status"] == "NORMAL")

    return AnomalyListResponse(
        timestamp=datetime.utcnow(),
        unusual_count=unusual_count,
        elevated_count=elevated_count,
        normal_count=normal_count,
        items=anomalies
    )

@router.get("/booking-window", response_model=BookingWindowResponse)
def get_booking_window_analysis(
    route: Optional[str] = "ALL",
    db: Session = Depends(get_db)
):
    """
    Returns airfare elasticity across advance booking windows:
    T+1 (1 day before), T+7, T+15, T+30, T+45.
    Computes average savings for early booking (e.g. 30 days early).
    """
    return calculate_booking_window_elasticity(db, route_code=route)
