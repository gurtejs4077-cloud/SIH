import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  changePct?: number;
  changeLabel?: string;
  subtext?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  changePct,
  changeLabel,
  subtext,
  icon,
  highlight = false,
}) => {
  const isPositive = changePct !== undefined && changePct > 0;
  const isNegative = changePct !== undefined && changePct < 0;

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        highlight
          ? 'bg-white border-[#5A7C83] shadow-xs ring-1 ring-[#5A7C83]/30'
          : 'bg-white border-[#C7B8A4] hover:border-[#A88C6C] shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between text-[#5A7C83] mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        {icon && <div className="text-[#A88C6C]">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-bold text-[#2C444D] font-mono tracking-tight">
          {value}
        </div>

        {changePct !== undefined && (
          <div
            className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded ${
              isPositive
                ? 'text-[#2C444D] bg-[#CCB68E]/30 border border-[#A88C6C]/60'
                : isNegative
                ? 'text-[#ffffff] bg-[#5A7C83] border border-[#5A7C83]'
                : 'text-[#2C444D] bg-[#C7B8A4]/25 border border-[#C7B8A4]'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : isNegative ? (
              <TrendingDown className="w-3 h-3 mr-1" />
            ) : (
              <Minus className="w-3 h-3 mr-1" />
            )}
            {isPositive ? `+${changePct.toFixed(1)}%` : `${changePct.toFixed(1)}%`}
          </div>
        )}
      </div>

      {(changeLabel || subtext) && (
        <div className="mt-2.5 text-xs text-[#5A7C83] flex items-center justify-between">
          {changeLabel && <span className="font-medium text-[#2C444D]">{changeLabel}</span>}
          {subtext && <span className="text-[#A88C6C]">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
