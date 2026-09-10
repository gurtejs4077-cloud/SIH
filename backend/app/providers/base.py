from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import date
from app.schemas.all_schemas import FareObservationCreate

class FareDataProvider(ABC):
    """
    Abstract base class for all airfare data providers.
    Both demo, API, and scraper implementations adhere to this contract.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g., 'DemoProvider', 'APIProvider')"""
        pass

    @property
    @abstractmethod
    def is_demo(self) -> bool:
        """True if the provider returns simulated data, False if verified real data"""
        pass

    @abstractmethod
    async def search_fares(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        advance_days: int,
        distance_km: Optional[float] = None
    ) -> List[FareObservationCreate]:
        """
        Fetch or generate fare observations for a given origin, destination, and departure date.
        """
        pass
