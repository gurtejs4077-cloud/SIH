from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.config import settings
from app.database.session import engine, Base
from app.api import api_router
from app.services.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("airfare_app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Start background scheduler
    logger.info("Starting background collection scheduler...")
    try:
        start_scheduler()
    except Exception as e:
        logger.warning(f"Could not start background scheduler: {e}")
        
    yield
    
    # Shutdown
    logger.info("Shutting down background scheduler...")
    try:
        stop_scheduler()
    except Exception:
        pass

app = FastAPI(
    title="Real-Time Indian Airfare Price Intelligence Platform",
    description=(
        "SIH 2026 Prototype: Development of a Real-time Airfare Price Index for India "
        "through Automated Airfare Observation for Augmentation of the Consumer Price Index (CPI). "
        "Compliant with ethical data collection, transparent Laspeyres index methodology, "
        "and clear demarcations between simulated and verified data."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", tags=["System"])
def health_check():
    """
    Health check endpoint returning system status and active data provider configuration.
    """
    return {
        "status": "healthy",
        "service": "Indian Airfare Price Intelligence Platform",
        "data_provider_mode": settings.DATA_PROVIDER,
        "is_demo_mode": settings.DATA_PROVIDER == "demo",
        "scheduler_interval_minutes": settings.COLLECTION_INTERVAL_MINUTES
    }

# Include API V1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
