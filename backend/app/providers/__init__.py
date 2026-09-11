import logging
from app.config import settings
from app.providers.base import FareDataProvider
from app.providers.demo import DemoProvider
from app.providers.api import APIProvider

logger = logging.getLogger(__name__)

def get_data_provider() -> FareDataProvider:
    """
    Factory to retrieve active data provider based on DATA_PROVIDER env variable.
    Values: 'demo', 'api', 'scraper'
    """
    mode = settings.DATA_PROVIDER.lower()
    if mode == "api":
        logger.info("Initializing APIProvider")
        return APIProvider()
    elif mode == "scraper":
        try:
            from app.providers.scraper import ScraperProvider
            logger.info("Initializing ScraperProvider")
            return ScraperProvider()
        except Exception as e:
            logger.warning(f"Could not load ScraperProvider: {e}. Falling back to DemoProvider.")
            return DemoProvider()
    else:
        logger.info("Initializing DemoProvider (Simulated mode)")
        return DemoProvider()

__all__ = ["FareDataProvider", "DemoProvider", "APIProvider", "get_data_provider"]
