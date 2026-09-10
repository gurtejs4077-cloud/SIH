import React from 'react';
import { TransmissionBracket } from '../types';
import { Building2, Trees, Combine, TrendingUp, Layers, Info } from 'lucide-react';

interface CPITransmissionCardProps {
  brackets: TransmissionBracket[];
  benchmarkPeriod: string;
}

export const CPITransmissionCard: React.FC<CPITransmissionCardProps> = ({
  brackets,
  benchmarkPeriod,
}) => {
  const getBracketIcon = (bracket: string) => {
    switch (bracket) {
      case 'Urban':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'Rural':
        return <Trees className="w-5 h-5 text-emerald-400" />;
      case 'Combined':
      default:
        return <Combine className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            MoSPI eSankhyiki Transmission to Urban & Rural Brackets
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Transport & Communication Subgroup CPI (Base 2012=100) • Official Benchmark: {benchmarkPeriod}
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
          MoSPI Base 2012=100
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {brackets.map((item) => (
          <div
            key={item.bracket}
            className={`p-5 rounded-xl border transition-all ${
              item.bracket === 'Urban'
                ? 'bg-blue-950/20 border-blue-800/60 shadow-md shadow-blue-950/20'
                : item.bracket === 'Rural'
                ? 'bg-emerald-950/20 border-emerald-800/60 shadow-md shadow-emerald-950/20'
                : 'bg-purple-950/20 border-purple-800/60 shadow-md shadow-purple-950/20'
            }`}
          >
            {/* Bracket Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                {getBracketIcon(item.bracket)}
                <span className="font-bold text-white text-base">
                  CPI-{item.bracket}
                </span>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                Weight: {item.basket_weight_pct}%
              </span>
            </div>

            {/* Transport CPI Level Comparison */}
            <div className="grid grid-cols-2 gap-3 my-3 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-slate-400 text-[11px] mb-1">MoSPI Benchmark</div>
                <div className="text-lg font-bold font-mono text-slate-300">
                  {item.benchmark_transport_cpi.toFixed(1)}
                </div>
                <div className="text-[10px] text-slate-500">Official eSankhyiki</div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-slate-400 text-[11px] mb-1">Real-Time Augmented</div>
                <div className="text-lg font-bold font-mono text-white">
                  {item.augmented_transport_cpi.toFixed(1)}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold">
                  +{item.subgroup_inflation_impact_pct}% impact
                </div>
              </div>
            </div>

            {/* Pass-Through Metrics */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Airfare Subgroup Share:</span>
                <span className="font-mono font-semibold">{item.airfare_share_in_subgroup}%</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Headline Basket Share:</span>
                <span className="font-mono font-semibold">{item.effective_airfare_weight_in_headline}%</span>
              </div>

              <div className="flex items-center justify-between pt-1 font-semibold">
                <span className="text-slate-200">Headline Pass-Through:</span>
                <span className="font-mono text-amber-400 font-bold text-sm">
                  +{item.headline_pass_through_bps} bps
                </span>
              </div>
            </div>

            {/* Context Note */}
            <div className="mt-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 flex items-start gap-1">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                {item.bracket === 'Urban'
                  ? 'High sensitivity due to metro trunk route traffic concentration.'
                  : item.bracket === 'Rural'
                  ? 'Muted direct impact; transmission driven by UDAN regional hubs.'
                  : 'Blended national macro headline impact for policy targeting.'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
