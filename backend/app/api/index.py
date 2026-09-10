from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any
from app.config import settings
from app.database.session import get_db
from app.models.all_models import PriceIndex, Route, Airline, FareObservation
from app.schemas.all_schemas import NationalIndexSummary, PriceIndexResponse
from app.analytics.index_calculator import calculate_airfare_price_index

router = APIRouter(prefix="/index", tags=["Price Index"])

@router.get("/current")
def get_current_index(db: Session = Depends(get_db)):
    """
    Get current Prototype Airfare Price Index for CPI Augmentation.
    Includes National Airfare Price Index, daily, weekly, and monthly changes,
    plus route-level and airline-level price indices.
    """
    index_data = calculate_airfare_price_index(db)

    routes_count = db.query(Route).filter(Route.is_active == True).count()
    airlines_count = db.query(Airline).filter(Airline.is_active == True).count()
    total_obs = db.query(FareObservation).count()

    # Authentic indicator: False when real-time scraper or verified API stream is active
    is_demo = settings.DATA_PROVIDER == "demo"

    summary = NationalIndexSummary(
        current_index=index_data["national_index"],
        daily_change_pct=index_data["daily_change_pct"],
        weekly_change_pct=index_data["weekly_change_pct"],
        monthly_change_pct=index_data["monthly_change_pct"],
        base_year_reference="2026 = 100.0 (Prototype CPI Baseline)",
        last_updated=datetime.utcnow(),
        total_routes_tracked=routes_count,
        total_airlines_tracked=airlines_count,
        total_observations_count=total_obs,
        is_demo_mode=is_demo,
        data_provider_mode=settings.DATA_PROVIDER
    )

    return {
        "summary": summary,
        "routes": index_data["route_indices"],
        "airlines": index_data["airline_indices"]
    }

@router.get("/history", response_model=List[PriceIndexResponse])
def get_index_history(limit: int = 30, db: Session = Depends(get_db)):
    """
    Historical trajectory of the National Airfare Price Index.
    """
    return db.query(PriceIndex).filter(
        PriceIndex.index_type == "NATIONAL",
        PriceIndex.reference_code == "ALL"
    ).order_by(PriceIndex.timestamp.desc()).limit(limit).all()
