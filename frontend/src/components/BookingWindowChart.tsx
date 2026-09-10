import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Dot,
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
      <div className="h-64 flex items-center justify-center text-gray-500 text-xs">
        No booking window elasticity observations available.
      </div>
    );
  }

  // Ensure sorted by advance days: 1, 7, 15, 30, 45
  const sortedWindows = [...windows].sort((a, b) => a.advance_days - b.advance_days);

  // Extract T+30 savings metric
  const t30 = sortedWindows.find((w) => w.advance_days === 30);
  const t45 = sortedWindows.find((w) => w.advance_days === 45);
  const t1 = sortedWindows.find((w) => w.advance_days === 1);

  return (
    <div className="w-full">
      {/* Elasticity Highlight Banner */}
      <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-emerald-800">
          <PiggyBank className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">Advance Booking Price Elasticity:</span>
          <span className="text-gray-700">
            {maxSavingDescription || (t30 && t30.savings_vs_last_minute_inr > 0
              ? `Average saving from booking 30 days early: ₹${Math.round(t30.savings_vs_last_minute_inr).toLocaleString()} / ${t30.savings_vs_last_minute_pct.toFixed(1)}%`
              : 'Substantial discount for advance planning')}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-500 font-mono">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>T+1: Peak Surge</span>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sortedWindows} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#d1d5db' }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: '#111827',
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
              stroke="#10b981"
              strokeWidth={3}
              dot={{ stroke: '#10b981', strokeWidth: 2, r: 5, fill: '#ffffff' }}
              activeDot={{ r: 7, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Booking Window Step Summary Table */}
      <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-gray-200 text-center">
        {sortedWindows.map((w) => (
          <div key={w.label} className="bg-gray-50 p-2 rounded border border-gray-200">
            <div className="text-[11px] font-bold text-gray-500 font-mono">{w.label}</div>
            <div className="text-xs font-mono font-bold text-gray-900 my-0.5">
              ₹{Math.round(w.average_fare).toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500">
              {w.advance_days === 1 ? (
                <span className="text-rose-600 font-semibold">Surge Base</span>
              ) : (
                <span className="text-emerald-600 font-semibold">-{w.savings_vs_last_minute_pct}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
