import type {
  RouteItem,
  RouteDetail,
  AirlineItem,
  IndexResponse,
  AnomalyListResponse,
  BookingWindowResponse,
  DataSourceItem,
  CollectionStatus,
  FareObservation,
  MoSPITransportCPIItem,
  CPITransmissionResponse,
  RBIMPCPassThroughResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchHealth(): Promise<{ status: string; data_provider_mode: string; is_demo_mode: boolean }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch system health');
  return res.json();
}

export async function fetchRoutes(): Promise<RouteItem[]> {
  const res = await fetch(`${API_BASE}/routes`);
  if (!res.ok) throw new Error('Failed to fetch routes');
  return res.json();
}

export async function fetchRouteDetail(routeCode: string): Promise<RouteDetail> {
  const res = await fetch(`${API_BASE}/routes/${routeCode}`);
  if (!res.ok) throw new Error(`Failed to fetch route ${routeCode}`);
  return res.json();
}

export async function fetchFares(params: Record<string, any> = {}): Promise<{ total: number; page: number; items: FareObservation[] }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const res = await fetch(`${API_BASE}/fares?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch fares');
  return res.json();
}

export async function fetchFareHistory(route: string = 'ALL'): Promise<Array<{ date: string; average_fare: number; min_fare: number; max_fare: number; count: number }>> {
  const res = await fetch(`${API_BASE}/fares/history?route=${route}`);
  if (!res.ok) throw new Error('Failed to fetch fare history');
  return res.json();
}

export async function fetchAirlines(): Promise<AirlineItem[]> {
  const res = await fetch(`${API_BASE}/airlines`);
  if (!res.ok) throw new Error('Failed to fetch airlines');
  return res.json();
}

export async function fetchAnomalies(): Promise<AnomalyListResponse> {
  const res = await fetch(`${API_BASE}/analytics/anomalies`);
  if (!res.ok) throw new Error('Failed to fetch anomalies');
  return res.json();
}

export async function fetchBookingWindow(route: string = 'ALL'): Promise<BookingWindowResponse> {
  const res = await fetch(`${API_BASE}/analytics/booking-window?route=${route}`);
  if (!res.ok) throw new Error('Failed to fetch booking window analytics');
  return res.json();
}

export async function fetchCurrentIndex(): Promise<IndexResponse> {
  const res = await fetch(`${API_BASE}/index/current`);
  if (!res.ok) throw new Error('Failed to fetch price index');
  return res.json();
}

export async function fetchIndexHistory(): Promise<Array<{ id: number; timestamp: string; index_score: number; daily_change_pct: number; weekly_change_pct: number; monthly_change_pct: number }>> {
  const res = await fetch(`${API_BASE}/index/history`);
  if (!res.ok) throw new Error('Failed to fetch index history');
  return res.json();
}

export async function fetchDataSources(): Promise<DataSourceItem[]> {
  const res = await fetch(`${API_BASE}/sources`);
  if (!res.ok) throw new Error('Failed to fetch data sources');
  return res.json();
}

export async function fetchCollectionStatus(): Promise<CollectionStatus> {
  const res = await fetch(`${API_BASE}/collection/status`);
  if (!res.ok) throw new Error('Failed to fetch collection status');
  return res.json();
}

export async function triggerCollection(): Promise<{ status: string; provider_used: string; records_collected: number; duration_ms: number; message: string }> {
  const res = await fetch(`${API_BASE}/collection/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to trigger collection cycle');
  return res.json();
}

export async function fetchMoSPIBenchmarks(): Promise<MoSPITransportCPIItem[]> {
  const res = await fetch(`${API_BASE}/cpi/esankhyiki`);
  if (!res.ok) throw new Error('Failed to fetch MoSPI eSankhyiki benchmarks');
  return res.json();
}

export async function fetchCPITransmission(): Promise<CPITransmissionResponse> {
  const res = await fetch(`${API_BASE}/cpi/transmission`);
  if (!res.ok) throw new Error('Failed to fetch CPI transmission data');
  return res.json();
}

export async function fetchRBIMPCImpact(): Promise<RBIMPCPassThroughResponse> {
  const res = await fetch(`${API_BASE}/cpi/rbi-mpc-impact`);
  if (!res.ok) throw new Error('Failed to fetch RBI MPC impact analysis');
  return res.json();
}

export function getExportCsvUrl(route?: string, airline?: string, is_demo?: boolean): string {
  const query = new URLSearchParams();
  if (route) query.append('route', route);
  if (airline) query.append('airline', airline);
  if (is_demo !== undefined) query.append('is_demo', String(is_demo));
  return `${API_BASE}/fares/export?${query.toString()}`;
}

export interface WhatsAppStatus {
  bridge_running: boolean;
  is_connected: boolean;
  user_number: string | null;
  qr_code: string | null;
}

export async function fetchWhatsAppStatus(): Promise<WhatsAppStatus> {
  const res = await fetch(`${API_BASE}/whatsapp/status`);
  if (!res.ok) throw new Error('Failed to fetch WhatsApp status');
  return res.json();
}

export async function fetchWhatsAppReport(): Promise<{ report: string }> {
  const res = await fetch(`${API_BASE}/whatsapp/report`);
  if (!res.ok) throw new Error('Failed to fetch WhatsApp report preview');
  return res.json();
}

export async function sendWhatsAppReport(recipient?: string, customMessage?: string): Promise<{ success: boolean; recipient: string; messageId?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/whatsapp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient, custom_message: customMessage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to send WhatsApp message' }));
    throw new Error(err.detail?.error || err.detail || 'Failed to send message');
  }
  return res.json();
}

export async function disconnectWhatsApp(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/whatsapp/disconnect`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to unlink WhatsApp session');
  return res.json();
}

export interface ForecastPoint {
  date: string;
  formatted_date: string;
  fare_actual: number | null;
  fare_predicted: number | null;
  index_actual: number | null;
  index_predicted: number | null;
  lower_bound: number | null;
  upper_bound: number | null;
  is_future: boolean;
  day_name: string;
}

export interface ForecastResponse {
  route_code: string;
  horizon_days: number;
  model_type: string;
  baseline_reference_price: number;
  current_price: number;
  predicted_price_end: number;
  predicted_change_pct: number;
  r2_accuracy: number;
  mean_error_pct: number;
  peak_forecast: { date: string; formatted: string; fare: number };
  trough_forecast: { date: string; formatted: string; fare: number };
  projected_cpi_impact: {
    transport_cpi_delta_pct: number;
    headline_bps: number;
    monetary_signal: string;
  };
  timeline: ForecastPoint[];
}

export async function fetchAirfareForecast(
  route: string = 'ALL',
  horizon: number = 30,
  model: string = 'ensemble'
): Promise<ForecastResponse> {
  const res = await fetch(`${API_BASE}/analytics/forecast?route=${route}&horizon=${horizon}&model=${model}`);
  if (!res.ok) throw new Error('Failed to fetch predictive forecast');
  return res.json();
}

export async function fetchExternalDrivers(): Promise<import('../types').ExternalDriversResponse> {
  const res = await fetch(`${API_BASE}/analytics/external-drivers`);
  if (!res.ok) throw new Error('Failed to fetch real-time external drivers');
  return res.json();
}

export async function fetchAntiGougingAudit(): Promise<import('../types').AntiGougingAuditResponse> {
  const res = await fetch(`${API_BASE}/analytics/anti-gouging-audit`);
  if (!res.ok) throw new Error('Failed to fetch anti-gouging audit');
  return res.json();
}


