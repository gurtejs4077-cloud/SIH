import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { AirlineItem } from '../types';

interface AirlineComparisonChartProps {
  airlines: AirlineItem[];
}

export const AirlineComparisonChart: React.FC<AirlineComparisonChartProps> = ({ airlines }) => {
  if (!airlines || airlines.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-xs">
        No airline comparison data available.
      </div>
    );
  }

  const chartData = airlines.map((a) => ({
    name: a.name,
    code: a.code,
    current: a.current_avg_fare || 0,
    past7d: a.avg_fare_7d || 0,
    change: a.change_pct || 0,
  }));

  return (
    <div className="w-full">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
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
              formatter={(val: any, name: any) => [
                `₹${Number(val).toLocaleString()}`,
                name === 'current' ? 'Current Avg Fare' : '7-Day Baseline',
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => (value === 'current' ? 'Current Fare' : '7-Day Baseline')}
            />
            <Bar dataKey="current" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="past7d" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
