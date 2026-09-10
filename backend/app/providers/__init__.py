import logging
from app.config import settings
from app.providers.base import FareDataProvider
from app.providers.demo import DemoProvider
from app.providers.api import APIProvider
from app.providers.scraper import ScraperProvider

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
        logger.info("Initializing ScraperProvider")
        return ScraperProvider()
    else:
        logger.info("Initializing DemoProvider (Simulated mode)")
        return DemoProvider()

__all__ = ["FareDataProvider", "DemoProvider", "APIProvider", "ScraperProvider", "get_data_provider"]
