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

@router.get("/external-drivers")
def get_external_drivers_telemetry():
    """
    Returns live Aviation Turbine Fuel (ATF) benchmarks, real-time meteorological
    airport weather & cyclone alerts across India, and active festive demand corridors.
    """
    from app.analytics.causal_engine import (
        get_current_atf_benchmark,
        fetch_live_airport_weather,
        get_active_festival_alerts,
        INDIAN_AIRPORTS
    )

    atf = get_current_atf_benchmark()
    festivals = get_active_festival_alerts()
    
    # Query key major hubs
    weather_reports = []
    active_cyclone_alerts = []
    active_disruptions = []

    for code in ["DEL", "BOM", "BLR", "HYD", "CCU", "MAA", "GOI", "PNQ"]:
        report = fetch_live_airport_weather(code)
        weather_reports.append(report)
        if report.get("is_cyclone_alert"):
            active_cyclone_alerts.append(report)
        elif report.get("is_disrupted"):
            active_disruptions.append(report)

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "atf_fuel_benchmark": atf,
        "airport_weather": weather_reports,
        "active_cyclone_alerts": active_cyclone_alerts,
        "active_disruptions": active_disruptions,
        "active_festivals": festivals,
        "source": "Ministry of Petroleum (PPAC) + Open-Meteo IMD Weather Gateway"
    }

@router.get("/anti-gouging-audit")
def get_anti_gouging_audit(db: Session = Depends(get_db)):
    """
    Flags domestic route corridors exhibiting unprovoked, predatory fare spikes:
    Fares hiked > 15% without fuel, weather, or festive justification.
    Formatted for DGCA and MoSPI anti-profiteering competition compliance.
    """
    anomalies = detect_route_anomalies(db)
    unjustified = [a for a in anomalies if not a.get("is_justified", True)]

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "total_corridors_analyzed": len(anomalies),
        "unjustified_hikes_count": len(unjustified),
        "justified_spikes_count": len(anomalies) - len(unjustified),
        "flagged_corridors": unjustified,
        "audit_severity": "CRITICAL" if any(u.get("gouging_risk_score", 0) > 75 for u in unjustified) else "WARNING",
        "regulatory_note": (
            "Flagged corridors exhibit fare spikes above statistical threshold with normal jet fuel costs, "
            "clear meteorological conditions, and no festive calendar events. Immediate DGCA tariff audit recommended."
        )
    }

