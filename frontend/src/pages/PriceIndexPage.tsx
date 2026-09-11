import React, { useState, useEffect } from 'react';
import { TrendingUp, Layers, Download, RefreshCw, BarChart2 } from 'lucide-react';
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
      <div className="w-full px-4 py-24 text-center">
        <div className="inline-block w-9 h-9 border-3 border-[#5A7C83] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-[#2C444D] font-bold text-sm">
          Calculating CPI Augmentation Indices...
        </div>
      </div>
    );
  }

  const summary = indexData?.summary;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#C7B8A4]/70">
        <div>
          <div className="flex items-center gap-2 text-[#2C444D] font-bold text-xl">
            <Layers className="w-6 h-6 text-[#5A7C83]" />
            <span>Prototype Airfare Price Index (CPI Augmentation)</span>
          </div>
          <p className="text-xs text-[#2C444D]/70 mt-1 max-w-4xl leading-relaxed">
            High-frequency price index modeled to augment official Consumer Price Index (CPI) transport components, reflecting actual observed domestic passenger aviation tariffs across India.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recalculate
          </button>
          <a
            href={getExportCsvUrl()}
            download
            className="btn-primary"
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
          icon={<TrendingUp className="w-5 h-5 text-[#2C444D]" />}
          highlight
        />

        <MetricCard
          title="Daily Movement"
          value={`${summary?.daily_change_pct && summary.daily_change_pct > 0 ? '+' : ''}${summary?.daily_change_pct ?? 0}%`}
          changeLabel="24-Hour Velocity"
          subtext="High-frequency tracker"
          icon={<BarChart2 className="w-5 h-5 text-[#5A7C83]" />}
        />

        <MetricCard
          title="Weekly Movement"
          value={`${summary?.weekly_change_pct && summary.weekly_change_pct > 0 ? '+' : ''}${summary?.weekly_change_pct ?? 0}%`}
          changeLabel="7-Day Rolling Trend"
          subtext="Removes weekend noise"
          icon={<TrendingUp className="w-5 h-5 text-[#A88C6C]" />}
        />

        <MetricCard
          title="Active Basket Routes"
          value={summary?.total_routes_tracked ?? 10}
          changeLabel="Weighted Aggregation"
          subtext="100% Normalized Weight"
          icon={<Layers className="w-5 h-5 text-[#CCB68E]" />}
        />
      </div>

      {/* Trajectory Chart */}
      <div className="bg-white border border-[#C7B8A4] rounded-xl p-6 shadow-xs space-y-4">
        <div className="text-sm font-bold text-[#2C444D] uppercase tracking-wider pb-3 border-b border-[#C7B8A4]/50">
          Historical National Index Trajectory (Laspeyres Formulation)
        </div>
        <PriceTrendChart
          data={history.map((h) => ({
            date: h.timestamp ? h.timestamp.split('T')[0] : '',
            index_score: h.index_score,
          }))}
          dataKey="index_score"
          title="Index Level (Base 100.0)"
          color="#5A7C83"
        />
      </div>

      {/* Route-Level Basket Weights Table */}
      <div className="bg-white border border-[#C7B8A4] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-[#FAF8F5] border-b border-[#C7B8A4] flex items-center justify-between">
          <div className="text-sm font-bold text-[#2C444D] uppercase tracking-wider">
            Route-Level Price Indices & Basket Weights
          </div>
          <span className="text-xs text-[#2C444D]/70 font-semibold">Laspeyres Sub-Indices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#2C444D]/70 uppercase tracking-wider text-[11px] border-b border-[#C7B8A4]">
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
            <tbody className="divide-y divide-[#C7B8A4]/30 font-sans">
              {indexData?.routes.map((r) => (
                <tr key={r.route} className="hover:bg-[#FAF8F5]">
                  <td className="px-5 py-3.5 font-mono font-bold text-[#2C444D]">
                    {r.route}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[#2C444D]/80">
                    {r.weight.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[#2C444D]">
                    ₹{r.current_fare.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[#2C444D]/60">
                    ₹{r.base_fare.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-[#5A7C83]">
                    {r.index_score.toFixed(1)}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold">
                    <span className={r.daily_change_pct > 0 ? 'text-[#A88C6C]' : 'text-[#5A7C83]'}>
                      {r.daily_change_pct > 0 ? `+${r.daily_change_pct}%` : `${r.daily_change_pct}%`}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold">
                    <span className={r.weekly_change_pct > 0 ? 'text-[#A88C6C]' : 'text-[#5A7C83]'}>
                      {r.weekly_change_pct > 0 ? `+${r.weekly_change_pct}%` : `${r.weekly_change_pct}%`}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold">
                    <span className={r.monthly_change_pct > 0 ? 'text-[#A88C6C]' : 'text-[#5A7C83]'}>
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
      <div className="bg-white border border-[#C7B8A4] rounded-xl p-6 shadow-xs space-y-4">
        <div className="text-sm font-bold text-[#2C444D] uppercase tracking-wider pb-3 border-b border-[#C7B8A4]/50">
          Airline Sub-Indices & Market Weights
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {indexData?.airlines.map((a) => (
            <div key={a.airline_code} className="bg-[#FAF8F5] border border-[#C7B8A4] p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#2C444D]">{a.airline_name}</span>
                <span className="text-[#2C444D]/70 font-mono">{a.market_share_pct}% share</span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-[#5A7C83] my-1">
                {a.index_score.toFixed(1)}
              </div>
              <div className="text-xs text-[#2C444D]/70 mt-2 pt-2 border-t border-[#C7B8A4]/40">
                Current Avg: <span className="text-[#2C444D] font-mono font-bold">₹{Math.round(a.current_avg_fare).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
