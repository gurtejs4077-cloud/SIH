import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowRight, Download, RefreshCw, Plane, MapPin } from 'lucide-react';
import { fetchRoutes, getExportCsvUrl } from '../services/api';
import { RouteItem } from '../types';
import { AnomalyBadge, AuthenticityBadge } from '../components/StatusBadge';

export const RoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const data = await fetchRoutes();
      setRoutes(data);
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

    const matchesStatus =
      statusFilter === 'ALL' || r.anomaly_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            Domestic Route Corridors Directory
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Tracked Indian domestic air corridors configured with CPI basket weights and anomaly detection thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRoutes}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <a
            href={getExportCsvUrl()}
            download
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-gray-900 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by route code (e.g. DEL-BOM) or airport name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
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
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredRoutes.map((route) => (
                <tr key={route.code} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-gray-900 text-sm">
                    {route.code}
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
                          route.change_pct > 35
                            ? 'text-rose-400'
                            : route.change_pct > 15
                            ? 'text-amber-400'
                            : 'text-emerald-400'
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
                    <AuthenticityBadge isDemo={route.is_demo} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to={`/routes/${route.code}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Deep Dive <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
