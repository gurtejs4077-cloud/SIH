import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { BookingWindowPoint } from '../types';
import { PiggyBank, Clock } from 'lucide-react';

interface BookingWindowChartProps {
  windows: BookingWindowPoint[];
  maxSavingDescription?: string;
}

export const BookingWindowChart: React.FC<BookingWindowChartProps> = ({
  windows,
  maxSavingDescription,
}) => {
  if (!windows || windows.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[#A88C6C] text-xs">
        No booking window elasticity observations available.
      </div>
    );
  }

  // Ensure sorted by advance days: 1, 7, 15, 30, 45
  const sortedWindows = [...windows].sort((a, b) => a.advance_days - b.advance_days);

  // Extract T+30 savings metric
  const t30 = sortedWindows.find((w) => w.advance_days === 30);

  return (
    <div className="w-full">
      {/* Elasticity Highlight Banner */}
      <div className="mb-4 p-3 bg-[#FAF8F5] border border-[#C7B8A4] rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#2C444D]">
          <PiggyBank className="w-4 h-4 text-[#5A7C83]" />
          <span className="font-bold">Advance Booking Price Elasticity:</span>
          <span className="text-[#2C444D]/80">
            {maxSavingDescription || (t30 && t30.savings_vs_last_minute_inr > 0
              ? `Average saving from booking 30 days early: ₹${Math.round(t30.savings_vs_last_minute_inr).toLocaleString()} / ${t30.savings_vs_last_minute_pct.toFixed(1)}%`
              : 'Substantial discount for advance planning')}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#2C444D]/70 font-mono">
          <Clock className="w-3.5 h-3.5 text-[#2C444D]" />
          <span>T+1: Peak Surge</span>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sortedWindows} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(199, 184, 164, 0.4)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#A88C6C"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#C7B8A4' }}
            />
            <YAxis
              stroke="#A88C6C"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#C7B8A4' }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FAF8F5',
                borderColor: '#C7B8A4',
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: '#2C444D',
                boxShadow: '0 4px 6px -1px rgba(44, 68, 77, 0.1)',
              }}
              formatter={(value: any, name: any, item: any) => {
                const saving = item.payload.savings_vs_last_minute_inr;
                const pct = item.payload.savings_vs_last_minute_pct;
                return [
                  `₹${Number(value).toLocaleString()}${
                    saving > 0 ? ` (Save ₹${Math.round(saving).toLocaleString()} / ${pct}%)` : ' (Last-minute)'
                  }`,
                  'Average Fare',
                ];
              }}
              labelFormatter={(label) => `Booking Window: ${label} (${label.replace('T+', '')} days before flight)`}
            />
            <Line
              type="monotone"
              dataKey="average_fare"
              stroke="#5A7C83"
              strokeWidth={3}
              dot={{ stroke: '#5A7C83', strokeWidth: 2, r: 5, fill: '#FAF8F5' }}
              activeDot={{ r: 7, fill: '#5A7C83' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Booking Window Step Summary Table */}
      <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-[#C7B8A4]/40 text-center">
        {sortedWindows.map((w) => (
          <div key={w.label} className="bg-[#FAF8F5] p-2 rounded border border-[#C7B8A4]">
            <div className="text-[11px] font-bold text-[#A88C6C] font-mono">{w.label}</div>
            <div className="text-xs font-mono font-bold text-[#2C444D] my-0.5">
              ₹{Math.round(w.average_fare).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#2C444D]/70 font-semibold">
              {w.advance_days === 1 ? (
                <span className="text-[#A88C6C]">Surge Base</span>
              ) : (
                <span className="text-[#5A7C83]">-{w.savings_vs_last_minute_pct}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
