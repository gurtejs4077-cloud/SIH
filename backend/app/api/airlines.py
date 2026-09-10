from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from app.database.session import get_db
from app.models.all_models import Airline, FareObservation
from app.schemas.all_schemas import AirlineResponse

router = APIRouter(prefix="/airlines", tags=["Airlines"])

@router.get("", response_model=List[AirlineResponse])
def get_airlines(db: Session = Depends(get_db)):
    """
    Get all tracked airlines with current average fare and 7-day trend.
    """
    airlines = db.query(Airline).filter(Airline.is_active == True).all()
    results = []

    now = datetime.utcnow()
    d7_ago = now - timedelta(days=7)

    for airline in airlines:
        # Current observations
        latest = db.query(FareObservation.total_fare).filter(
            FareObservation.airline == airline.name
        ).order_by(FareObservation.timestamp.desc()).limit(15).all()

        current_avg = (sum(o[0] for o in latest) / len(latest)) if latest else None

        # 7-day observations
        past_7d = db.query(FareObservation.total_fare).filter(
            FareObservation.airline == airline.name,
            FareObservation.timestamp >= d7_ago
        ).all()

        avg_7d = (sum(o[0] for o in past_7d) / len(past_7d)) if past_7d else current_avg

        change_pct = None
        if current_avg and avg_7d and avg_7d > 0:
            change_pct = ((current_avg - avg_7d) / avg_7d) * 100.0

        results.append(AirlineResponse(
            id=airline.id,
            code=airline.code,
            name=airline.name,
            country=airline.country,
            market_share_pct=airline.market_share_pct,
            is_active=airline.is_active,
            current_avg_fare=round(current_avg, 2) if current_avg else None,
            avg_fare_7d=round(avg_7d, 2) if avg_7d else None,
            change_pct=round(change_pct, 1) if change_pct is not None else None
        ))

    return results
