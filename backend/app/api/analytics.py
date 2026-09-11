from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Dict, Any, List
from app.database.session import get_db
from app.models.all_models import Route
from app.schemas.all_schemas import AnomalyListResponse, BookingWindowResponse
from app.analytics.anomaly_detector import detect_route_anomalies
from app.analytics.elasticity import calculate_booking_window_elasticity
from app.analytics.forecaster import generate_airfare_forecast

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

@router.get("/forecast")
def get_airfare_forecast(
    route: Optional[str] = "ALL",
    horizon: int = Query(default=30, ge=7, le=90),
    model: str = Query(default="ensemble"),
    db: Session = Depends(get_db)
):
    """
    Computes real-time predictive forecast with historical baseline (solid)
    and future projected trajectory (dashed) with 95% confidence intervals and CPI pass-through.
    """
    return generate_airfare_forecast(db, route_code=route or "ALL", horizon_days=horizon, model_type=model)

