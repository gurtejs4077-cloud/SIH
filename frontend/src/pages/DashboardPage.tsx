import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Plane,
  Building,
  TrendingUp,
  Download,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Info,
  Layers,
} from 'lucide-react';
import {
  fetchCurrentIndex,
  fetchAnomalies,
  fetchRoutes,
  fetchAirlines,
  fetchBookingWindow,
  fetchFareHistory,
  getExportCsvUrl,
} from '../services/api';
import {
  IndexResponse,
  AnomalyListResponse,
  RouteItem,
  AirlineItem,
  BookingWindowResponse,
} from '../types';
import { MetricCard } from '../components/MetricCard';
import { AnomalyBadge, SpikeBadge, AuthenticityBadge } from '../components/StatusBadge';
import { RouteMap } from '../components/RouteMap';
import { PriceTrendChart } from '../components/PriceTrendChart';
import { AirlineComparisonChart } from '../components/AirlineComparisonChart';
import { BookingWindowChart } from '../components/BookingWindowChart';

export const DashboardPage: React.FC = () => {
  const [indexData, setIndexData] = useState<IndexResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyListResponse | null>(null);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [airlines, setAirlines] = useState<AirlineItem[]>([]);
  const [bookingWindow, setBookingWindow] = useState<BookingWindowResponse | null>(null);
  const [fareHistory, setFareHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [idx, anom, rts, airl, bw, hist] = await Promise.all([
        fetchCurrentIndex(),
        fetchAnomalies(),
        fetchRoutes(),
        fetchAirlines(),
        fetchBookingWindow('ALL'),
        fetchFareHistory('ALL'),
      ]);
      setIndexData(idx);
      setAnomalies(anom);
      setRoutes(rts);
      setAirlines(airl);
      setBookingWindow(bw);
      setFareHistory(hist);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-gray-600 font-semibold text-sm">
          Loading Real-Time Airfare Intelligence Platform...
        </div>
        <div className="text-gray-500 text-xs mt-1">
          Aggregating price index, anomaly baselines, and booking elasticity
        </div>
      </div>
    );
  }

  const summary = indexData?.summary;
  const unusualRoutes = anomalies?.items.filter(
    (item) => item.status === 'UNUSUALLY HIGH' || item.status === 'EXTREME'
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Disclaimer */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>PROTOTYPE AIRFARE PRICE INDEX (CPI AUGMENTATION)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            Real-time weighted aggregation of Indian domestic air corridors for augmenting the Consumer Price Index (CPI). Developed for SIH 2026. Data honesty certified: simulated observations are strictly demarcated.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={loadAllData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <a
            href={getExportCsvUrl()}
            download
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-gray-900 shadow-md shadow-blue-900/30 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Fares CSV
          </a>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* National Airfare Price Index */}
        <MetricCard
          title="India Airfare Price Index"
          value={summary?.current_index ?? '100.0'}
          changePct={summary?.monthly_change_pct}
          changeLabel={`${summary?.monthly_change_pct && summary.monthly_change_pct > 0 ? '+' : ''}${summary?.monthly_change_pct ?? 0}% this month`}
          subtext="Base: 2026 = 100.0"
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
          highlight
        />

        {/* Routes Tracked */}
        <MetricCard
          title="Active Route Corridors"
          value={summary?.total_routes_tracked ?? 10}
          changeLabel="10 Major Trunk Routes"
          subtext="Configured in database"
          icon={<Plane className="w-5 h-5 text-emerald-400" />}
        />

        {/* Airlines Tracked */}
        <MetricCard
          title="Commercial Airlines"
          value={summary?.total_airlines_tracked ?? 5}
          changeLabel="IndiGo, AI, Akasa, SG, UK"
          subtext="Market share weighted"
          icon={<Building className="w-5 h-5 text-purple-400" />}
        />

        {/* Total Observations */}
        <MetricCard
          title="Fare Observations Stored"
          value={(summary?.total_observations_count ?? 0).toLocaleString()}
          changeLabel="30-Day Rolling Window"
          subtext={summary?.is_demo_mode ? 'Demarcated Demo Mode' : 'Verified Observations'}
          icon={<Activity className="w-5 h-5 text-amber-400" />}
        />
      </div>

      {/* Unusually Expensive Routes & Anomalies Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 mb-5 gap-3">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-gray-900">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>UNUSUALLY EXPENSIVE ROUTES & ANOMALIES</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/80 font-mono font-bold">
                {anomalies?.unusual_count ?? 0} High Alerts
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Automated anomaly detection comparing current fares to 30-day baselines, standard deviation (Z-score), and trajectory analysis.
            </p>
          </div>
          <Link
            to="/routes"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 self-start sm:self-auto"
          >
            View All 10 Routes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Anomaly Route Cards / Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {anomalies?.items.slice(0, 6).map((item) => (
            <div
              key={item.route}
              className={`p-4 rounded-xl border transition-all ${
                item.status === 'EXTREME'
                  ? 'bg-rose-950/20 border-rose-800/60 shadow-md shadow-rose-950/20'
                  : item.status === 'UNUSUALLY HIGH'
                  ? 'bg-orange-950/20 border-orange-800/60 shadow-md shadow-orange-950/20'
                  : item.status === 'ELEVATED'
                  ? 'bg-amber-950/15 border-amber-800/50'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900 font-mono flex items-center gap-1.5">
                    <span>{item.origin}</span>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <span>{item.destination}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Cheapest: <span className="text-gray-600 font-semibold">{item.cheapest_airline || 'IndiGo'}</span>
                  </div>
                </div>
                <AnomalyBadge status={item.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 my-3 pt-2 border-t border-gray-200 text-xs">
                <div>
                  <div className="text-gray-500">Current Fare</div>
                  <div className="text-base font-bold font-mono text-gray-900">
                    ₹{Math.round(item.current_price).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">30-Day Average</div>
                  <div className="text-base font-bold font-mono text-gray-600">
                    ₹{Math.round(item.baseline_30d).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Difference & Trajectory */}
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Difference:</span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      item.percentage_difference > 35 ? 'text-rose-400' : item.percentage_difference > 15 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {item.percentage_difference > 0 ? `+${item.percentage_difference.toFixed(1)}%` : `${item.percentage_difference.toFixed(1)}%`}
                  </span>
                </div>
                <SpikeBadge type={item.classification_type} />
              </div>

              {/* Rationale explanation */}
              <div className="mt-2.5 p-2 bg-white rounded text-[11px] text-gray-500 border border-gray-200 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{item.classification_reason}</span>
              </div>

              <div className="mt-3 text-right">
                <Link
                  to={`/routes/${item.route}`}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                >
                  Analyze Corridor <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive India Route Map */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-2">
          <div>
            <div className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-400" />
              <span>INDIA AIR ROUTE INTELLIGENCE MAP</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Geographic visualization of Indian domestic flight corridors color-coded by real-time anomaly severity.
            </p>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>Click any route arc for instant corridor telemetry</span>
          </div>
        </div>

        <RouteMap routes={routes} />
      </div>

      {/* Analytics Charts Grid: Trends & Elasticity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* National Airfare Price Index Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <div className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Prototype Price Index Movement (30-Day)
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Composite CPI augmentation index for Indian aviation sector
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/80 px-2 py-1 rounded border border-blue-800/80">
              Index: {summary?.current_index ?? 100.0}
            </span>
          </div>

          <PriceTrendChart
            data={fareHistory}
            dataKey="average_fare"
            title="Daily Average Fare Across Network (₹)"
            unit="₹"
            color="#3b82f6"
          />
        </div>

        {/* Airline Price Comparison */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <div className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Airline Fare Comparison & 7-Day Trend
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Current average fares vs 7-day baselines across carriers
              </p>
            </div>
            <span className="text-xs text-gray-500 font-mono">5 Major Fleets</span>
          </div>

          <AirlineComparisonChart airlines={airlines} />
        </div>
      </div>

      {/* Booking Window Elasticity Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-2">
          <div>
            <div className="text-base font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>BOOKING-TIME PRICE ELASTICITY CURVE</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Analysis of consumer airfares across advance booking horizons: T+1 (last minute), T+7, T+15, T+30, T+45 days.
            </p>
          </div>
          <span className="text-xs text-gray-500">Essential for CPI basket weighting</span>
        </div>

        {bookingWindow && (
          <BookingWindowChart
            windows={bookingWindow.windows}
            maxSavingDescription={bookingWindow.max_saving_description}
          />
        )}
      </div>
    </div>
  );
};
