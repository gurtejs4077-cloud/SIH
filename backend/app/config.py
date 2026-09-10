import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

    PROJECT_NAME: str = "Indian Airfare Price Intelligence Platform"
    API_V1_STR: str = "/api"
    
    # Provider configuration: "demo", "api", "scraper"
    DATA_PROVIDER: str = os.getenv("DATA_PROVIDER", "scraper").lower()
    
    # Database URL - defaults to local SQLite, can be set to postgresql://...
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./airfare_intelligence.db")
    
    # Collection scheduler interval (minutes)
    COLLECTION_INTERVAL_MINUTES: int = int(os.getenv("COLLECTION_INTERVAL_MINUTES", "30"))
    
    # Credentials for legitimate API provider (optional)
    API_KEY: Optional[str] = os.getenv("API_KEY", None)
    API_SECRET: Optional[str] = os.getenv("API_SECRET", None)
    API_BASE_URL: Optional[str] = os.getenv("API_BASE_URL", "https://api.aviationprovider.com/v1")
    
    # Demo configuration
    DEMO_DAYS_HISTORY: int = 30

settings = Settings()
