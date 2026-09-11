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
        return <Building2 className="w-5 h-5 text-[#5A7C83]" />;
      case 'Rural':
        return <Trees className="w-5 h-5 text-[#A88C6C]" />;
      case 'Combined':
      default:
        return <Combine className="w-5 h-5 text-[#CCB68E]" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-[#2C444D] uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#5A7C83]" />
            MoSPI eSankhyiki Transmission to Urban & Rural Brackets
          </div>
          <p className="text-xs text-[#5A7C83] mt-0.5">
            Transport & Communication Subgroup CPI (Base 2012=100) • Official Benchmark: {benchmarkPeriod}
          </p>
        </div>
        <span className="text-[11px] font-mono font-medium text-[#2C444D] bg-[#C7B8A4]/25 px-2.5 py-0.5 rounded-full border border-[#C7B8A4]">
          MoSPI Base 2012=100
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {brackets.map((item) => (
          <div
            key={item.bracket}
            className={`p-5 rounded-xl border transition-all ${
              item.bracket === 'Urban'
                ? 'bg-[#5A7C83]/10 border-[#5A7C83]/40 shadow-xs'
                : item.bracket === 'Rural'
                ? 'bg-[#CCB68E]/15 border-[#CCB68E]/50 shadow-xs'
                : 'bg-[#A88C6C]/15 border-[#A88C6C]/50 shadow-xs'
            }`}
          >
            {/* Bracket Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#C7B8A4]/60">
              <div className="flex items-center gap-2">
                {getBracketIcon(item.bracket)}
                <span className="font-bold text-[#2C444D] text-base">
                  CPI-{item.bracket}
                </span>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white text-[#2C444D] border border-[#C7B8A4] shadow-xs">
                Weight: {item.basket_weight_pct}%
              </span>
            </div>

            {/* Transport CPI Level Comparison */}
            <div className="grid grid-cols-2 gap-3 my-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-[#C7B8A4] shadow-xs">
                <div className="text-[#5A7C83] text-[11px] mb-1">MoSPI Benchmark</div>
                <div className="text-lg font-bold font-mono text-[#2C444D]">
                  {item.benchmark_transport_cpi.toFixed(1)}
                </div>
                <div className="text-[10px] text-[#A88C6C]">Official eSankhyiki</div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-[#C7B8A4] shadow-xs">
                <div className="text-[#5A7C83] text-[11px] mb-1">Real-Time Augmented</div>
                <div className="text-lg font-bold font-mono text-[#2C444D]">
                  {item.augmented_transport_cpi.toFixed(1)}
                </div>
                <div className="text-[10px] text-[#5A7C83] font-bold">
                  +{item.subgroup_inflation_impact_pct}% impact
                </div>
              </div>
            </div>

            {/* Pass-Through Metrics */}
            <div className="space-y-2 pt-2 border-t border-[#C7B8A4]/60 text-xs">
              <div className="flex items-center justify-between text-[#2C444D]">
                <span className="text-[#5A7C83]">Airfare Subgroup Share:</span>
                <span className="font-mono font-semibold">{item.airfare_share_in_subgroup}%</span>
              </div>

              <div className="flex items-center justify-between text-[#2C444D]">
                <span className="text-[#5A7C83]">Headline Basket Share:</span>
                <span className="font-mono font-semibold">{item.effective_airfare_weight_in_headline}%</span>
              </div>

              <div className="flex items-center justify-between pt-1 font-semibold">
                <span className="text-[#2C444D]">Headline Pass-Through:</span>
                <span className="font-mono text-[#A88C6C] font-bold text-sm">
                  +{item.headline_pass_through_bps} bps
                </span>
              </div>
            </div>

            {/* Context Note */}
            <div className="mt-3 text-[11px] text-[#5A7C83] pt-2 border-t border-[#C7B8A4]/60 flex items-start gap-1">
              <Info className="w-3.5 h-3.5 text-[#5A7C83] shrink-0 mt-0.5" />
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
