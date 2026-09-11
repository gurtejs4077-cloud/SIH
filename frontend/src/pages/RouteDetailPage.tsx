import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plane,
  TrendingUp,
  Download,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { fetchRouteDetail, fetchAnomalies, getExportCsvUrl } from '../services/api';
import { RouteDetail, AnomalyItem } from '../types';
import { AnomalyBadge, SpikeBadge, AuthenticityBadge, JustificationBadge } from '../components/StatusBadge';
import { BookingWindowChart } from '../components/BookingWindowChart';
import { ShieldAlert, Wind, Fuel } from 'lucide-react';

export const RouteDetailPage: React.FC = () => {
  const { routeCode } = useParams<{ routeCode: string }>();
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [anomaly, setAnomaly] = useState<AnomalyItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (routeCode) {
      setLoading(true);
      Promise.all([
        fetchRouteDetail(routeCode),
        fetchAnomalies()
      ])
        .then(([rt, anoms]) => {
          setRoute(rt);
          const match = anoms.items.find((a) => a.route === routeCode);
          if (match) setAnomaly(match);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [routeCode]);

  if (loading) {
    return (
      <div className="w-full px-4 py-24 text-center">
        <div className="inline-block w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-slate-800 font-bold text-sm">
          Loading Route Telemetry for {routeCode}...
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="w-full px-4 py-24 text-center text-slate-500">
        Route corridor '{routeCode}' not found.
      </div>
    );
  }

  const spike = route.spike_analysis;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 space-y-6">
      {/* Back link & Route Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            to="/routes"
            className="btn-secondary h-8 px-3 text-xs mb-3 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Route Directory
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 font-mono">
              {route.origin} → {route.destination}
            </h1>
            <AnomalyBadge status={route.anomaly_status} />
            <AuthenticityBadge isDemo={route.is_demo} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {route.origin_name} to {route.destination_name} • Distance: {route.distance_km} km • CPI Basket Weight: {route.cpi_weight.toFixed(1)}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <a
            href={getExportCsvUrl(route.code)}
            download
            className="btn-primary"
          >
            <Download className="w-3.5 h-3.5" />
            Export Route Observations CSV
          </a>
        </div>
      </div>

      {/* Trajectory Diagnosis: Temporary Spike vs Persistent Increase Card */}
      {spike && (
        <div
          className={`p-5 rounded-xl border ${
            spike.classification === 'PERSISTENT INCREASE'
              ? 'bg-rose-950/25 border-rose-800/60 shadow-lg shadow-rose-950/20'
              : spike.classification === 'TEMPORARY SPIKE'
              ? 'bg-amber-950/25 border-amber-800/60 shadow-lg shadow-amber-950/20'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <SpikeBadge type={spike.classification} />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Price Movement Pattern Diagnostic
              </span>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              Consecutive trend periods: <strong className="text-gray-900">{spike.consecutive_increases}</strong>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-gray-900">Diagnostic Rationale: </strong>
              {spike.reason}
            </div>
          </div>
        </div>
      )}

      {/* Causal Anti-Gouging Forensics & External Drivers Card */}
      {anomaly && (
        <div
          className={`p-5 rounded-xl border transition-all ${
            anomaly.is_justified === false || anomaly.is_predatory_alert
              ? 'bg-red-50/80 border-2 border-red-500 shadow-md ring-2 ring-red-500/20'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <JustificationBadge
                category={anomaly.justification_category}
                isJustified={anomaly.is_justified}
                label={anomaly.justification_label}
                gougingScore={anomaly.gouging_risk_score}
              />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Causal Price Spike Forensics
              </span>
            </div>
            {anomaly.gouging_risk_score !== undefined && anomaly.gouging_risk_score > 0 && (
              <span className="text-xs px-2.5 py-1 rounded bg-red-100 text-red-900 border border-red-300 font-mono font-bold">
                Anti-Gouging Risk Score: {anomaly.gouging_risk_score}/100
              </span>
            )}
          </div>

          <div className="mt-3.5 space-y-3">
            <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
              anomaly.is_justified === false
                ? 'bg-red-100/90 border-red-300 text-red-950 font-medium'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-start gap-2">
                <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${anomaly.is_justified === false ? 'text-red-600' : 'text-blue-500'}`} />
                <div>
                  <strong>Causal Verdict: </strong>
                  {anomaly.justification_detail || 'No unusual external driver observed on this corridor.'}
                </div>
              </div>
            </div>

            {/* Environmental & Fuel Verification Signals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-600" />
                  <span>Origin Weather ({route.origin})</span>
                </div>
                <div className="font-semibold text-slate-800 mt-1">
                  {anomaly.weather_origin?.condition || 'Clear Skies / VFR'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {anomaly.weather_origin?.temp_c || 28}°C • Gusts: {anomaly.weather_origin?.wind_gusts_kmh || 18} km/h
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-600" />
                  <span>Destination Weather ({route.destination})</span>
                </div>
                <div className="font-semibold text-slate-800 mt-1">
                  {anomaly.weather_destination?.condition || 'Clear Skies / VFR'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {anomaly.weather_destination?.temp_c || 27}°C • Gusts: {anomaly.weather_destination?.wind_gusts_kmh || 20} km/h
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Fuel className="w-3 h-3 text-amber-600" />
                  <span>Jet Fuel Benchmark (ATF)</span>
                </div>
                <div className="font-semibold text-slate-800 mt-1">
                  ₹{Math.round(anomaly.atf_benchmark?.price_per_kl_inr || 93480).toLocaleString()} / kL
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  MoM Shift: {(anomaly.atf_benchmark?.mom_pct_change || 1.5) > 0 ? `+${anomaly.atf_benchmark?.mom_pct_change || 1.5}%` : `${anomaly.atf_benchmark?.mom_pct_change || 1.5}%`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Key Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 p-3.5 rounded-xl">
          <div className="text-[11px] text-gray-500 uppercase font-semibold">Current Fare</div>
          <div className="text-xl font-extrabold font-mono text-gray-900 mt-1">
            ₹{route.current_fare?.toLocaleString() || '—'}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Latest batch median</div>
        </div>

        <div className="bg-white border border-gray-200 p-3.5 rounded-xl">
          <div className="text-[11px] text-gray-500 uppercase font-semibold">Lowest Observed</div>
          <div className="text-xl font-extrabold font-mono text-emerald-400 mt-1">
            ₹{route.lowest_fare?.toLocaleString() || '—'}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">In 30-day window</div>
        </div>

        <div className="bg-white border border-gray-200 p-3.5 rounded-xl">
          <div className="text-[11px] text-gray-500 uppercase font-semibold">Median Fare</div>
          <div className="text-xl font-extrabold font-mono text-gray-700 mt-1">
            ₹{route.median_fare?.toLocaleString() || '—'}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">50th percentile</div>
        </div>

        <div className="bg-white border border-gray-200 p-3.5 rounded-xl">
          <div className="text-[11px] text-gray-500 uppercase font-semibold">Average Fare</div>
          <div className="text-xl font-extrabold font-mono text-gray-700 mt-1">
            ₹{route.average_fare ? Math.round(route.average_fare).toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Mean observation</div>
        </div>

        <div className="bg-white border border-gray-200 p-3.5 rounded-xl">
          <div className="text-[11px] text-gray-500 uppercase font-semibold">Highest Observed</div>
          <div className="text-xl font-extrabold font-mono text-rose-400 mt-1">
            ₹{route.highest_fare?.toLocaleString() || '—'}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Peak peak surge</div>
        </div>

        <div className="bg-white border border-gray-200 p-3.5 rounded-xl">
          <div className="text-[11px] text-gray-500 uppercase font-semibold">30D Baseline</div>
          <div className="text-xl font-extrabold font-mono text-gray-600 mt-1">
            ₹{route.baseline_30d?.toLocaleString() || '—'}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            Change: <strong className={route.change_pct && route.change_pct > 0 ? 'text-rose-400' : 'text-emerald-400'}>{route.change_pct}%</strong>
          </div>
        </div>
      </div>

      {/* Airline Comparison on this Route */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-200">
          Airline Operating Pricing on Corridor {route.code}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {route.airline_stats.map((astat) => (
            <div key={astat.airline} className="bg-gray-50 border border-gray-200 p-3.5 rounded-lg">
              <div className="text-xs font-bold text-gray-600 mb-1">{astat.airline}</div>
              <div className="text-base font-bold font-mono text-gray-900">
                ₹{Math.round(astat.current_fare).toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Route Avg: ₹{Math.round(astat.average_fare).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Window Elasticity for this Route */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-200">
          Booking Horizon Elasticity Curve for {route.code}
        </div>
        <BookingWindowChart windows={route.booking_window_stats} />
      </div>

      {/* Recent Observations Audit Log */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Recent Observed Fares Log (Audit Trail)
          </div>
          <span className="text-xs text-gray-500">
            Showing latest {route.recent_observations.length} genuine/simulated observations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5">Observed At</th>
                <th className="px-4 py-2.5">Airline & Flight</th>
                <th className="px-4 py-2.5">Departure Date</th>
                <th className="px-4 py-2.5">Horizon</th>
                <th className="px-4 py-2.5">Base Fare</th>
                <th className="px-4 py-2.5">Taxes & Fees</th>
                <th className="px-4 py-2.5">Total Fare</th>
                <th className="px-4 py-2.5">Source & Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {route.recent_observations.map((obs) => (
                <tr key={obs.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-500 font-mono">
                    {new Date(obs.timestamp).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-700">
                    {obs.airline} ({obs.flight_number})
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-600">
                    {obs.departure_date} ({obs.departure_time})
                  </td>
                  <td className="px-4 py-2.5 font-mono text-blue-400 font-semibold">
                    T+{obs.advance_days}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-600">
                    ₹{obs.base_fare.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">
                    ₹{(obs.taxes + obs.fees).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold text-gray-900">
                    ₹{obs.total_fare.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <AuthenticityBadge isDemo={obs.is_demo} source={obs.source} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
