import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowRight, Download, RefreshCw, Plane, MapPin, ShieldAlert } from 'lucide-react';
import { fetchRoutes, fetchAnomalies, getExportCsvUrl } from '../services/api';
import { RouteItem, AnomalyItem } from '../types';
import { AnomalyBadge, AuthenticityBadge, JustificationBadge } from '../components/StatusBadge';

export const RoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [anomaliesMap, setAnomaliesMap] = useState<Record<string, AnomalyItem>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const [data, anomData] = await Promise.all([fetchRoutes(), fetchAnomalies()]);
      setRoutes(data);
      const map: Record<string, AnomalyItem> = {};
      anomData.items.forEach((a) => { map[a.route] = a; });
      setAnomaliesMap(map);
    } catch (err) {
      console.error('Failed to load routes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.origin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.destination_name.toLowerCase().includes(searchTerm.toLowerCase());

    const isUnjustified = anomaliesMap[r.code]?.is_justified === false || anomaliesMap[r.code]?.is_predatory_alert === true;

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'UNJUSTIFIED'
        ? isUnjustified
        : r.anomaly_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Domestic Route Corridors Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracked Indian domestic air corridors configured with CPI basket weights and anomaly detection thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadRoutes}
            className="btn-secondary"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <a
            href={getExportCsvUrl()}
            download
            className="btn-primary"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by route code (e.g. DEL-BOM) or airport name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 shadow-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 shadow-xs transition-all cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNJUSTIFIED">🚨 Predatory / Unjustified Hikes (No Reason)</option>
            <option value="NORMAL">Normal (≤15%)</option>
            <option value="ELEVATED">Elevated (+15-35%)</option>
            <option value="UNUSUALLY HIGH">Unusually High (+35-60%)</option>
            <option value="EXTREME">Extreme (+60%+)</option>
          </select>
        </div>
      </div>

      {/* Routes High-Density Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Route</th>
                <th className="px-5 py-3">Origin / Destination</th>
                <th className="px-5 py-3">Distance</th>
                <th className="px-5 py-3">CPI Weight</th>
                <th className="px-5 py-3">Current Fare</th>
                <th className="px-5 py-3">30D Baseline</th>
                <th className="px-5 py-3">Change %</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Causal Justification</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {filteredRoutes.map((route) => {
                const anom = anomaliesMap[route.code];
                const isPredatory = anom?.is_justified === false || anom?.is_predatory_alert === true;

                return (
                  <tr
                    key={route.code}
                    className={`transition-colors ${
                      isPredatory
                        ? 'bg-red-50/70 hover:bg-red-100/70 border-l-4 border-l-red-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-5 py-4 font-mono font-bold text-gray-900 text-sm">
                      <div className="flex items-center gap-1.5">
                        {isPredatory && (
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" title="Flagged Unjustified Hike" />
                        )}
                        <span>{route.code}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-gray-700 font-medium">
                        {route.origin_name.split(',')[0]} → {route.destination_name.split(',')[0]}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {route.origin} to {route.destination}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 font-mono">
                      {route.distance_km} km
                    </td>
                    <td className="px-5 py-4 font-mono text-gray-600">
                      {route.cpi_weight.toFixed(1)}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">
                      ₹{route.current_fare?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-5 py-4 font-mono text-gray-500">
                      ₹{route.baseline_30d?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold">
                      {route.change_pct !== undefined && route.change_pct !== null ? (
                        <span
                          className={
                            isPredatory
                              ? 'text-red-600 font-black'
                              : route.change_pct > 35
                              ? 'text-rose-500'
                              : route.change_pct > 15
                              ? 'text-amber-500'
                              : 'text-emerald-600'
                          }
                        >
                          {route.change_pct > 0 ? `+${route.change_pct}%` : `${route.change_pct}%`}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <AnomalyBadge status={route.anomaly_status} />
                    </td>
                    <td className="px-5 py-4">
                      {anom ? (
                        <JustificationBadge
                          category={anom.justification_category}
                          isJustified={anom.is_justified}
                          label={anom.justification_label}
                          gougingScore={anom.gouging_risk_score}
                        />
                      ) : (
                        <span className="text-gray-400 font-mono text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <AuthenticityBadge isDemo={route.is_demo} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/routes/${route.code}`}
                        className="btn-secondary h-7 px-2.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Deep Dive <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
