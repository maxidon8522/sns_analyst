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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type GrowthData = {
  hour: number;
  [key: string]: number;
};

export type VideoLegend = {
  id: string;
  title: string;
  color: string;
};

type GrowthChartProps = {
  data: GrowthData[];
  videos: VideoLegend[];
  metricLabel: string;
};

export function GrowthChart({ data, videos, metricLabel }: GrowthChartProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>投稿後72時間の「{metricLabel}」推移比較</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="hour"
                unit="h"
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => `${val}h`}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: metricLabel,
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  style: { textAnchor: 'middle' },
                }}
              />
              <Tooltip
                labelFormatter={(val) => `投稿から ${val} 時間後`}
                formatter={(value) => [value, metricLabel]}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              {videos.map((video) => (
                <Line
                  key={video.id}
                  type="monotone"
                  dataKey={video.id}
                  name={video.title}
                  stroke={video.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
