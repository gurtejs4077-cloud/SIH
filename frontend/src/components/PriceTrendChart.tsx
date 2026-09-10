import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  index_score?: number;
  average_fare?: number;
  min_fare?: number;
  max_fare?: number;
}

interface PriceTrendChartProps {
  data: TrendDataPoint[];
  dataKey: 'index_score' | 'average_fare';
  title?: string;
  unit?: string;
  color?: string;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  data,
  dataKey,
  title = 'Price Index Trajectory (30-Day)',
  unit = '',
  color = '#3b82f6',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-xs">
        No historical trend points available.
      </div>
    );
  }

  // Format date labels
  const formattedData = data.map((d) => ({
    ...d,
    displayDate: d.date ? d.date.slice(5) : '', // "MM-DD"
  }));

  return (
    <div className="w-full">
      {title && (
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {title}
        </div>
      )}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="displayDate"
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
              domain={['auto', 'auto']}
              tickFormatter={(v) => `${unit}${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: '#111827',
              }}
              formatter={(value: any) => [`${unit}${Number(value).toLocaleString()}`, dataKey === 'index_score' ? 'Index Level' : 'Avg Fare']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#grad-${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
