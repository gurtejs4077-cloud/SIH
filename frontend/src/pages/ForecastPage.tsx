import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  LineChart as LineChartIcon,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Compass,
  Landmark,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { fetchAirfareForecast, fetchRoutes, ForecastResponse } from '../services/api';
import type { RouteItem } from '../types';

export const ForecastPage: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('ALL');
  const [horizon, setHorizon] = useState<number>(30);
  const [model, setModel] = useState<string>('ensemble');
  const [chartMetric, setChartMetric] = useState<'fare' | 'index'>('fare');
  const [loading, setLoading] = useState<boolean>(true);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const data = await fetchAirfareForecast(selectedRoute, horizon, model);
      setForecast(data);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes().then(setRoutes).catch(() => {});
  }, []);

  useEffect(() => {
    loadForecast();
  }, [selectedRoute, horizon, model]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#FAF8F5]/95 backdrop-blur-sm text-[#2C444D] p-3.5 rounded-xl border border-[#C7B8A4] shadow-xl text-xs space-y-1.5 font-sans min-w-[210px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#C7B8A4]/60 font-bold">
            <span className="text-[#2C444D]">{data.date} ({data.day_name})</span>
            {data.is_future ? (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white text-[#5A7C83] border border-[#5A7C83]">
                AI Forecast
              </span>
            ) : (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white text-[#2C444D] border border-[#2C444D]">
                Observed
              </span>
            )}
          </div>

          {chartMetric === 'fare' ? (
            <>
              {data.fare_actual !== null && (
                <div className="flex justify-between items-center text-[#2C444D]">
                  <span className="font-medium">Actual Fare:</span>
                  <strong className="font-mono text-sm font-bold">₹{Math.round(data.fare_actual).toLocaleString()}</strong>
                </div>
              )}
              {data.fare_predicted !== null && (
                <div className="flex justify-between items-center text-[#5A7C83]">
                  <span className="font-medium">Predicted Fare:</span>
                  <strong className="font-mono text-sm font-bold">₹{Math.round(data.fare_predicted).toLocaleString()}</strong>
                </div>
              )}
              {data.upper_bound !== null && data.lower_bound !== null && (
                <div className="pt-1 border-t border-[#C7B8A4]/40 text-[11px] text-[#A88C6C] flex justify-between">
                  <span>95% CI Range:</span>
                  <span className="font-mono font-bold text-[#2C444D]">
                    ₹{Math.round(data.lower_bound).toLocaleString()} - ₹{Math.round(data.upper_bound).toLocaleString()}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {data.index_actual !== null && (
                <div className="flex justify-between items-center text-[#2C444D]">
                  <span className="font-medium">Actual Index:</span>
                  <strong className="font-mono text-sm font-bold">{data.index_actual.toFixed(2)}</strong>
                </div>
              )}
              {data.index_predicted !== null && (
                <div className="flex justify-between items-center text-[#5A7C83]">
                  <span className="font-medium">Predicted Index:</span>
                  <strong className="font-mono text-sm font-bold">{data.index_predicted.toFixed(2)}</strong>
                </div>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  const handoverPoint = forecast?.timeline.find((pt) => pt.fare_actual !== null && pt.fare_predicted !== null);

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#C7B8A4]/70">
        <div>
          <div className="flex items-center gap-2 text-xl font-bold text-[#2C444D]">
            <Sparkles className="w-6 h-6 text-[#5A7C83]" />
            <span>AI Predictive Forecasting & Inflation Nowcasting Studio</span>
          </div>
          <p className="text-xs text-[#2C444D]/80 mt-1 max-w-4xl leading-relaxed">
            High-frequency time-series machine learning model projecting domestic airline tariffs and MoSPI CPI transport pass-through.
            Visualizes historical observed baseline <strong className="text-[#2C444D] font-bold">(Solid Line)</strong> vs. forward projected trajectory <strong className="text-[#5A7C83] font-bold">(Dashed Line)</strong>.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Corridor Selector */}
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="h-9 px-3 text-xs font-semibold rounded-lg bg-white border border-[#C7B8A4] text-[#2C444D] focus:outline-none focus:border-[#5A7C83] shadow-xs cursor-pointer"
          >
            <option value="ALL">🌐 All India Composite Network</option>
            {routes.map((r) => (
              <option key={r.code} value={r.code}>
                ✈️ {r.code} ({r.origin} → {r.destination})
              </option>
            ))}
          </select>

          {/* Horizon Selector */}
          <div className="inline-flex rounded-lg border border-[#C7B8A4] bg-white p-0.5 shadow-xs">
            <button
              onClick={() => setHorizon(15)}
              className={`h-7 px-2.5 text-[11px] font-semibold rounded-md transition-all ${
                horizon === 15 ? 'bg-[#2C444D] text-white shadow-xs' : 'text-[#2C444D]/70 hover:text-[#2C444D]'
              }`}
            >
              15D Ahead
            </button>
            <button
              onClick={() => setHorizon(30)}
              className={`h-7 px-2.5 text-[11px] font-semibold rounded-md transition-all ${
                horizon === 30 ? 'bg-[#2C444D] text-white shadow-xs' : 'text-[#2C444D]/70 hover:text-[#2C444D]'
              }`}
            >
              30D Ahead
            </button>
            <button
              onClick={() => setHorizon(60)}
              className={`h-7 px-2.5 text-[11px] font-semibold rounded-md transition-all ${
                horizon === 60 ? 'bg-[#2C444D] text-white shadow-xs' : 'text-[#2C444D]/70 hover:text-[#2C444D]'
              }`}
            >
              60D Ahead
            </button>
          </div>

          {/* Model Engine Selector */}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-9 px-3 text-xs font-semibold rounded-lg bg-white border border-[#C7B8A4] text-[#2C444D] focus:outline-none focus:border-[#5A7C83] shadow-xs cursor-pointer"
          >
            <option value="ensemble">Ensemble (ARIMA + Seasonal Drift)</option>
            <option value="holt-winters">Holt-Winters (Festival Weighted)</option>
            <option value="monte-carlo">Monte Carlo Volatility Bands</option>
          </select>

          <button
            onClick={loadForecast}
            disabled={loading}
            className="btn-secondary h-9 px-3"
            title="Recalculate AI Projections"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Observed Fare */}
        <div className="bg-white border border-[#C7B8A4] rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#2C444D]/70 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-[11px]">Current Baseline Fare</span>
            <Calendar className="w-4 h-4 text-[#2C444D]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#2C444D]">
            ₹{forecast ? Math.round(forecast.current_price).toLocaleString() : '—'}
          </div>
          <div className="mt-2 text-xs text-[#2C444D]/70 flex items-center gap-1">
            <span className="text-[#2C444D] font-bold">Solid Line Baseline</span>
            <span>• Base Reference: ₹{forecast ? Math.round(forecast.baseline_reference_price).toLocaleString() : '—'}</span>
          </div>
        </div>

        {/* Projected Future Price */}
        <div className="bg-white border border-[#5A7C83]/50 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#5A7C83] text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-[11px]">Forecasted Price (T+{horizon})</span>
            <Sparkles className="w-4 h-4 text-[#5A7C83]" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#2C444D]">
              ₹{forecast ? Math.round(forecast.predicted_price_end).toLocaleString() : '—'}
            </div>
            {forecast && (
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${
                  forecast.predicted_change_pct > 0
                    ? 'bg-[#FAF8F5] text-[#A88C6C] border-[#A88C6C]'
                    : 'bg-[#FAF8F5] text-[#5A7C83] border-[#5A7C83]'
                }`}
              >
                {forecast.predicted_change_pct > 0 ? '+' : ''}
                {forecast.predicted_change_pct}%
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-[#5A7C83] font-semibold">
            Dashed Line Trajectory • {horizon}-Day Horizon
          </div>
        </div>

        {/* Forecast Model Fit & Precision */}
        <div className="bg-white border border-[#C7B8A4] rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#2C444D]/70 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-[11px]">AI Model Accuracy (R²)</span>
            <ShieldCheck className="w-4 h-4 text-[#5A7C83]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#2C444D]">
            {forecast ? `${forecast.r2_accuracy}%` : '—'}
          </div>
          <div className="mt-2 text-xs text-[#2C444D]/70">
            Mean Standard Error: <strong className="text-[#2C444D]">±{forecast?.mean_error_pct}%</strong> (95% CI)
          </div>
        </div>

        {/* CPI Pass-Through Impact */}
        <div className="bg-white border border-[#C7B8A4] rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#2C444D]/70 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider text-[11px]">Projected Headline CPI</span>
            <Landmark className="w-4 h-4 text-[#A88C6C]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#2C444D]">
            {forecast ? `+${forecast.projected_cpi_impact.headline_bps} bps` : '—'}
          </div>
          <div className="mt-2 text-xs text-[#2C444D]/70 flex items-center justify-between">
            <span>Transport Subgroup: {forecast?.projected_cpi_impact.transport_cpi_delta_pct}%</span>
            <span className="text-[10px] font-bold text-[#A88C6C] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#C7B8A4]">
              {forecast?.projected_cpi_impact.monetary_signal}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="bg-white border border-[#C7B8A4] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Chart Top Header & Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#C7B8A4]/60 gap-3">
          <div>
            <div className="text-base font-bold text-[#2C444D] flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-[#5A7C83]" />
              <span>AIRFARE TIME-SERIES PREDICTIVE NOWCASTING</span>
            </div>
            <p className="text-xs text-[#2C444D]/70 mt-0.5">
              Continuously stitched historical observations transitioning into projected forecast at today's handover point.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Metric Toggle: Fare vs Index */}
            <div className="inline-flex rounded-lg border border-[#C7B8A4] bg-[#FAF8F5] p-0.5 shadow-xs">
              <button
                onClick={() => setChartMetric('fare')}
                className={`h-7 px-3 text-xs font-semibold rounded-md transition-all ${
                  chartMetric === 'fare' ? 'bg-[#2C444D] text-white shadow-xs' : 'text-[#2C444D]/70 hover:text-[#2C444D]'
                }`}
              >
                Tariffs (₹)
              </button>
              <button
                onClick={() => setChartMetric('index')}
                className={`h-7 px-3 text-xs font-semibold rounded-md transition-all ${
                  chartMetric === 'index' ? 'bg-[#2C444D] text-white shadow-xs' : 'text-[#2C444D]/70 hover:text-[#2C444D]'
                }`}
              >
                Price Index (Base 100)
              </button>
            </div>
          </div>
        </div>

        {/* Visual Legend Key Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-[#FAF8F5] rounded-xl border border-[#C7B8A4] text-xs">
          <div className="flex flex-wrap items-center gap-5">
            {/* Solid Past Line */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-1 bg-[#2C444D] inline-block rounded-full" />
              <span className="font-bold text-[#2C444D]">Historical Observed</span>
              <span className="text-[11px] text-[#2C444D]/60 font-mono">(Solid Line)</span>
            </div>

            {/* Dashed Future Line */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 border-t-2 border-dashed border-[#5A7C83] inline-block" />
              <span className="font-bold text-[#5A7C83]">AI Predicted Trajectory</span>
              <span className="text-[11px] text-[#5A7C83]/70 font-mono">(Dashed Line)</span>
            </div>

            {/* Confidence Interval */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-3 bg-[#C7B8A4]/40 border border-[#C7B8A4] rounded inline-block" />
              <span className="font-semibold text-[#2C444D]">95% Confidence Interval</span>
              <span className="text-[11px] text-[#2C444D]/60 font-mono">(Uncertainty Envelope)</span>
            </div>
          </div>

          <div className="text-[11px] text-[#A88C6C] font-mono">
            Handover Date: <strong className="text-[#2C444D]">{handoverPoint?.date || 'Today'}</strong>
          </div>
        </div>

        {/* Recharts Render Area */}
        <div className="h-[440px] w-full pt-2">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-[#A88C6C] gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#5A7C83]" />
              <span className="text-sm font-semibold text-[#2C444D]">Computing Time-Series Projections...</span>
            </div>
          ) : forecast ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecast.timeline} margin={{ top: 15, right: 25, left: 10, bottom: 25 }}>
                <defs>
                  <linearGradient id="colorCi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C7B8A4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C7B8A4" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(199, 184, 164, 0.35)" vertical={false} />
                <XAxis
                  dataKey="formatted_date"
                  stroke="#A88C6C"
                  fontSize={11}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#A88C6C"
                  fontSize={11}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => (chartMetric === 'fare' ? `₹${Math.round(val)}` : `${val}`)}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Handover Line Marking Today */}
                {handoverPoint && (
                  <ReferenceLine
                    x={handoverPoint.formatted_date}
                    stroke="#A88C6C"
                    strokeDasharray="3 3"
                    label={{
                      value: 'TODAY',
                      position: 'top',
                      fill: '#2C444D',
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}
                  />
                )}

                {/* 95% Confidence Interval Area */}
                {chartMetric === 'fare' && (
                  <Area
                    type="monotone"
                    dataKey="upper_bound"
                    stroke="transparent"
                    fill="url(#colorCi)"
                    name="95% Upper CI"
                  />
                )}

                {/* 1. Historical Data: Solid Blue Line -> Deep Petrol (#2C444D) */}
                <Line
                  type="monotone"
                  dataKey={chartMetric === 'fare' ? 'fare_actual' : 'index_actual'}
                  stroke="#2C444D"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#2C444D' }}
                  activeDot={{ r: 5, fill: '#2C444D' }}
                  connectNulls={false}
                  name="Historical Observed (Solid)"
                />

                {/* 2. Predicted Data: Dashed Purple Line -> Slate Teal (#5A7C83) */}
                <Line
                  type="monotone"
                  dataKey={chartMetric === 'fare' ? 'fare_predicted' : 'index_predicted'}
                  stroke="#5A7C83"
                  strokeWidth={2.5}
                  strokeDasharray="6 6"
                  dot={{ r: 2, fill: '#5A7C83' }}
                  activeDot={{ r: 5, fill: '#5A7C83' }}
                  connectNulls={false}
                  name="Future Forecast (Dashed)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>

      {/* Narrative Forensics & Seasonal Surge Diagnostics */}
      {forecast && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Peak Warning Diagnostic */}
          <div className="bg-white border border-[#C7B8A4] rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#A88C6C] font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-[#A88C6C]" />
              <span>Projected Peak Pricing Window</span>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#C7B8A4] rounded-lg">
              <div className="text-xs text-[#2C444D] font-bold">
                Anticipated Peak Date: {forecast.peak_forecast.formatted}
              </div>
              <div className="text-lg font-mono font-extrabold text-[#A88C6C] mt-1">
                ₹{Math.round(forecast.peak_forecast.fare).toLocaleString()}
              </div>
              <div className="text-[11px] text-[#2C444D]/80 mt-1 leading-snug">
                Capacity squeeze driven by anticipated weekend traffic cycle and seasonal demand cluster.
              </div>
            </div>
          </div>

          {/* Optimal Consumer Savings Horizon */}
          <div className="bg-white border border-[#C7B8A4] rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#5A7C83] font-bold text-xs uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-[#5A7C83]" />
              <span>Optimal Early-Bird Booking Window</span>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#C7B8A4] rounded-lg">
              <div className="text-xs text-[#2C444D] font-bold">
                Anticipated Lowest Fare: {forecast.trough_forecast.formatted}
              </div>
              <div className="text-lg font-mono font-extrabold text-[#5A7C83] mt-1">
                ₹{Math.round(forecast.trough_forecast.fare).toLocaleString()}
              </div>
              <div className="text-[11px] text-[#2C444D]/80 mt-1 leading-snug">
                Mid-week equilibrium window offering lowest advance tariff reservations.
              </div>
            </div>
          </div>

          {/* MoSPI Policy Significance */}
          <div className="bg-white border border-[#C7B8A4] rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#2C444D] font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-[#5A7C83]" />
              <span>Nowcasting Value for MoSPI</span>
            </div>
            <p className="text-xs text-[#2C444D]/80 leading-relaxed">
              Official Consumer Price Index (CPI) reports are published with a 12 to 15-day publication lag.
              This predictive engine generates an early warning flash inflation indicator, giving monetary authorities 2 to 4 weeks of advance notice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
