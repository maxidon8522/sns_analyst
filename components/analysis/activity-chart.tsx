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
import { Clock } from "lucide-react";

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
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg font-semibold text-slate-800">
              ゴールデンタイム分析
            </CardTitle>
          </div>
          <p className="text-sm text-slate-500">
            フォロワーのアクティブ時間帯を把握します。
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
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
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="p-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg font-semibold text-slate-800">
              ゴールデンタイム分析
            </CardTitle>
          </div>
          <Badge className="bg-amber-100 text-amber-700">
            🔥 狙い目: {peakHour}:00
          </Badge>
        </div>
        <p className="text-sm text-slate-500">
          フォロワーのアクティブ時間帯を把握します。
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-0">
        <div className="flex items-end justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-xs text-slate-500">ピーク時間</p>
            <p className="text-3xl font-bold text-slate-800">{peakHour}:00</p>
          </div>
          <p className="text-xs text-slate-500">投稿の狙い目を明確化</p>
        </div>
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
