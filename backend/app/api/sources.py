from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.config import settings
from app.database.session import get_db
from app.models.all_models import DataSource, FareObservation
from app.schemas.all_schemas import DataSourceResponse

router = APIRouter(prefix="/sources", tags=["Data Sources"])

@router.get("", response_model=List[DataSourceResponse])
def get_data_sources(db: Session = Depends(get_db)):
    """
    Get configured data sources with connection status and transparency telemetry.
    """
    sources = db.query(DataSource).all()
    if not sources:
        # Default list showing the transparency architecture
        sources = [
            DataSource(
                name="Synthetic Fare Simulation Engine",
                provider_type="DEMO",
                base_url="demo://internal-simulation-engine",
                status="SIMULATION" if settings.DATA_PROVIDER == "demo" else "OFFLINE",
                description="Statistically calibrated Indian domestic airfare simulation with price elasticity models."
            ),
            DataSource(
                name="Aviation GDS / Aggregator API",
                provider_type="API",
                base_url=settings.API_BASE_URL,
                status="ACTIVE" if settings.API_KEY else "OFFLINE",
                description="Legitimate GDS / OTA API integration for verified live observations."
            ),
            DataSource(
                name="Public Airline Transparency Scraper",
                provider_type="SCRAPER",
                base_url="https://airportsindia.org.in",
                status="ACTIVE" if settings.DATA_PROVIDER == "scraper" else "OFFLINE",
                description="Ethical, rate-limited public observation connector adhering strictly to robots.txt."
            )
        ]
        db.add_all(sources)
        db.commit()
        sources = db.query(DataSource).all()

    return sources
