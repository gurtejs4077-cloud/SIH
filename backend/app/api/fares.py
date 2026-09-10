import csv
import io
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime
from app.database.session import get_db
from app.models.all_models import FareObservation
from app.schemas.all_schemas import (
    FareObservationResponse,
    FareListResponse
)

router = APIRouter(prefix="/fares", tags=["Fares"])

@router.get("", response_model=FareListResponse)
def get_fares(
    route: Optional[str] = None,
    airline: Optional[str] = None,
    advance_days: Optional[int] = None,
    min_fare: Optional[float] = None,
    max_fare: Optional[float] = None,
    is_demo: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Get paginated, filterable fare observations.
    Optimized to prevent loading thousands of records unnecessarily into client memory.
    """
    query = db.query(FareObservation)

    if route:
        parts = route.split("-")
        if len(parts) == 2:
            query = query.filter(
                FareObservation.origin == parts[0],
                FareObservation.destination == parts[1]
            )

    if airline:
        query = query.filter(FareObservation.airline == airline)

    if advance_days is not None:
        query = query.filter(FareObservation.advance_days == advance_days)

    if min_fare is not None:
        query = query.filter(FareObservation.total_fare >= min_fare)

    if max_fare is not None:
        query = query.filter(FareObservation.total_fare <= max_fare)

    if is_demo is not None:
        query = query.filter(FareObservation.is_demo == is_demo)

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(FareObservation.timestamp.desc()).offset(offset).limit(page_size).all()

    return FareListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )

@router.get("/latest", response_model=List[FareObservationResponse])
def get_latest_fares(limit: int = 20, db: Session = Depends(get_db)):
    """
    Get the most recently recorded fare observations across all routes.
    """
    return db.query(FareObservation).order_by(FareObservation.timestamp.desc()).limit(limit).all()

@router.get("/history")
def get_fare_history(
    route: Optional[str] = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Returns aggregated daily average, min, and max fares for time-series charts.
    """
    query = db.query(
        FareObservation.departure_date,
        func.avg(FareObservation.total_fare).label("avg_fare"),
        func.min(FareObservation.total_fare).label("min_fare"),
        func.max(FareObservation.total_fare).label("max_fare"),
        func.count(FareObservation.id).label("obs_count")
    )

    if route and route != "ALL":
        parts = route.split("-")
        if len(parts) == 2:
            query = query.filter(
                FareObservation.origin == parts[0],
                FareObservation.destination == parts[1]
            )

    results = query.group_by(FareObservation.departure_date).order_by(FareObservation.departure_date.asc()).all()

    return [
        {
            "date": r[0],
            "average_fare": round(float(r[1]), 2),
            "min_fare": round(float(r[2]), 2),
            "max_fare": round(float(r[3]), 2),
            "count": r[4]
        }
        for r in results
    ]

@router.get("/export")
def export_fares_csv(
    route: Optional[str] = None,
    airline: Optional[str] = None,
    is_demo: Optional[bool] = None,
    limit: int = 5000,
    db: Session = Depends(get_db)
):
    """
    Export observed fares as a standardized CSV file.
    Includes: timestamp, source, airline, origin, destination, departure_date, advance_days, base_fare, taxes, fees, total_fare, is_demo.
    """
    query = db.query(FareObservation)

    if route:
        parts = route.split("-")
        if len(parts) == 2:
            query = query.filter(
                FareObservation.origin == parts[0],
                FareObservation.destination == parts[1]
            )

    if airline:
        query = query.filter(FareObservation.airline == airline)

    if is_demo is not None:
        query = query.filter(FareObservation.is_demo == is_demo)

    records = query.order_by(FareObservation.timestamp.desc()).limit(limit).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "timestamp",
        "source",
        "airline",
        "flight_number",
        "origin",
        "destination",
        "departure_date",
        "departure_time",
        "arrival_time",
        "advance_days",
        "fare_class",
        "base_fare",
        "taxes",
        "fees",
        "total_fare",
        "currency",
        "is_demo"
    ])

    for r in records:
        writer.writerow([
            r.timestamp.isoformat() if r.timestamp else "",
            r.source,
            r.airline,
            r.flight_number,
            r.origin,
            r.destination,
            r.departure_date,
            r.departure_time,
            r.arrival_time,
            r.advance_days,
            r.fare_class,
            r.base_fare,
            r.taxes,
            r.fees,
            r.total_fare,
            r.currency,
            "YES" if r.is_demo else "NO"
        ])

    output.seek(0)
    filename = f"airfare_observations_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
