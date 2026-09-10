import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.config import settings
from app.database.session import SessionLocal
from app.services.collection_service import run_collection_cycle

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def scheduled_collection_job():
    logger.info("Executing scheduled airfare data collection cycle...")
    db = SessionLocal()
    try:
        result = await run_collection_cycle(db)
        logger.info(f"Scheduled collection complete: {result['records_collected']} records added.")
    except Exception as e:
        logger.error(f"Error in scheduled collection job: {e}")
    finally:
        db.close()

def start_scheduler():
    interval = settings.COLLECTION_INTERVAL_MINUTES
    logger.info(f"Starting Airfare Collection Scheduler (interval: {interval} minutes)")
    scheduler.add_job(
        scheduled_collection_job,
        "interval",
        minutes=interval,
        id="airfare_collection_job",
        replace_existing=True
    )
    scheduler.start()

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Airfare Collection Scheduler stopped.")
