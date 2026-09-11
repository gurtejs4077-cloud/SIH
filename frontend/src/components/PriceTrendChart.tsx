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
  color = '#5A7C83',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[#A88C6C] text-xs">
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
        <div className="text-xs font-bold text-[#2C444D] uppercase tracking-wider mb-3">
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(199, 184, 164, 0.4)" vertical={false} />
            <XAxis
              dataKey="displayDate"
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
              domain={['auto', 'auto']}
              tickFormatter={(v) => `${unit}${v}`}
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
