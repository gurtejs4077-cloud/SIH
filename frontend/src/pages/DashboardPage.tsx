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
  MessageSquare,
  Radar,
  Flame
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
import { openWhatsAppModal } from '../services/modalEvents';


import {
  IndexResponse,
  AnomalyListResponse,
  RouteItem,
  AirlineItem,
  BookingWindowResponse,
} from '../types';
import { MetricCard } from '../components/MetricCard';
import { AnomalyBadge, SpikeBadge, AuthenticityBadge, JustificationBadge } from '../components/StatusBadge';
import { ExternalDriversRadar } from '../components/ExternalDriversRadar';
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
      <div className="w-full px-4 py-24 text-center">
        <div className="inline-block w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-slate-800 font-bold text-sm">
          Loading Real-Time Airfare Intelligence Platform...
        </div>
        <div className="text-slate-500 text-xs mt-1">
          Aggregating price index, anomaly baselines, and booking elasticity
        </div>
      </div>
    );
  }

  const summary = indexData?.summary;
  const unusualRoutes = anomalies?.items.filter(
    (item) => item.status === 'UNUSUALLY HIGH' || item.status === 'EXTREME'
  ) || [];
  const unjustifiedRoutes = anomalies?.items.filter(
    (item) => item.is_justified === false || item.is_predatory_alert === true
  ) || [];

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 space-y-6">
      {/* Top Banner / Disclaimer */}
      <div className="bg-white border border-[#C7B8A4] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#2C444D] font-bold text-base">
            <Layers className="w-5 h-5 text-[#5A7C83]" />
            <span>PROTOTYPE AIRFARE PRICE INDEX (CPI AUGMENTATION)</span>
          </div>
          <p className="text-xs text-[#5A7C83] mt-1 max-w-4xl leading-relaxed">
            Real-time weighted aggregation of Indian domestic air corridors for augmenting the Consumer Price Index (CPI). Developed for SIH 2026. Data honesty certified: simulated observations are strictly demarcated.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
          <button
            onClick={openWhatsAppModal}
            className="btn-secondary"
            title="Link WhatsApp & Dispatch Real-Time Intelligence Report"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#5A7C83]" />
            <span>Send to WhatsApp</span>
          </button>
          <button
            onClick={loadAllData}
            disabled={refreshing}
            className="btn-secondary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <a
            href={getExportCsvUrl()}
            download
            className="btn-primary"
          >
            <Download className="w-3.5 h-3.5 text-[#CCB68E]" />
            Export Fares CSV
          </a>
        </div>
      </div>

      {/* SIH 2026 Executive Innovation Showcase Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* War Room Feature Spotlight Card */}
        <Link
          to="/war-room"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FAF8F5] via-white to-[#5A7C83]/10 border border-[#5A7C83]/40 p-5 shadow-xs hover:border-[#2C444D] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#A88C6C]/15 border border-[#A88C6C]/40 text-[#A88C6C]">
                <Radar className="w-4 h-4 animate-spin text-[#A88C6C]" style={{ animationDuration: '6s' }} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#A88C6C] animate-ping" />
              </span>
              <span className="text-[11px] font-mono font-bold tracking-wider text-[#2C444D] uppercase bg-[#CCB68E]/25 px-2 py-0.5 rounded border border-[#CCB68E]">
                DEFCON 2 • THREAT LEVEL AMBER
              </span>
            </div>
            <span className="text-xs font-mono text-[#5A7C83] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
              LAUNCH WAR ROOM →
            </span>
          </div>
          <h3 className="text-base font-bold text-[#2C444D] group-hover:text-[#5A7C83] transition-colors">
            National Aviation War Room (DGCA AI Radar)
          </h3>
          <p className="text-xs text-[#5A7C83] mt-1 leading-relaxed">
            Holographic 360° airspace sweep, <strong>voice AI executive audio briefing</strong>, algorithmic cartel detection, and statutory show-cause enforcement notice generator.
          </p>
        </Link>

        {/* Crisis Simulator Feature Spotlight Card */}
        <Link
          to="/simulator"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FAF8F5] via-white to-[#CCB68E]/20 border border-[#CCB68E]/60 p-5 shadow-xs hover:border-[#A88C6C] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#CCB68E]/25 border border-[#CCB68E] text-[#A88C6C]">
                <Flame className="w-4 h-4 text-[#A88C6C]" />
              </span>
              <span className="text-[11px] font-mono font-bold tracking-wider text-[#2C444D] uppercase bg-[#CCB68E]/25 px-2 py-0.5 rounded border border-[#CCB68E]">
                WHAT-IF POLICY STRESS ENGINE
              </span>
            </div>
            <span className="text-xs font-mono text-[#A88C6C] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
              OPEN SIMULATOR →
            </span>
          </div>
          <h3 className="text-base font-bold text-[#2C444D] group-hover:text-[#A88C6C] transition-colors">
            Crisis & Festival Shockwave Simulator
          </h3>
          <p className="text-xs text-[#5A7C83] mt-1 leading-relaxed">
            Stress-test sudden <strong>Diwali festive rushes</strong>, +35% jet fuel (ATF) crude shocks, and cyclone hub groundings with live geospatial shockwave pulses and CPI inflation math.
          </p>
        </Link>
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

      {/* Real-Time External Drivers & Anti-Gouging Radar */}
      <ExternalDriversRadar
        unjustifiedCount={unjustifiedRoutes.length}
        onRefresh={loadAllData}
      />

      {/* Unusually Expensive Routes & Anomalies Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 mb-5 gap-3">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-gray-900">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>UNUSUALLY EXPENSIVE ROUTES & CAUSAL ANOMALY FORENSICS</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-mono font-bold">
                {anomalies?.unusual_count ?? 0} High Alerts
              </span>
              {unjustifiedRoutes.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold animate-pulse">
                  {unjustifiedRoutes.length} Predatory Hikes
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Automated anti-gouging forensics cross-referencing fares with real-time jet fuel, weather/cyclone telemetry, and festive calendars.
            </p>
          </div>
          <Link
            to="/routes"
            className="btn-secondary h-8 px-3 text-xs"
          >
            View All Routes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Anomaly Route Cards / Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {anomalies?.items.slice(0, 6).map((item) => {
            const isPredatory = item.is_justified === false || item.is_predatory_alert === true;
            return (
              <div
                key={item.route}
                className={`p-4 rounded-xl border transition-all ${
                  isPredatory
                    ? 'bg-red-50/80 border-2 border-red-500 shadow-md ring-2 ring-red-500/20'
                    : item.status === 'EXTREME'
                    ? 'bg-rose-50 border-rose-300 shadow-xs'
                    : item.status === 'UNUSUALLY HIGH'
                    ? 'bg-orange-50 border-orange-300 shadow-xs'
                    : item.status === 'ELEVATED'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Predatory / Unjustified Warning Banner */}
                {isPredatory && (
                  <div className="mb-2.5 px-2.5 py-1.5 bg-red-600 text-white rounded-lg flex items-center justify-between text-[11px] font-black uppercase tracking-tight shadow-xs animate-pulse">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>WITHOUT REASON: PREDATORY HIKE</span>
                    </span>
                    <span className="bg-red-950/80 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                      {item.gouging_risk_score || 85}% GOUGING RISK
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-bold text-slate-900 font-mono flex items-center gap-1.5">
                      <span>{item.origin}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span>{item.destination}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Cheapest: <span className="text-slate-700 font-semibold">{item.cheapest_airline || 'IndiGo'}</span>
                    </div>
                  </div>
                  <AnomalyBadge status={item.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 my-3 pt-2 border-t border-slate-200/80 text-xs">
                  <div>
                    <div className="text-slate-500">Current Fare</div>
                    <div className={`text-base font-bold font-mono ${isPredatory ? 'text-red-600 font-black' : 'text-slate-900'}`}>
                      ₹{Math.round(item.current_price).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">30-Day Average</div>
                    <div className="text-base font-bold font-mono text-slate-600">
                      ₹{Math.round(item.baseline_30d).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Difference & Trajectory */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Difference:</span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        isPredatory ? 'text-red-600 font-black' : item.percentage_difference > 35 ? 'text-rose-600' : item.percentage_difference > 15 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {item.percentage_difference > 0 ? `+${item.percentage_difference.toFixed(1)}%` : `${item.percentage_difference.toFixed(1)}%`}
                    </span>
                  </div>
                  <SpikeBadge type={item.classification_type} />
                </div>

                {/* Causal Justification Badge */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <JustificationBadge
                    category={item.justification_category}
                    isJustified={item.is_justified}
                    label={item.justification_label}
                    gougingScore={item.gouging_risk_score}
                  />
                </div>

                {/* Causal Explanation or Missing Reason Box */}
                {item.justification_detail && (
                  <div
                    className={`mt-2 p-2 rounded text-[11px] leading-snug border flex items-start gap-1.5 ${
                      isPredatory
                        ? 'bg-red-100/90 border-red-300 text-red-900 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Info className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isPredatory ? 'text-red-600' : 'text-blue-500'}`} />
                    <span>{item.justification_detail}</span>
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <Link
                    to={`/routes/${item.route}`}
                    className="btn-secondary h-7 px-2.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Analyze Corridor <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
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
