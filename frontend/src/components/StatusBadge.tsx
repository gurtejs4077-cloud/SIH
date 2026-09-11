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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FAF8F5] text-[#A88C6C] border-2 border-[#A88C6C] ${className}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-[#A88C6C] animate-pulse" />
          EXTREME (+60%+)
        </span>
      );
    case 'UNUSUALLY HIGH':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FAF8F5] text-[#A88C6C] border border-[#A88C6C] ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-[#A88C6C]" />
          UNUSUALLY HIGH (+35-60%)
        </span>
      );
    case 'ELEVATED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FAF8F5] text-[#CCB68E] border border-[#CCB68E] ${className}`}>
          <TrendingUp className="w-3.5 h-3.5 text-[#CCB68E]" />
          ELEVATED (+15-35%)
        </span>
      );
    case 'NORMAL':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FAF8F5] text-[#5A7C83] border border-[#5A7C83] ${className}`}>
          <CheckCircle className="w-3.5 h-3.5 text-[#5A7C83]" />
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
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FAF8F5] text-[#A88C6C] border border-[#A88C6C] ${className}`}>
        <TrendingUp className="w-3.5 h-3.5 text-[#A88C6C]" />
        PERSISTENT INCREASE
      </span>
    );
  } else if (type === 'TEMPORARY SPIKE') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FAF8F5] text-[#CCB68E] border border-[#CCB68E] ${className}`}>
        <Zap className="w-3.5 h-3.5 text-[#CCB68E]" />
        TEMPORARY SPIKE
      </span>
    );
  } else if (type === 'ELEVATED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FAF8F5] text-[#CCB68E] border border-[#CCB68E] ${className}`}>
        ELEVATED BAND
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FAF8F5] text-[#2C444D] border border-[#C7B8A4] ${className}`}>
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
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-[#FAF8F5] text-[#A88C6C] border border-[#C7B8A4] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#A88C6C]" />
        DEMO DATA
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-[#FAF8F5] text-[#5A7C83] border border-[#5A7C83] ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#5A7C83]" />
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-tight bg-[#2C444D] text-white shadow-xs border border-[#A88C6C] ${className}`}
        title="No external cost or weather driver found. Potential algorithmic price gouging!"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A88C6C] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A88C6C]"></span>
        </span>
        <span className="uppercase">{label || 'UNJUSTIFIED HIKE (NO REASON)'}</span>
        {gougingScore > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-[#A88C6C] text-white rounded text-[10px] font-mono font-bold">
            {gougingScore}% RISK
          </span>
        )}
      </span>
    );
  }

  switch (category) {
    case 'WEATHER_CYCLONE':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FAF8F5] text-[#A88C6C] border border-[#A88C6C] ${className}`}>
          <span>🌪️</span>
          <span>CYCLONE / WEATHER DISRUPTION</span>
        </span>
      );
    case 'WEATHER_DISRUPTION':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FAF8F5] text-[#A88C6C] border border-[#A88C6C] ${className}`}>
          <span>⚠️</span>
          <span>WEATHER DELAY EXPLAINED</span>
        </span>
      );
    case 'FUEL_COST':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FAF8F5] text-[#CCB68E] border border-[#CCB68E] ${className}`}>
          <span>⛽</span>
          <span>JET FUEL (ATF) EXPLAINED</span>
        </span>
      );
    case 'FESTIVAL_PEAK':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FAF8F5] text-[#5A7C83] border border-[#5A7C83] ${className}`}>
          <span>🎉</span>
          <span>FESTIVE RUSH EXPLAINED</span>
        </span>
      );
    case 'NORMAL':
    default:
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#FAF8F5] text-[#2C444D] border border-[#C7B8A4] ${className}`}>
          <span>✓</span>
          <span>Within Baseline Band</span>
        </span>
      );
  }
};
