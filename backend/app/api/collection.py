from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.config import settings
from app.database.session import get_db
from app.models.all_models import CollectionLog, DataSource
from app.schemas.all_schemas import (
    CollectionLogResponse,
    CollectionTriggerResponse
)
from app.services.collection_service import run_collection_cycle
from app.providers import get_data_provider

router = APIRouter(prefix="/collection", tags=["Data Collection Admin"])

@router.get("/status")
def get_collection_status(db: Session = Depends(get_db)):
    """
    Get collection pipeline status, scheduler interval, last run, and recent execution logs.
    """
    provider = get_data_provider()
    latest_log = db.query(CollectionLog).order_by(CollectionLog.timestamp.desc()).first()

    success_count = db.query(CollectionLog).filter(CollectionLog.status == "SUCCESS").count()
    failed_count = db.query(CollectionLog).filter(CollectionLog.status == "FAILED").count()

    recent_logs = db.query(CollectionLog).order_by(CollectionLog.timestamp.desc()).limit(15).all()

    last_run_time = latest_log.timestamp if latest_log else None
    next_run_time = None
    if last_run_time:
        next_run_time = last_run_time + timedelta(minutes=settings.COLLECTION_INTERVAL_MINUTES)

    return {
        "active_provider": provider.provider_name,
        "is_demo_mode": provider.is_demo,
        "interval_minutes": settings.COLLECTION_INTERVAL_MINUTES,
        "last_collection": last_run_time,
        "next_collection": next_run_time,
        "total_successful_runs": success_count,
        "total_failed_runs": failed_count,
        "recent_logs": [
            CollectionLogResponse(
                id=log.id,
                timestamp=log.timestamp,
                provider_type=log.provider_type,
                status=log.status,
                records_fetched=log.records_fetched,
                duration_ms=log.duration_ms,
                error_message=log.error_message,
                is_demo=log.is_demo
            )
            for log in recent_logs
        ]
    }

@router.post("/trigger", response_model=CollectionTriggerResponse)
async def trigger_collection(db: Session = Depends(get_db)):
    """
    Manually triggers an on-demand data collection cycle across all active routes and booking windows.
    For demo mode, generates new realistic observations.
    For API mode, calls configured external API endpoints.
    """
    result = await run_collection_cycle(db)
    return CollectionTriggerResponse(
        status=result["status"],
        provider_used=result["provider_used"],
        records_collected=result["records_collected"],
        duration_ms=result["duration_ms"],
        is_demo=result["is_demo"],
        message=result["message"]
    )
