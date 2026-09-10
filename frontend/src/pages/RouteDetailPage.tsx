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
import { fetchRouteDetail, getExportCsvUrl } from '../services/api';
import { RouteDetail } from '../types';
import { AnomalyBadge, SpikeBadge, AuthenticityBadge } from '../components/StatusBadge';
import { BookingWindowChart } from '../components/BookingWindowChart';

export const RouteDetailPage: React.FC = () => {
  const { routeCode } = useParams<{ routeCode: string }>();
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (routeCode) {
      setLoading(true);
      fetchRouteDetail(routeCode)
        .then(setRoute)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [routeCode]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-gray-600 font-semibold text-sm">
          Loading Route Telemetry for {routeCode}...
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">
        Route corridor '{routeCode}' not found.
      </div>
    );
  }

  const spike = route.spike_analysis;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back link & Route Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <Link
            to="/routes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Route Directory
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900 font-mono">
              {route.origin} → {route.destination}
            </h1>
            <AnomalyBadge status={route.anomaly_status} />
            <AuthenticityBadge isDemo={route.is_demo} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {route.origin_name} to {route.destination_name} • Distance: {route.distance_km} km • CPI Basket Weight: {route.cpi_weight.toFixed(1)}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <a
            href={getExportCsvUrl(route.code)}
            download
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-gray-900 shadow transition-colors"
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
