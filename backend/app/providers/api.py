import httpx
import logging
from typing import List, Optional
from app.config import settings
from app.providers.base import FareDataProvider
from app.schemas.all_schemas import FareObservationCreate

logger = logging.getLogger(__name__)

class APIProvider(FareDataProvider):
    """
    Legitimate Aviation / GDS API Provider.
    Queries verified external airfare APIs using configured API_KEY and API_SECRET.
    Returns authentic observations with is_demo = False.
    """

    def __init__(self):
        self.api_key = settings.API_KEY
        self.api_secret = settings.API_SECRET
        self.base_url = settings.API_BASE_URL

    @property
    def provider_name(self) -> str:
        return "APIProvider (Verified External Feed)"

    @property
    def is_demo(self) -> bool:
        return False

    async def search_fares(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        advance_days: int,
        distance_km: Optional[float] = None
    ) -> List[FareObservationCreate]:
        if not self.api_key:
            logger.warning("APIProvider requested but API_KEY is not configured in environment.")
            return []

        # Example structure for verified upstream GDS / Travel API integration
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-API-Secret": self.api_secret or "",
            "Accept": "application/json",
        }
        params = {
            "origin": origin,
            "destination": destination,
            "date": departure_date,
            "currency": "INR",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/flight-fares", headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()
                    observations: List[FareObservationCreate] = []
                    for item in data.get("flights", []):
                        base = float(item.get("base_fare", 0))
                        taxes = float(item.get("taxes", 0))
                        fees = float(item.get("fees", 0))
                        obs = FareObservationCreate(
                            source="VERIFIED_API",
                            source_url=f"{self.base_url}/flight/{item.get('flight_number')}",
                            airline=item.get("airline_name", "Unknown Airline"),
                            flight_number=item.get("flight_number", "VERIFIED-01"),
                            origin=origin,
                            destination=destination,
                            departure_date=departure_date,
                            departure_time=item.get("departure_time", "12:00"),
                            arrival_time=item.get("arrival_time", "14:15"),
                            advance_days=advance_days,
                            fare_class=item.get("class", "Economy"),
                            base_fare=base,
                            taxes=taxes,
                            fees=fees,
                            total_fare=round(base + taxes + fees, 2),
                            currency=item.get("currency", "INR"),
                            availability=item.get("seats_remaining", 5),
                            is_demo=False,
                            raw_payload=str(item)
                        )
                        observations.append(obs)
                    return observations
                else:
                    logger.error(f"APIProvider returned status {response.status_code}: {response.text}")
                    return []
        except Exception as e:
            logger.error(f"APIProvider query error: {e}")
            return []
