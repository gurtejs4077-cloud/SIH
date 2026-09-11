export interface FareObservation {
  id: number;
  timestamp: string;
  source: string;
  source_url?: string;
  airline: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  advance_days: number;
  fare_class: string;
  base_fare: number;
  taxes: number;
  fees: number;
  total_fare: number;
  currency: string;
  availability: number;
  is_demo: boolean;
}

export interface RouteItem {
  id: number;
  code: string;
  origin: string;
  destination: string;
  origin_name: string;
  destination_name: string;
  origin_lat: number;
  origin_lng: number;
  dest_lat: number;
  dest_lng: number;
  distance_km: number;
  cpi_weight: number;
  is_active: boolean;
  current_fare?: number;
  baseline_30d?: number;
  change_pct?: number;
  anomaly_status?: 'NORMAL' | 'ELEVATED' | 'UNUSUALLY HIGH' | 'EXTREME';
  is_demo: boolean;
}

export interface RouteDetail extends RouteItem {
  lowest_fare?: number;
  highest_fare?: number;
  median_fare?: number;
  average_fare?: number;
  baseline_7d?: number;
  airline_stats: Array<{
    airline: string;
    current_fare: number;
    average_fare: number;
    sample_count: number;
  }>;
  booking_window_stats: BookingWindowPoint[];
  spike_analysis?: {
    classification: 'NORMAL' | 'ELEVATED' | 'TEMPORARY SPIKE' | 'PERSISTENT INCREASE';
    reason: string;
    is_persistent: boolean;
    consecutive_increases: number;
  };
  recent_observations: FareObservation[];
}

export interface AirlineItem {
  id: number;
  code: string;
  name: string;
  country: string;
  market_share_pct: number;
  is_active: boolean;
  current_avg_fare?: number;
  avg_fare_7d?: number;
  change_pct?: number;
}

export interface NationalIndexSummary {
  current_index: number;
  daily_change_pct: number;
  weekly_change_pct: number;
  monthly_change_pct: number;
  base_year_reference: string;
  last_updated: string;
  total_routes_tracked: number;
  total_airlines_tracked: number;
  total_observations_count: number;
  is_demo_mode: boolean;
  data_provider_mode: string;
}

export interface IndexResponse {
  summary: NationalIndexSummary;
  routes: Array<{
    route: string;
    origin: string;
    destination: string;
    weight: number;
    current_fare: number;
    base_fare: number;
    index_score: number;
    daily_change_pct: number;
    weekly_change_pct: number;
    monthly_change_pct: number;
  }>;
  airlines: Array<{
    airline_code: string;
    airline_name: string;
    market_share_pct: number;
    current_avg_fare: number;
    baseline_avg_fare: number;
    index_score: number;
    change_pct: number;
  }>;
}

export interface AnomalyItem {
  route: string;
  origin: string;
  destination: string;
  current_price: number;
  baseline_7d: number;
  baseline_30d: number;
  std_dev: number;
  percentage_difference: number;
  z_score: number;
  status: 'NORMAL' | 'ELEVATED' | 'UNUSUALLY HIGH' | 'EXTREME';
  classification_type: 'NORMAL' | 'ELEVATED' | 'TEMPORARY SPIKE' | 'PERSISTENT INCREASE';
  classification_reason: string;
  cheapest_airline?: string;
  is_demo: boolean;
  // Causal and anti-gouging telemetry
  is_justified?: boolean;
  justification_category?: 'WEATHER_CYCLONE' | 'WEATHER_DISRUPTION' | 'FUEL_COST' | 'FESTIVAL_PEAK' | 'UNJUSTIFIED_GOUGING' | 'NORMAL';
  justification_label?: string;
  justification_detail?: string;
  gouging_risk_score?: number;
  highlight_color?: 'red' | 'amber' | 'green' | 'blue' | 'slate';
  is_predatory_alert?: boolean;
  reasons_missing?: string[];
  weather_origin?: AirportWeatherStatus;
  weather_destination?: AirportWeatherStatus;
  atf_benchmark?: ATFFuelBenchmark;
}

export interface AirportWeatherStatus {
  airport: string;
  airport_name?: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  is_disrupted: boolean;
  condition: string;
  wind_speed_kmh: number;
  wind_gusts_kmh: number;
  temp_c: number;
  is_cyclone_alert: boolean;
  is_fog_alert: boolean;
  source?: string;
}

export interface ATFFuelBenchmark {
  price_per_kl_inr: number;
  baseline_30d_inr: number;
  mom_pct_change: number;
  fuel_cost_share_pct: number;
  status: 'STABLE' | 'SURGING' | 'DECLINING';
  last_revised: string;
  justifiable_fare_impact_pct: number;
  fuel_surcharge_eligible: boolean;
  telemetry_source: string;
}

export interface ExternalDriversResponse {
  timestamp: string;
  atf_fuel_benchmark: ATFFuelBenchmark;
  airport_weather: AirportWeatherStatus[];
  active_cyclone_alerts: AirportWeatherStatus[];
  active_disruptions: AirportWeatherStatus[];
  active_festivals: Array<{
    name: string;
    impact_corridors: string[];
    expected_surge_band: string;
    status: string;
  }>;
  source: string;
}

export interface AntiGougingAuditResponse {
  timestamp: string;
  total_corridors_analyzed: number;
  unjustified_hikes_count: number;
  justified_spikes_count: number;
  flagged_corridors: AnomalyItem[];
  audit_severity: 'CRITICAL' | 'WARNING' | 'NORMAL';
  regulatory_note: string;
}

export interface AnomalyListResponse {
  timestamp: string;
  unusual_count: number;
  elevated_count: number;
  normal_count: number;
  items: AnomalyItem[];
}

export interface BookingWindowPoint {
  advance_days: number;
  label: string;
  average_fare: number;
  median_fare: number;
  min_fare: number;
  max_fare: number;
  sample_count: number;
  savings_vs_last_minute_pct: number;
  savings_vs_last_minute_inr: number;
}

export interface BookingWindowResponse {
  route: string;
  windows: BookingWindowPoint[];
  max_saving_description: string;
}

export interface DataSourceItem {
  id: number;
  name: string;
  provider_type: 'DEMO' | 'API' | 'SCRAPER';
  base_url?: string;
  status: 'ACTIVE' | 'SIMULATION' | 'OFFLINE';
  last_run?: string;
  total_records: number;
  description?: string;
}

export interface CollectionLogItem {
  id: number;
  timestamp: string;
  provider_type: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  records_fetched: number;
  duration_ms: number;
  error_message?: string;
  is_demo: boolean;
}

export interface CollectionStatus {
  active_provider: string;
  is_demo_mode: boolean;
  interval_minutes: number;
  last_collection?: string;
  next_collection?: string;
  total_successful_runs: number;
  total_failed_runs: number;
  recent_logs: CollectionLogItem[];
}

// MoSPI eSankhyiki & RBI MPC Types
export interface MoSPITransportCPIItem {
  id: number;
  period: string;
  urban_transport_cpi: number;
  rural_transport_cpi: number;
  combined_transport_cpi: number;
  headline_cpi_urban: number;
  headline_cpi_rural: number;
  headline_cpi_combined: number;
  urban_transport_weight: number;
  rural_transport_weight: number;
  combined_transport_weight: number;
  airfare_sub_share_urban: number;
  airfare_sub_share_rural: number;
  airfare_sub_share_combined: number;
  source: string;
  is_verified: boolean;
}

export interface TransmissionBracket {
  bracket: 'Urban' | 'Rural' | 'Combined';
  basket_weight_pct: number;
  airfare_share_in_subgroup: number;
  effective_airfare_weight_in_headline: number;
  benchmark_transport_cpi: number;
  augmented_transport_cpi: number;
  subgroup_inflation_impact_pct: number;
  headline_pass_through_bps: number;
}

export interface CPITransmissionResponse {
  benchmark_period: string;
  airfare_index_current: number;
  airfare_index_change_pct: number;
  brackets: TransmissionBracket[];
  methodology_note: string;
}

export interface RBIMPCPassThroughResponse {
  policy_benchmark_date: string;
  repo_rate: number;
  official_stance: string;
  target_cpi: number;
  upper_tolerance: number;
  lower_tolerance: number;
  headline_cpi_baseline: number;
  airfare_direct_pass_through_bps: number;
  airfare_second_round_pass_through_bps: number;
  headline_cpi_augmented: number;
  distance_to_upper_ceiling_pct: number;
  stance_impact_assessment: 'ACCOMMODATIVE_CUSHION' | 'NEUTRAL_BALANCED' | 'HAWKISH_PRESSURE';
  policy_summary_rationale: string;
}
