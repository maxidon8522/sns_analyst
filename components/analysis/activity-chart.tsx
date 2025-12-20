"use client";

import { useMemo } from "react";
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

type ActivityChartProps = {
  peakHour: number | null;
  hourlyData?: Record<string, number> | null;
};

const buildGaussian = (hour: number, peak: number, amplitude = 120, sigma = 3.8) => {
  const distance = Math.abs(hour - peak);
  const exponent = -Math.pow(distance, 2) / (2 * Math.pow(sigma, 2));
  return Math.round(18 + amplitude * Math.exp(exponent));
};

const formatHourLabel = (hour: number) => `${hour}`;

export function ActivityChart({ peakHour, hourlyData }: ActivityChartProps) {
  const { data, resolvedPeak } = useMemo(() => {
    const hasHourlyData = hourlyData && Object.keys(hourlyData).length > 0;
    let peak = typeof peakHour === "number" ? peakHour : null;

    if (hasHourlyData && peak === null) {
      let maxValue = -1;
      Object.entries(hourlyData ?? {}).forEach(([hour, value]) => {
        const parsedHour = Number(hour);
        if (Number.isFinite(parsedHour) && value > maxValue) {
          maxValue = value;
          peak = parsedHour;
        }
      });
    }

    const fallbackPeak = peak ?? 21;

    const points = Array.from({ length: 24 }, (_, hour) => {
      const value = hasHourlyData
        ? Number(hourlyData?.[String(hour)] ?? 0)
        : buildGaussian(hour, fallbackPeak);

      return {
        hour,
        value,
        isPeak: hour === fallbackPeak,
      };
    });

    return { data: points, resolvedPeak: peak ?? fallbackPeak };
  }, [hourlyData, peakHour]);

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
          🔥 狙い目: {resolvedPeak}:00
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
        {typeof peakHour !== "number" && (!hourlyData || !Object.keys(hourlyData).length) ? (
          <p className="text-xs text-muted-foreground">
            ピーク時間が未取得のため、擬似分布で可視化しています。
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
