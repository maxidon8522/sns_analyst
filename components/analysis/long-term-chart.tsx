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
import type { VideoLegend } from '@/components/analysis/growth-chart';

type LongTermData = {
  day: number;
  [key: string]: number;
};

type LongTermChartProps = {
  data: LongTermData[];
  videos: VideoLegend[];
  metricLabel: string;
};

export function LongTermChart({ data, videos, metricLabel }: LongTermChartProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>長期推移分析 (3日〜3ヶ月)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                unit="日"
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => `${val}日`}
                label={{
                  value: '日数 (day)',
                  position: 'insideBottomRight',
                  offset: -5,
                  style: { fontSize: 12 },
                }}
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
                labelFormatter={(val) => `投稿から ${val} 日目`}
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
