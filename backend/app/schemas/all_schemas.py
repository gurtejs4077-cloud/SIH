from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Fare Schemas ---
class FareObservationBase(BaseModel):
    source: str
    source_url: Optional[str] = None
    airline: str
    flight_number: str
    origin: str
    destination: str
    departure_date: str
    departure_time: str
    arrival_time: str
    advance_days: int
    fare_class: str = "Economy"
    base_fare: float
    taxes: float
    fees: float
    total_fare: float
    currency: str = "INR"
    availability: int = 9
    is_demo: bool = True
    raw_payload: Optional[str] = None

class FareObservationCreate(FareObservationBase):
    pass

class FareObservationResponse(FareObservationBase):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

class FareListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[FareObservationResponse]


# --- Route Schemas ---
class RouteBase(BaseModel):
    code: str
    origin: str
    destination: str
    origin_name: str
    destination_name: str
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    distance_km: float
    cpi_weight: float = 1.0
    is_active: bool = True

class RouteResponse(RouteBase):
    id: int
    current_fare: Optional[float] = None
    baseline_30d: Optional[float] = None
    change_pct: Optional[float] = None
    anomaly_status: Optional[str] = "NORMAL"
    is_demo: bool = True
    model_config = ConfigDict(from_attributes=True)

class RouteDetailResponse(RouteResponse):
    lowest_fare: Optional[float] = None
    highest_fare: Optional[float] = None
    median_fare: Optional[float] = None
    average_fare: Optional[float] = None
    baseline_7d: Optional[float] = None
    airline_stats: List[Dict[str, Any]] = []
    booking_window_stats: List[Dict[str, Any]] = []
    spike_analysis: Optional[Dict[str, Any]] = None
    recent_observations: List[FareObservationResponse] = []


# --- Airline Schemas ---
class AirlineBase(BaseModel):
    code: str
    name: str
    country: str = "India"
    market_share_pct: float = 20.0
    is_active: bool = True

class AirlineResponse(AirlineBase):
    id: int
    current_avg_fare: Optional[float] = None
    avg_fare_7d: Optional[float] = None
    change_pct: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)


# --- Price Index Schemas ---
class PriceIndexResponse(BaseModel):
    id: int
    timestamp: datetime
    index_type: str
    reference_code: str
    base_value: float
    current_value: float
    index_score: float
    daily_change_pct: float
    weekly_change_pct: float
    monthly_change_pct: float
    is_demo: bool
    model_config = ConfigDict(from_attributes=True)

class NationalIndexSummary(BaseModel):
    current_index: float
    daily_change_pct: float
    weekly_change_pct: float
    monthly_change_pct: float
    base_year_reference: str = "2026 = 100.0"
    last_updated: datetime
    total_routes_tracked: int
    total_airlines_tracked: int
    total_observations_count: int
    is_demo_mode: bool
    data_provider_mode: str


# --- Anomaly Schemas ---
class AnomalyItem(BaseModel):
    route: str
    origin: str
    destination: str
    current_price: float
    baseline_7d: float
    baseline_30d: float
    std_dev: float
    percentage_difference: float
    z_score: float
    status: str
    classification_type: str
    classification_reason: str
    cheapest_airline: Optional[str] = None
    is_demo: bool = True
    is_justified: bool = True
    justification_category: str = "NORMAL"
    justification_label: str = ""
    justification_detail: str = ""
    gouging_risk_score: int = 0
    highlight_color: str = "slate"
    is_predatory_alert: bool = False
    reasons_missing: Optional[List[str]] = None
    weather_origin: Optional[Dict[str, Any]] = None
    weather_destination: Optional[Dict[str, Any]] = None
    atf_benchmark: Optional[Dict[str, Any]] = None

class AnomalyListResponse(BaseModel):
    timestamp: datetime
    unusual_count: int
    elevated_count: int
    normal_count: int
    items: List[AnomalyItem]


# --- Booking Window Elasticity ---
class BookingWindowPoint(BaseModel):
    advance_days: int
    label: str
    average_fare: float
    median_fare: float
    min_fare: float
    max_fare: float
    sample_count: int
    savings_vs_last_minute_pct: float
    savings_vs_last_minute_inr: float

class BookingWindowResponse(BaseModel):
    route: Optional[str] = "ALL"
    windows: List[BookingWindowPoint]
    max_saving_description: str


# --- Data Source & Collection Schemas ---
class DataSourceResponse(BaseModel):
    id: int
    name: str
    provider_type: str
    base_url: Optional[str]
    status: str
    last_run: Optional[datetime]
    total_records: int
    description: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class CollectionLogResponse(BaseModel):
    id: int
    timestamp: datetime
    provider_type: str
    status: str
    records_fetched: int
    duration_ms: int
    error_message: Optional[str]
    is_demo: bool
    model_config = ConfigDict(from_attributes=True)

class CollectionTriggerResponse(BaseModel):
    status: str
    provider_used: str
    records_collected: int
    duration_ms: int
    is_demo: bool
    message: str


# --- MoSPI eSankhyiki & RBI MPC Schemas ---
class MoSPITransportCPIResponse(BaseModel):
    id: int
    period: str
    urban_transport_cpi: float
    rural_transport_cpi: float
    combined_transport_cpi: float
    headline_cpi_urban: float
    headline_cpi_rural: float
    headline_cpi_combined: float
    urban_transport_weight: float
    rural_transport_weight: float
    combined_transport_weight: float
    airfare_sub_share_urban: float
    airfare_sub_share_rural: float
    airfare_sub_share_combined: float
    source: str
    is_verified: bool
    model_config = ConfigDict(from_attributes=True)

class TransmissionBracket(BaseModel):
    bracket: str # "Urban", "Rural", "Combined"
    basket_weight_pct: float # weight in overall CPI
    airfare_share_in_subgroup: float # weight of airfare inside transport subgroup
    effective_airfare_weight_in_headline: float # weight of airfare in headline CPI
    benchmark_transport_cpi: float # official MoSPI eSankhyiki
    augmented_transport_cpi: float # real-time airfare augmented
    subgroup_inflation_impact_pct: float
    headline_pass_through_bps: float # basis points impact (e.g. +14.2 bps)

class CPITransmissionResponse(BaseModel):
    benchmark_period: str
    airfare_index_current: float
    airfare_index_change_pct: float
    brackets: List[TransmissionBracket]
    methodology_note: str

class RBIMPCPassThroughResponse(BaseModel):
    policy_benchmark_date: str
    repo_rate: float
    official_stance: str # "ACCOMMODATIVE", "NEUTRAL", "WITHDRAWAL_OF_ACCOMMODATION"
    target_cpi: float # 4.0%
    upper_tolerance: float # 6.0%
    lower_tolerance: float # 2.0%
    headline_cpi_baseline: float # e.g. 5.12%
    airfare_direct_pass_through_bps: float # e.g. 18.4 bps
    airfare_second_round_pass_through_bps: float # e.g. 6.2 bps
    headline_cpi_augmented: float # e.g. 5.37%
    distance_to_upper_ceiling_pct: float # 6.0 - augmented
    stance_impact_assessment: str # "ACCOMMODATIVE_CUSHION", "NEUTRAL_BALANCED", "HAWKISH_PRESSURE"
    policy_summary_rationale: str
