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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#A88C6C]/25 text-[#2C444D] border border-[#A88C6C] animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-[#A88C6C]" />
            HAWKISH TIGHTENING PRESSURE
          </span>
        );
      case 'NEUTRAL_BALANCED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#CCB68E]/25 text-[#2C444D] border border-[#CCB68E]">
            <TrendingUp className="w-3.5 h-3.5 text-[#5A7C83]" />
            NEUTRAL STANCE BALANCED
          </span>
        );
      case 'ACCOMMODATIVE_CUSHION':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#5A7C83]/20 text-[#2C444D] border border-[#5A7C83]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5A7C83]" />
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
    <div className="bg-white border border-[#C7B8A4] rounded-xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#C7B8A4]/60 gap-3">
        <div>
          <div className="text-base font-bold text-[#2C444D] flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#A88C6C]" />
            <span>RBI Monetary Policy Committee (MPC) Stance Impact</span>
          </div>
          <p className="text-xs text-[#5A7C83] mt-0.5">
            Inflation targeting mandate 4.0% (±2.0%) • Policy Repo Rate: <strong className="text-[#2C444D]">{impact.repo_rate.toFixed(2)}%</strong> • Official Stance: <strong className="text-[#5A7C83]">{impact.official_stance}</strong>
          </p>
        </div>
        <div>{getStanceBadge(impact.stance_impact_assessment)}</div>
      </div>

      {/* Visual Inflation Corridor Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#5A7C83] font-mono">
          <span>Lower Band (2.0%)</span>
          <span className="text-[#5A7C83] font-bold">Target (4.0%)</span>
          <span className="text-[#A88C6C] font-bold">Upper Ceiling (6.0%)</span>
        </div>

        {/* Progress bar container */}
        <div className="relative w-full h-5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#C7B8A4] p-0.5">
          {/* Target Zone indicator */}
          <div
            className="absolute top-0 bottom-0 bg-[#5A7C83]/20 border-r border-l border-[#5A7C83]/40"
            style={{ left: '50%', width: '25%' }}
          />

          {/* Baseline CPI fill */}
          <div
            className="h-full bg-[#C7B8A4] rounded-full transition-all duration-500"
            style={{ width: `${baselinePos}%` }}
          />

          {/* Augmented CPI fill addition */}
          <div
            className="absolute top-0.5 bottom-0.5 rounded-r-full bg-[#CCB68E] transition-all duration-500"
            style={{ left: `${baselinePos}%`, width: `${augmentedPos - baselinePos}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#5A7C83]">
          <div>
            Baseline CPI: <strong className="text-[#2C444D] font-mono">{impact.headline_cpi_baseline}%</strong>
          </div>
          <div className="text-[#2C444D] font-semibold font-mono">
            ▲ Airfare Augmented CPI: {impact.headline_cpi_augmented}% (+{(impact.headline_cpi_augmented - impact.headline_cpi_baseline).toFixed(2)}%)
          </div>
          <div>
            Buffer to 6.0%: <strong className="text-[#2C444D] font-mono">{impact.distance_to_upper_ceiling_pct > 0 ? `+${impact.distance_to_upper_ceiling_pct}%` : `${impact.distance_to_upper_ceiling_pct}%`}</strong>
          </div>
        </div>
      </div>

      {/* Pass-Through Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#C7B8A4] shadow-xs">
          <div className="text-[11px] text-[#5A7C83] uppercase font-semibold">Direct Airfare Pass-Through</div>
          <div className="text-2xl font-bold font-mono text-[#2C444D] mt-1">
            +{impact.airfare_direct_pass_through_bps} <span className="text-xs text-[#5A7C83]">bps</span>
          </div>
          <div className="text-[11px] text-[#A88C6C] mt-1">Weighted CPI basket contribution</div>
        </div>

        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#C7B8A4] shadow-xs">
          <div className="text-[11px] text-[#5A7C83] uppercase font-semibold">Second-Round Spillover</div>
          <div className="text-2xl font-bold font-mono text-[#5A7C83] mt-1">
            +{impact.airfare_second_round_pass_through_bps} <span className="text-xs text-[#5A7C83]">bps</span>
          </div>
          <div className="text-[11px] text-[#A88C6C] mt-1">Freight logistics & travel services</div>
        </div>

        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#C7B8A4] shadow-xs">
          <div className="text-[11px] text-[#5A7C83] uppercase font-semibold">Net Inflation Impulse</div>
          <div className="text-2xl font-bold font-mono text-[#A88C6C] mt-1">
            +{(impact.airfare_direct_pass_through_bps + impact.airfare_second_round_pass_through_bps).toFixed(1)} <span className="text-xs text-[#5A7C83]">bps</span>
          </div>
          <div className="text-[11px] text-[#A88C6C] mt-1">Total headline transmission</div>
        </div>
      </div>

      {/* Policy Stance Commentary & Rationale */}
      <div className="p-4 bg-[#CCB68E]/20 rounded-xl border border-[#CCB68E] text-xs text-[#2C444D] flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-[#A88C6C] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#2C444D] block mb-1">Monetary Policy Sensitivity Analysis:</strong>
          {impact.policy_summary_rationale}
        </div>
      </div>
    </div>
  );
};
