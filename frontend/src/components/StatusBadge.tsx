import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Zap, TrendingUp } from 'lucide-react';

interface AnomalyBadgeProps {
  status?: string;
  className?: string;
}

export const AnomalyBadge: React.FC<AnomalyBadgeProps> = ({ status = 'NORMAL', className = '' }) => {
  switch (status) {
    case 'EXTREME':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200 ${className}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-red-600 animate-pulse" />
          EXTREME (+60%+)
        </span>
      );
    case 'UNUSUALLY HIGH':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
          UNUSUALLY HIGH (+35-60%)
        </span>
      );
    case 'ELEVATED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
          <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
          ELEVATED (+15-35%)
        </span>
      );
    case 'NORMAL':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          NORMAL (≤15%)
        </span>
      );
  }
};

interface SpikeBadgeProps {
  type?: string;
  className?: string;
}

export const SpikeBadge: React.FC<SpikeBadgeProps> = ({ type = 'NORMAL', className = '' }) => {
  if (type === 'PERSISTENT INCREASE') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
        <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
        PERSISTENT INCREASE
      </span>
    );
  } else if (type === 'TEMPORARY SPIKE') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 ${className}`}>
        <Zap className="w-3.5 h-3.5 text-yellow-600" />
        TEMPORARY SPIKE
      </span>
    );
  } else if (type === 'ELEVATED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
        ELEVATED BAND
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 ${className}`}>
      STABLE BASELINE
    </span>
  );
};

interface AuthenticityBadgeProps {
  isDemo: boolean;
  source?: string;
  className?: string;
}

export const AuthenticityBadge: React.FC<AuthenticityBadgeProps> = ({ isDemo, source, className = '' }) => {
  if (isDemo) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        DEMO DATA
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      ✓ VERIFIED OBSERVATION {source ? `(${source})` : ''}
    </span>
  );
};

interface JustificationBadgeProps {
  category?: string;
  isJustified?: boolean;
  label?: string;
  gougingScore?: number;
  className?: string;
}

export const JustificationBadge: React.FC<JustificationBadgeProps> = ({
  category = 'NORMAL',
  isJustified = true,
  label,
  gougingScore = 0,
  className = ''
}) => {
  if (!isJustified || category === 'UNJUSTIFIED_GOUGING') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black tracking-tight bg-red-600 text-white shadow-xs border border-red-700 animate-pulse ${className}`}
        title="No external cost or weather driver found. Potential algorithmic price gouging!"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span className="uppercase">{label || 'UNJUSTIFIED HIKE (NO REASON)'}</span>
        {gougingScore > 0 && (
          <span className="ml-1 px-1.5 py-0.2 bg-red-950/80 rounded text-[10px] font-mono">
            {gougingScore}% RISK
          </span>
        )}
      </span>
    );
  }

  switch (category) {
    case 'WEATHER_CYCLONE':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 ${className}`}>
          <span>🌪️</span>
          <span>CYCLONE / WEATHER DISRUPTION</span>
        </span>
      );
    case 'WEATHER_DISRUPTION':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 ${className}`}>
          <span>⚠️</span>
          <span>WEATHER DELAY EXPLAINED</span>
        </span>
      );
    case 'FUEL_COST':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 ${className}`}>
          <span>⛽</span>
          <span>JET FUEL (ATF) EXPLAINED</span>
        </span>
      );
    case 'FESTIVAL_PEAK':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-300 ${className}`}>
          <span>🎉</span>
          <span>FESTIVE RUSH EXPLAINED</span>
        </span>
      );
    case 'NORMAL':
    default:
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
          <span>✓</span>
          <span>Within Baseline Band</span>
        </span>
      );
  }
};
