'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type TrendPoint = {
  hour: number;
  saves: number;
};

export type ComparisonSeries = {
  label: string;
  data: TrendPoint[];
};

type SavesTrendChartProps = {
  data: TrendPoint[];
  label: string;
  comparisons?: ComparisonSeries[];
};

const comparisonColors = ['#94a3b8', '#cbd5f5', '#99f6e4'];

export const SavesTrendChart = ({
  data,
  label,
  comparisons = [],
}: SavesTrendChartProps) => {
  const hasComparisons = comparisons.length > 0;

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="hour"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => `${value}h`}
            label={{ value: '投稿からの経過時間 (h)', position: 'bottom', offset: -4 }}
          />
          <YAxis
            dataKey="saves"
            allowDecimals={false}
            label={{
              value: '保存数',
              angle: -90,
              position: 'insideLeft',
              offset: -4,
            }}
          />
          <Tooltip
            formatter={(value: number) => `${value} 保存`}
            labelFormatter={(labelValue: number) => `${labelValue} 時間`}
          />
          <Legend />
          {comparisons.map((series, index) => (
            <Line
              key={series.label}
              data={series.data}
              type="monotone"
              dataKey="saves"
              name={`比較: ${series.label}`}
              stroke={comparisonColors[index % comparisonColors.length]}
              strokeWidth={2}
              strokeOpacity={0.35}
              dot={false}
              isAnimationActive={false}
            />
          ))}
          <Line
            type="monotone"
            dataKey="saves"
            name={label}
            stroke="#0ea5e9"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {hasComparisons ? (
        <p className="mt-3 text-xs text-muted-foreground">
          薄い線は過去のハイパフォーマンス動画の推移を重ねています。
        </p>
      ) : null}
    </div>
  );
};
