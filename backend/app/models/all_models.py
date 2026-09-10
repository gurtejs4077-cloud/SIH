import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, Index, UniqueConstraint
)
from app.database.session import Base

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False) # e.g. "DEL-BOM"
    origin = Column(String(3), index=True, nullable=False) # e.g. "DEL"
    destination = Column(String(3), index=True, nullable=False) # e.g. "BOM"
    origin_name = Column(String(100), nullable=False)
    destination_name = Column(String(100), nullable=False)
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lng = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    cpi_weight = Column(Float, default=1.0, nullable=False) # Weight in CPI basket
    is_active = Column(Boolean, default=True)


class Airline(Base):
    __tablename__ = "airlines"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(5), unique=True, index=True, nullable=False) # e.g. "6E"
    name = Column(String(100), nullable=False) # e.g. "IndiGo"
    country = Column(String(50), default="India")
    market_share_pct = Column(Float, default=20.0) # e.g. 60.5% for IndiGo
    is_active = Column(Boolean, default=True)


class FareObservation(Base):
    __tablename__ = "fare_observations"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    source = Column(String(50), nullable=False) # "DEMO_SIMULATOR", "AMADEUS_API", "OFFICIAL_PORTAL"
    source_url = Column(String(255), nullable=True)
    airline = Column(String(50), index=True, nullable=False) # e.g. "IndiGo" or "6E"
    flight_number = Column(String(20), nullable=False) # e.g. "6E-204"
    origin = Column(String(3), index=True, nullable=False) # "DEL"
    destination = Column(String(3), index=True, nullable=False) # "BOM"
    departure_date = Column(String(10), index=True, nullable=False) # "YYYY-MM-DD"
    departure_time = Column(String(8), nullable=False) # "HH:MM"
    arrival_time = Column(String(8), nullable=False) # "HH:MM"
    advance_days = Column(Integer, index=True, nullable=False) # 1, 7, 15, 30, 45
    fare_class = Column(String(20), default="Economy", nullable=False)
    base_fare = Column(Float, nullable=False)
    taxes = Column(Float, nullable=False)
    fees = Column(Float, nullable=False)
    total_fare = Column(Float, index=True, nullable=False)
    currency = Column(String(5), default="INR", nullable=False)
    availability = Column(Integer, default=9)
    is_demo = Column(Boolean, default=True, index=True, nullable=False)
    raw_payload = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_route_departure", "origin", "destination", "departure_date"),
        Index("ix_advance_fare", "advance_days", "total_fare"),
        Index("ix_timestamp_route", "timestamp", "origin", "destination"),
    )


class PriceIndex(Base):
    __tablename__ = "price_index"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    index_type = Column(String(20), index=True, nullable=False) # "NATIONAL", "ROUTE", "AIRLINE"
    reference_code = Column(String(20), index=True, nullable=False) # "ALL", "DEL-BOM", "6E"
    base_value = Column(Float, default=100.0, nullable=False)
    current_value = Column(Float, nullable=False)
    index_score = Column(Float, nullable=False) # e.g. 127.4
    daily_change_pct = Column(Float, default=0.0)
    weekly_change_pct = Column(Float, default=0.0)
    monthly_change_pct = Column(Float, default=0.0)
    is_demo = Column(Boolean, default=True, index=True)


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    provider_type = Column(String(20), nullable=False) # "DEMO", "API", "SCRAPER"
    base_url = Column(String(255), nullable=True)
    status = Column(String(20), default="SIMULATION") # "ACTIVE", "SIMULATION", "OFFLINE"
    last_run = Column(DateTime, nullable=True)
    total_records = Column(Integer, default=0)
    description = Column(Text, nullable=True)


class CollectionLog(Base):
    __tablename__ = "collection_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    provider_type = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False) # "SUCCESS", "PARTIAL", "FAILED"
    records_fetched = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=True)


class MoSPITransportCPI(Base):
    """
    Official MoSPI eSankhyiki Benchmark Series for Transport & Communication subgroup (Base 2012=100)
    Partitioned across Urban, Rural, and Combined brackets.
    """
    __tablename__ = "mospi_transport_cpi"

    id = Column(Integer, primary_key=True, index=True)
    period = Column(String(7), unique=True, index=True, nullable=False) # "YYYY-MM", e.g. "2026-08"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Transport Subgroup CPI (Base 2012=100)
    urban_transport_cpi = Column(Float, nullable=False) # e.g. 172.4
    rural_transport_cpi = Column(Float, nullable=False) # e.g. 164.1
    combined_transport_cpi = Column(Float, nullable=False) # e.g. 168.6

    # Headline CPI (All Items, Base 2012=100)
    headline_cpi_urban = Column(Float, nullable=False) # e.g. 183.2
    headline_cpi_rural = Column(Float, nullable=False) # e.g. 187.5
    headline_cpi_combined = Column(Float, nullable=False) # e.g. 185.4

    # Weights in CPI Basket (%)
    urban_transport_weight = Column(Float, default=9.53, nullable=False) # ~9.53% in Urban CPI
    rural_transport_weight = Column(Float, default=5.68, nullable=False) # ~5.68% in Rural CPI
    combined_transport_weight = Column(Float, default=7.59, nullable=False) # ~7.59% in Combined CPI

    # Airfare share within the transport subgroup (%)
    airfare_sub_share_urban = Column(Float, default=14.2, nullable=False) # Metro concentration
    airfare_sub_share_rural = Column(Float, default=1.8, nullable=False) # Tier-2/Tier-3 UDAN regional
    airfare_sub_share_combined = Column(Float, default=8.6, nullable=False)

    source = Column(String(100), default="MoSPI eSankhyiki Portal", nullable=False)
    is_verified = Column(Boolean, default=True)


class RBIMPCStance(Base):
    """
    Reserve Bank of India Monetary Policy Committee (RBI MPC) Stance & Inflation Corridor
    """
    __tablename__ = "rbi_mpc_stance"

    id = Column(Integer, primary_key=True, index=True)
    policy_date = Column(String(10), unique=True, nullable=False) # "YYYY-MM-DD"
    repo_rate = Column(Float, default=6.50, nullable=False) # e.g. 6.50%
    reverse_repo_rate = Column(Float, default=3.35, nullable=False)
    stance = Column(String(50), default="ACCOMMODATIVE", nullable=False) # "ACCOMMODATIVE", "NEUTRAL", "WITHDRAWAL_OF_ACCOMMODATION"
    target_cpi = Column(Float, default=4.0, nullable=False) # 4.0%
    lower_tolerance = Column(Float, default=2.0, nullable=False) # 2.0%
    upper_tolerance = Column(Float, default=6.0, nullable=False) # 6.0%
    mpc_commentary = Column(Text, nullable=True)
