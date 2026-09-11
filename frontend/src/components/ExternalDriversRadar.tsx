import React, { useState, useEffect } from 'react';
import {
  Flame,
  CloudRain,
  Wind,
  Compass,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Fuel,
  RefreshCw,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { fetchExternalDrivers } from '../services/api';
import { ExternalDriversResponse } from '../types';

interface ExternalDriversRadarProps {
  unjustifiedCount?: number;
  onRefresh?: () => void;
}

export const ExternalDriversRadar: React.FC<ExternalDriversRadarProps> = ({
  unjustifiedCount = 0,
  onRefresh
}) => {
  const [data, setData] = useState<ExternalDriversResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<string>('');

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const res = await fetchExternalDrivers();
      setData(res);
      setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load real-time external drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
    // Poll every 3 minutes for live weather and fuel updates
    const interval = setInterval(loadDrivers, 180000);
    return () => clearInterval(interval);
  }, []);

  const atf = data?.atf_fuel_benchmark;
  const weatherList = data?.airport_weather || [];
  const cycloneAlerts = data?.active_cyclone_alerts || [];
  const disruptions = data?.active_disruptions || [];
  const festivals = data?.active_festivals || [];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                Real-Time External Drivers & Causal Anti-Gouging Radar
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE RADAR ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cross-referencing live Indian Jet Fuel (ATF), airport cyclone & meteorological feeds with fare movements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {lastChecked && (
            <span className="text-[11px] font-mono text-slate-400">
              Updated: {lastChecked}
            </span>
          )}
          <button
            onClick={() => {
              loadDrivers();
              if (onRefresh) onRefresh();
            }}
            disabled={loading}
            className="btn-secondary h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
            title="Refresh live external meteorological and fuel telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            Sync Feeds
          </button>
        </div>
      </div>

      {/* 3 Radar Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Aviation Turbine Fuel (ATF) Monitor */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Fuel className="w-4 h-4 text-amber-600" />
              <span>INDIAN JET FUEL (ATF)</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              (atf?.mom_pct_change || 0) > 5 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {atf?.status || 'STABLE'}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">
                ₹{atf ? Math.round(atf.price_per_kl_inr).toLocaleString() : '93,480'}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ kL (Delhi)</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
              <span className={`font-bold font-mono ${
                (atf?.mom_pct_change || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {(atf?.mom_pct_change || 0) > 0 ? `+${atf?.mom_pct_change}%` : `${atf?.mom_pct_change}%`} MoM
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-[11px] text-slate-500">
                Justified Fare Surcharge: <strong className="text-slate-700">+{atf?.justifiable_fare_impact_pct || 0.6}%</strong>
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 bg-white/70 rounded p-2 border border-slate-200/60 leading-tight">
            Jet fuel represents ~42% of airline operating expenses. Fares rising above fuel pass-through require non-fuel justification.
          </div>
        </div>

        {/* 2. Real-Time Airport Weather & Cyclone Feed */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Wind className="w-4 h-4 text-cyan-600" />
              <span>LIVE WEATHER & CYCLONE RADAR</span>
            </div>
            {cycloneAlerts.length > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 animate-pulse">
                CYCLONE ALERT
              </span>
            ) : disruptions.length > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                WEATHER ADVISORY
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                CLEAR SKIES (VFR)
              </span>
            )}
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">
                {cycloneAlerts.length > 0 ? `${cycloneAlerts.length} Storm Alert` : `${weatherList.length} Hubs Tracked`}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 line-clamp-1">
              {cycloneAlerts.length > 0 
                ? `Cyclone gale alert at ${cycloneAlerts.map(a => a.airport).join(', ')}`
                : disruptions.length > 0 
                ? `Holding patterns / delay advisories at ${disruptions.map(a => a.airport).join(', ')}`
                : 'All major Indian trunk hubs operating with standard VFR visibility'}
            </p>
          </div>

          <div className="text-[10px] text-slate-500 bg-white/70 rounded p-2 border border-slate-200/60 leading-tight">
            Weather disruptions, coastal cyclones, and dense winter fog justify temporary capacity suppression and surging fares.
          </div>
        </div>

        {/* 3. Predatory Pricing / Anti-Gouging Surveillance Indicator */}
        <div className={`rounded-xl p-4 flex flex-col justify-between space-y-3 border transition-all ${
          unjustifiedCount > 0 
            ? 'bg-red-50/70 border-red-200 text-red-950' 
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ShieldAlert className={`w-4 h-4 ${unjustifiedCount > 0 ? 'text-red-600 animate-bounce' : 'text-emerald-600'}`} />
              <span>ANTI-GOUGING AUDIT</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              unjustifiedCount > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-200 text-emerald-800'
            }`}>
              {unjustifiedCount > 0 ? 'FLAGGED FOR AUDIT' : 'COMPLIANT'}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${unjustifiedCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {unjustifiedCount} Corridors
              </span>
              <span className="text-xs text-slate-500 font-medium">Unjustified Hikes</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {unjustifiedCount > 0 
                ? 'Corridors hiked >15% without fuel, weather, or seasonal justification.'
                : 'All observed route price hikes currently have verified external justification.'}
            </p>
          </div>

          <div className={`text-[10px] rounded p-2 border leading-tight ${
            unjustifiedCount > 0 ? 'bg-red-100/70 border-red-300 text-red-900' : 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
          }`}>
            {unjustifiedCount > 0 
              ? 'Highlighted in VIBRANT RED below. Algorithmic dynamic price gouging suspected.' 
              : 'Zero unprovoked cartel pricing detected across active commercial trunk routes.'}
          </div>
        </div>
      </div>

      {/* Weather Ticker Strip across 8 Indian Airports */}
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Live Airport Hub Meteorological Telemetry (Open-Meteo & IMD Feeds)</span>
          <span className="text-slate-400 font-normal">Real-Time Wind & Disruption Signals</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {weatherList.map((apt) => (
            <div
              key={apt.airport}
              className={`p-2 rounded-lg border text-center transition-all ${
                apt.is_cyclone_alert
                  ? 'bg-red-50 border-red-300 text-red-900 ring-2 ring-red-500/20'
                  : apt.is_disrupted
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div className="text-xs font-black font-mono">{apt.airport}</div>
              <div className="text-[10px] font-medium text-slate-500">{apt.temp_c}°C</div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {apt.wind_gusts_kmh} km/h
              </div>
              <div className="mt-1">
                {apt.is_cyclone_alert ? (
                  <span className="px-1 py-0.2 bg-red-600 text-white rounded text-[8px] font-bold">
                    CYCLONE
                  </span>
                ) : apt.is_disrupted ? (
                  <span className="px-1 py-0.2 bg-amber-600 text-white rounded text-[8px] font-bold">
                    DELAY
                  </span>
                ) : (
                  <span className="text-[9px] text-emerald-600 font-semibold">
                    ✓ Clear
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
