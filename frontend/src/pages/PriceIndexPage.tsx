import React, { useState, useEffect } from 'react';
import { TrendingUp, Layers, BookOpen, Download, RefreshCw, BarChart2 } from 'lucide-react';
import { fetchCurrentIndex, fetchIndexHistory, getExportCsvUrl } from '../services/api';
import { IndexResponse } from '../types';
import { MetricCard } from '../components/MetricCard';
import { PriceTrendChart } from '../components/PriceTrendChart';

export const PriceIndexPage: React.FC = () => {
  const [indexData, setIndexData] = useState<IndexResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [curr, hist] = await Promise.all([fetchCurrentIndex(), fetchIndexHistory()]);
      setIndexData(curr);
      setHistory(hist.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-gray-600 font-semibold text-sm">
          Calculating CPI Augmentation Indices...
        </div>
      </div>
    );
  }

  const summary = indexData?.summary;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-gray-900 font-bold text-xl">
            <Layers className="w-6 h-6 text-blue-400" />
            <span>Prototype Airfare Price Index (CPI Augmentation)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            High-frequency price index modeled to augment official Consumer Price Index (CPI) transport components, reflecting actual observed domestic passenger aviation tariffs across India.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recalculate
          </button>
          <a
            href={getExportCsvUrl()}
            download
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-gray-900 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            Export Basket CSV
          </a>
        </div>
      </div>

      {/* Index Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="National Airfare Index"
          value={summary?.current_index ?? 100.0}
          changePct={summary?.monthly_change_pct}
          changeLabel="Monthly Momentum"
          subtext="Base: 2026 = 100.0"
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
          highlight
        />

        <MetricCard
          title="Daily Movement"
          value={`${summary?.daily_change_pct && summary.daily_change_pct > 0 ? '+' : ''}${summary?.daily_change_pct ?? 0}%`}
          changeLabel="24-Hour Velocity"
          subtext="High-frequency tracker"
          icon={<BarChart2 className="w-5 h-5 text-emerald-400" />}
        />

        <MetricCard
          title="Weekly Movement"
          value={`${summary?.weekly_change_pct && summary.weekly_change_pct > 0 ? '+' : ''}${summary?.weekly_change_pct ?? 0}%`}
          changeLabel="7-Day Rolling Trend"
          subtext="Removes weekend noise"
          icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
        />

        <MetricCard
          title="Active Basket Routes"
          value={summary?.total_routes_tracked ?? 10}
          changeLabel="Weighted Aggregation"
          subtext="100% Normalized Weight"
          icon={<Layers className="w-5 h-5 text-amber-400" />}
        />
      </div>

      {/* Trajectory Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-200">
          Historical National Index Trajectory (Laspeyres Formulation)
        </div>
        <PriceTrendChart
          data={history.map((h) => ({
            date: h.timestamp ? h.timestamp.split('T')[0] : '',
            index_score: h.index_score,
          }))}
          dataKey="index_score"
          title="Index Level (Base 100.0)"
          color="#3b82f6"
        />
      </div>

      {/* Route-Level Basket Weights Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Route-Level Price Indices & Basket Weights
          </div>
          <span className="text-xs text-gray-500">Laspeyres Sub-Indices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Route Code</th>
                <th className="px-5 py-3">Basket Weight</th>
                <th className="px-5 py-3">Current Avg Fare</th>
                <th className="px-5 py-3">Base Period Fare</th>
                <th className="px-5 py-3">Route Index Score</th>
                <th className="px-5 py-3">Daily Change</th>
                <th className="px-5 py-3">Weekly Change</th>
                <th className="px-5 py-3">Monthly Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {indexData?.routes.map((r) => (
                <tr key={r.route} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                    {r.route}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-gray-600">
                    {r.weight.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-gray-700">
                    ₹{r.current_fare.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-gray-500">
                    ₹{r.base_fare.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-blue-400">
                    {r.index_score.toFixed(1)}
                  </td>
                  <td className="px-5 py-3.5 font-mono">
                    <span className={r.daily_change_pct > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      {r.daily_change_pct > 0 ? `+${r.daily_change_pct}%` : `${r.daily_change_pct}%`}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono">
                    <span className={r.weekly_change_pct > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      {r.weekly_change_pct > 0 ? `+${r.weekly_change_pct}%` : `${r.weekly_change_pct}%`}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono">
                    <span className={r.monthly_change_pct > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      {r.monthly_change_pct > 0 ? `+${r.monthly_change_pct}%` : `${r.monthly_change_pct}%`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Airline Market Share Weights */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-200">
          Airline Sub-Indices & Market Weights
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {indexData?.airlines.map((a) => (
            <div key={a.airline_code} className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-gray-900">{a.airline_name}</span>
                <span className="text-gray-500 font-mono">{a.market_share_pct}% share</span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-blue-400 my-1">
                {a.index_score.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                Current Avg: <span className="text-gray-700 font-mono">₹{Math.round(a.current_avg_fare).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
