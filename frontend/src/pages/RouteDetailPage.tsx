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
        <div className="inline-block w-9 h-9 border-3 border-[#5A7C83] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-[#2C444D] font-bold text-sm">
          Loading Route Telemetry for {routeCode}...
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="w-full px-4 py-24 text-center text-[#A88C6C]">
        Route corridor '{routeCode}' not found.
      </div>
    );
  }

  const spike = route.spike_analysis;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 space-y-6">
      {/* Back link & Route Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#C7B8A4]/70">
        <div>
          <Link
            to="/routes"
            className="btn-secondary h-8 px-3 text-xs mb-3 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Route Directory
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#2C444D] font-mono">
              {route.origin} → {route.destination}
            </h1>
            <AnomalyBadge status={route.anomaly_status} />
            <AuthenticityBadge isDemo={route.is_demo} />
          </div>
          <p className="text-xs text-[#2C444D]/70 mt-1">
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
              ? 'bg-[#FAF8F5] border-2 border-[#A88C6C] shadow-xs'
              : spike.classification === 'TEMPORARY SPIKE'
              ? 'bg-[#FAF8F5] border-2 border-[#CCB68E] shadow-xs'
              : 'bg-white border-[#C7B8A4]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C7B8A4]/50">
            <div className="flex items-center gap-2">
              <SpikeBadge type={spike.classification} />
              <span className="text-xs font-bold text-[#2C444D] uppercase tracking-wider">
                Price Movement Pattern Diagnostic
              </span>
            </div>
            <div className="text-xs text-[#2C444D]/70 font-mono">
              Consecutive trend periods: <strong className="text-[#2C444D]">{spike.consecutive_increases}</strong>
            </div>
          </div>

          <div className="mt-3 text-xs text-[#2C444D]/80 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#5A7C83] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-[#2C444D]">Diagnostic Rationale: </strong>
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
              ? 'bg-[#FAF8F5] border-2 border-[#A88C6C] shadow-md ring-2 ring-[#A88C6C]/20'
              : 'bg-white border-[#C7B8A4]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C7B8A4]/50">
            <div className="flex items-center gap-2">
              <JustificationBadge
                category={anomaly.justification_category}
                isJustified={anomaly.is_justified}
                label={anomaly.justification_label}
                gougingScore={anomaly.gouging_risk_score}
              />
              <span className="text-xs font-bold text-[#2C444D] uppercase tracking-wider">
                Causal Price Spike Forensics
              </span>
            </div>
            {anomaly.gouging_risk_score !== undefined && anomaly.gouging_risk_score > 0 && (
              <span className="text-xs px-2.5 py-1 rounded bg-[#FAF8F5] text-[#A88C6C] border border-[#A88C6C] font-mono font-bold">
                Anti-Gouging Risk Score: {anomaly.gouging_risk_score}/100
              </span>
            )}
          </div>

          <div className="mt-3.5 space-y-3">
            <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
              anomaly.is_justified === false
                ? 'bg-white border-[#A88C6C] text-[#2C444D] font-medium'
                : 'bg-[#FAF8F5] border-[#C7B8A4] text-[#2C444D]'
            }`}>
              <div className="flex items-start gap-2">
                <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${anomaly.is_justified === false ? 'text-[#A88C6C]' : 'text-[#5A7C83]'}`} />
                <div>
                  <strong className="text-[#2C444D]">Causal Verdict: </strong>
                  {anomaly.justification_detail || 'No unusual external driver observed on this corridor.'}
                </div>
              </div>
            </div>

            {/* Environmental & Fuel Verification Signals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#C7B8A4]">
                <div className="text-[10px] text-[#2C444D]/70 uppercase font-bold flex items-center gap-1">
                  <Wind className="w-3 h-3 text-[#5A7C83]" />
                  <span>Origin Weather ({route.origin})</span>
                </div>
                <div className="font-bold text-[#2C444D] mt-1">
                  {anomaly.weather_origin?.condition || 'Clear Skies / VFR'}
                </div>
                <div className="text-[11px] text-[#2C444D]/70 mt-0.5 font-mono">
                  {anomaly.weather_origin?.temp_c || 28}°C • Gusts: {anomaly.weather_origin?.wind_gusts_kmh || 18} km/h
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#C7B8A4]">
                <div className="text-[10px] text-[#2C444D]/70 uppercase font-bold flex items-center gap-1">
                  <Wind className="w-3 h-3 text-[#5A7C83]" />
                  <span>Destination Weather ({route.destination})</span>
                </div>
                <div className="font-bold text-[#2C444D] mt-1">
                  {anomaly.weather_destination?.condition || 'Clear Skies / VFR'}
                </div>
                <div className="text-[11px] text-[#2C444D]/70 mt-0.5 font-mono">
                  {anomaly.weather_destination?.temp_c || 27}°C • Gusts: {anomaly.weather_destination?.wind_gusts_kmh || 20} km/h
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#C7B8A4]">
                <div className="text-[10px] text-[#2C444D]/70 uppercase font-bold flex items-center gap-1">
                  <Fuel className="w-3 h-3 text-[#A88C6C]" />
                  <span>Jet Fuel Benchmark (ATF)</span>
                </div>
                <div className="font-bold text-[#2C444D] mt-1">
                  ₹{Math.round(anomaly.atf_benchmark?.price_per_kl_inr || 93480).toLocaleString()} / kL
                </div>
                <div className="text-[11px] text-[#2C444D]/70 mt-0.5 font-mono">
                  MoM Shift: {(anomaly.atf_benchmark?.mom_pct_change || 1.5) > 0 ? `+${anomaly.atf_benchmark?.mom_pct_change || 1.5}%` : `${anomaly.atf_benchmark?.mom_pct_change || 1.5}%`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Key Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#C7B8A4] p-3.5 rounded-xl shadow-xs">
          <div className="text-[11px] text-[#2C444D]/70 uppercase font-bold">Current Fare</div>
          <div className="text-xl font-extrabold font-mono text-[#2C444D] mt-1">
            ₹{route.current_fare?.toLocaleString() || '—'}
          </div>
          <div className="text-[10px] text-[#2C444D]/60 mt-1">Latest batch median</div>
        </div>

        <div className="bg-white border border-[#C7B8A4] p-3.5 rounded-xl shadow-xs">
          <div className="text-[11px] text-[#2C444D]/70 uppercase font-bold">Lowest Observed</div>
          <div className="text-xl font-extrabold font-mono text-[#5A7C83] mt-1">
            ₹{route.lowest_fare?.toLocaleString() || '—'}
          </div>
          <div className="text-[10px] text-[#2C444D]/60 mt-1">In 30-day window</div>
        </div>

        <div className="bg-white border border-[#C7B8A4] p-3.5 rounded-xl shadow-xs">
          <div className="text-[11px] text-[#2C444D]/70 uppercase font-bold">Median Fare</div>
          <div className="text-xl font-extrabold font-mono text-[#2C444D] mt-1">
            ₹{route.median_fare?.toLocaleString() || '—'}
          </div>
          <div className="text-[10px] text-[#2C444D]/60 mt-1">50th percentile</div>
        </div>

        <div className="bg-white border border-[#C7B8A4] p-3.5 rounded-xl shadow-xs">
          <div className="text-[11px] text-[#2C444D]/70 uppercase font-bold">Average Fare</div>
          <div className="text-xl font-extrabold font-mono text-[#2C444D] mt-1">
            ₹{route.average_fare ? Math.round(route.average_fare).toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-[#2C444D]/60 mt-1">Mean observation</div>
        </div>

        <div className="bg-white border border-[#C7B8A4] p-3.5 rounded-xl shadow-xs">
          <div className="text-[11px] text-[#2C444D]/70 uppercase font-bold">Highest Observed</div>
          <div className="text-xl font-extrabold font-mono text-[#A88C6C] mt-1">
            ₹{route.highest_fare?.toLocaleString() || '—'}
          </div>
          <div className="text-[10px] text-[#2C444D]/60 mt-1">Peak surge</div>
        </div>

        <div className="bg-white border border-[#C7B8A4] p-3.5 rounded-xl shadow-xs">
          <div className="text-[11px] text-[#2C444D]/70 uppercase font-bold">30D Baseline</div>
          <div className="text-xl font-extrabold font-mono text-[#2C444D] mt-1">
            ₹{route.baseline_30d?.toLocaleString() || '—'}
          </div>
          <div className="text-[10px] text-[#2C444D]/60 mt-1">
            Change: <strong className="text-[#A88C6C] font-bold">{route.change_pct}%</strong>
          </div>
        </div>
      </div>

      {/* Airline Comparison on this Route */}
      <div className="bg-white border border-[#C7B8A4] rounded-xl p-6 shadow-xs space-y-4">
        <div className="text-sm font-bold text-[#2C444D] uppercase tracking-wider pb-3 border-b border-[#C7B8A4]/50">
          Airline Operating Pricing on Corridor {route.code}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {route.airline_stats.map((astat) => (
            <div key={astat.airline} className="bg-[#FAF8F5] border border-[#C7B8A4] p-3.5 rounded-lg">
              <div className="text-xs font-bold text-[#2C444D]/80 mb-1">{astat.airline}</div>
              <div className="text-base font-bold font-mono text-[#2C444D]">
                ₹{Math.round(astat.current_fare).toLocaleString()}
              </div>
              <div className="text-[11px] text-[#2C444D]/70 mt-1">
                Route Avg: ₹{Math.round(astat.average_fare).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Window Elasticity for this Route */}
      <div className="bg-white border border-[#C7B8A4] rounded-xl p-6 shadow-xs space-y-4">
        <div className="text-sm font-bold text-[#2C444D] uppercase tracking-wider pb-3 border-b border-[#C7B8A4]/50">
          Booking Horizon Elasticity Curve for {route.code}
        </div>
        <BookingWindowChart windows={route.booking_window_stats} />
      </div>

      {/* Recent Observations Audit Log */}
      <div className="bg-white border border-[#C7B8A4] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-[#FAF8F5] border-b border-[#C7B8A4] flex items-center justify-between">
          <div className="text-sm font-bold text-[#2C444D] uppercase tracking-wider">
            Recent Observed Fares Log (Audit Trail)
          </div>
          <span className="text-xs text-[#2C444D]/70 font-medium">
            Showing latest {route.recent_observations.length} genuine/simulated observations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#2C444D]/70 uppercase tracking-wider text-[11px] border-b border-[#C7B8A4]">
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
            <tbody className="divide-y divide-[#C7B8A4]/30 font-sans">
              {route.recent_observations.map((obs) => (
                <tr key={obs.id} className="hover:bg-[#FAF8F5]/80">
                  <td className="px-4 py-2.5 text-[#2C444D]/70 font-mono">
                    {new Date(obs.timestamp).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2.5 font-bold text-[#2C444D]">
                    {obs.airline} ({obs.flight_number})
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#2C444D]/80">
                    {obs.departure_date} ({obs.departure_time})
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#5A7C83] font-bold">
                    T+{obs.advance_days}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#2C444D]/80">
                    ₹{obs.base_fare.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#2C444D]/60">
                    ₹{(obs.taxes + obs.fees).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold text-[#2C444D]">
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

