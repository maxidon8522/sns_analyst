"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";

type ActivityChartProps = {
  peakHour: number | null;
  hourlyData?: Record<string, number> | null;
};

const formatHourLabel = (hour: number) => `${hour}`;

export function ActivityChart({ peakHour, hourlyData }: ActivityChartProps) {
  const hasPeakHour = typeof peakHour === "number" && peakHour > 0;
  const hasHourlyData = hourlyData && Object.keys(hourlyData).length > 0;

  if (!hasPeakHour || !hasHourlyData) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">ゴールデンタイム分析</CardTitle>
            <p className="text-sm text-muted-foreground">
              フォロワーのアクティブ時間帯を把握します。
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="ピーク時間 算出中"
            description="フォロワーのアクティブ時間を分析中です。"
          />
        </CardContent>
      </Card>
    );
  }

  const data = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    value: Number(hourlyData?.[String(hour)] ?? 0),
    isPeak: hour === peakHour,
  }));

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">ゴールデンタイム分析</CardTitle>
          <p className="text-sm text-muted-foreground">
            フォロワーのアクティブ時間帯を把握します。
          </p>
        </div>
        <Badge className="bg-amber-500 text-white">
          🔥 狙い目: {peakHour}:00
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11 }}
                tickFormatter={(hour) => formatHourLabel(Number(hour))}
              />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip
                formatter={(value) => `${value}`}
                labelFormatter={(label) => `${label}:00`}
                contentStyle={{
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 12px 30px rgba(15,23,42,0.12)"
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.hour}
                    fill={entry.isPeak ? "#f97316" : "#cbd5f5"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
