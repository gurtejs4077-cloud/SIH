import React from 'react';
import { RBIMPCPassThroughResponse } from '../types';
import { Landmark, ShieldAlert, ShieldCheck, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';

interface RBIMPCGaugeProps {
  impact: RBIMPCPassThroughResponse;
}

export const RBIMPCGauge: React.FC<RBIMPCGaugeProps> = ({ impact }) => {
  const getStanceBadge = (assessment: string) => {
    switch (assessment) {
      case 'HAWKISH_PRESSURE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            HAWKISH TIGHTENING PRESSURE
          </span>
        );
      case 'NEUTRAL_BALANCED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-blue-300 border border-blue-700">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            NEUTRAL STANCE BALANCED
          </span>
        );
      case 'ACCOMMODATIVE_CUSHION':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ACCOMMODATIVE CUSHION PRESERVED
          </span>
        );
    }
  };

  // Calculate percentage along the 2.0% to 6.0% corridor for visual progress bar
  const corridorMin = impact.lower_tolerance; // 2.0
  const corridorMax = impact.upper_tolerance; // 6.0
  const totalRange = corridorMax - corridorMin;
  const augmentedPos = Math.min(
    Math.max(((impact.headline_cpi_augmented - corridorMin) / totalRange) * 100, 0),
    100
  );
  const baselinePos = Math.min(
    Math.max(((impact.headline_cpi_baseline - corridorMin) / totalRange) * 100, 0),
    100
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="text-base font-bold text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-400" />
            <span>RBI Monetary Policy Committee (MPC) Stance Impact</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Inflation targeting mandate 4.0% (±2.0%) • Policy Repo Rate: <strong className="text-white">{impact.repo_rate.toFixed(2)}%</strong> • Official Stance: <strong className="text-blue-300">{impact.official_stance}</strong>
          </p>
        </div>
        <div>{getStanceBadge(impact.stance_impact_assessment)}</div>
      </div>

      {/* Visual Inflation Corridor Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Lower Band (2.0%)</span>
          <span className="text-blue-400 font-bold">Target (4.0%)</span>
          <span className="text-rose-400 font-bold">Upper Ceiling (6.0%)</span>
        </div>

        {/* Progress bar container */}
        <div className="relative w-full h-5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
          {/* Target Zone indicator */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/20 border-r border-l border-emerald-500/40"
            style={{ left: '50%', width: '25%' }}
          />

          {/* Baseline CPI fill */}
          <div
            className="h-full bg-slate-600/70 rounded-full transition-all duration-500"
            style={{ width: `${baselinePos}%` }}
          />

          {/* Augmented CPI fill addition */}
          <div
            className="absolute top-0.5 bottom-0.5 rounded-r-full bg-amber-500 transition-all duration-500"
            style={{ left: `${baselinePos}%`, width: `${augmentedPos - baselinePos}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div>
            Baseline CPI: <strong className="text-slate-200 font-mono">{impact.headline_cpi_baseline}%</strong>
          </div>
          <div className="text-amber-400 font-semibold font-mono">
            ▲ Airfare Augmented CPI: {impact.headline_cpi_augmented}% (+{(impact.headline_cpi_augmented - impact.headline_cpi_baseline).toFixed(2)}%)
          </div>
          <div>
            Buffer to 6.0%: <strong className="text-white font-mono">{impact.distance_to_upper_ceiling_pct > 0 ? `+${impact.distance_to_upper_ceiling_pct}%` : `${impact.distance_to_upper_ceiling_pct}%`}</strong>
          </div>
        </div>
      </div>

      {/* Pass-Through Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Direct Airfare Pass-Through</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            +{impact.airfare_direct_pass_through_bps} <span className="text-xs text-slate-400">bps</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Weighted CPI basket contribution</div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Second-Round Spillover</div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
            +{impact.airfare_second_round_pass_through_bps} <span className="text-xs text-slate-400">bps</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Freight logistics & travel services</div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Net Inflation Impulse</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            +{(impact.airfare_direct_pass_through_bps + impact.airfare_second_round_pass_through_bps).toFixed(1)} <span className="text-xs text-slate-400">bps</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total headline transmission</div>
        </div>
      </div>

      {/* Policy Stance Commentary & Rationale */}
      <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white block mb-1">Monetary Policy Sensitivity Analysis:</strong>
          {impact.policy_summary_rationale}
        </div>
      </div>
    </div>
  );
};
