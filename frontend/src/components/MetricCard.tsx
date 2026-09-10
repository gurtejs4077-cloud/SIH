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
          ? 'bg-blue-50 border-blue-200 shadow-sm'
          : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between text-gray-500 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-extrabold text-gray-900 font-mono tracking-tight">
          {value}
        </div>

        {changePct !== undefined && (
          <div
            className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded ${
              isPositive
                ? 'text-rose-700 bg-rose-50 border border-rose-200'
                : isNegative
                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                : 'text-gray-500 bg-gray-100'
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
        <div className="mt-2.5 text-xs text-gray-500 flex items-center justify-between">
          {changeLabel && <span className="font-medium">{changeLabel}</span>}
          {subtext && <span className="text-gray-400">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
