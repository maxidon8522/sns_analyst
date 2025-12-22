"use client";

import { useMemo } from "react";
import { differenceInHours } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TIME_POINTS = [0, 3, 6, 12, 24, 48, 72];

type HeroComparisonChartProps = {
  videos: any[];
  metricKey: string;
  metricLabel: string;
  manualInputAnchorId?: string;
};

type TimepointMetrics = Record<number, number | null>;

const formatValue = (value: number | null | undefined) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("ja-JP").format(value);
};

const buildTimepointMetrics = (video: any, metricKey: string): TimepointMetrics => {
  const baseline: TimepointMetrics = {};
  TIME_POINTS.forEach((point) => {
    baseline[point] = null;
  });

  if (!video?.posted_at || !Array.isArray(video.metrics_logs)) return baseline;

  const postedAt = new Date(video.posted_at);
  const logs = video.metrics_logs
    .filter((log: any) => log?.fetched_at)
    .map((log: any) => ({
      diffHours: differenceInHours(new Date(log.fetched_at), postedAt),
      value: Number(log?.[metricKey] ?? 0) || 0
    }))
    .filter((log: any) => log.diffHours >= 0);

  TIME_POINTS.forEach((point) => {
    let closest: { diff: number; value: number } | null = null;
    logs.forEach((log) => {
      const diff = Math.abs(point - log.diffHours);
      if (diff <= 3 && (!closest || diff < closest.diff)) {
        closest = { diff, value: log.value };
      }
    });
    baseline[point] = closest ? closest.value : null;
  });

  return baseline;
};

export function HeroComparisonChart({
  videos,
  metricKey,
  metricLabel,
  manualInputAnchorId = "manual-input"
}: HeroComparisonChartProps) {
  const { targetVideo, chartData, latestComparison, benchmarkCount } = useMemo(() => {
    const target = videos?.[0];
    const benchmarkVideos = Array.isArray(videos) ? videos.slice(1) : [];
    const targetMetrics = buildTimepointMetrics(target, metricKey);
    const benchmarkMetrics = benchmarkVideos.map((video) =>
      buildTimepointMetrics(video, metricKey)
    );

    const data = TIME_POINTS.map((hour) => {
      let sum = 0;
      let count = 0;
      benchmarkMetrics.forEach((metrics) => {
        const value = metrics[hour];
        if (typeof value === "number") {
          sum += value;
          count += 1;
        }
      });

      return {
        hour,
        target: targetMetrics[hour],
        average: count > 0 ? Math.round(sum / count) : null
      };
    });

    const latest = [...data]
      .reverse()
      .find((point) => typeof point.target === "number" && typeof point.average === "number");

    return {
      targetVideo: target,
      chartData: data,
      latestComparison: latest ?? null,
      benchmarkCount: benchmarkVideos.length
    };
  }, [videos, metricKey]);

  if (!targetVideo) {
    return (
      <Card className="border-slate-100 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">最新投稿の比較グラフ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            まだ投稿がありません。投稿が追加されると最新動画と過去平均の比較が表示されます。
          </p>
        </CardContent>
      </Card>
    );
  }

  const thumbnailUrl = targetVideo.thumbnail_url || targetVideo.media_url;
  const latestTargetValue = latestComparison?.target ?? null;
  const latestAverageValue = latestComparison?.average ?? null;
  const latestHour = latestComparison?.hour ?? null;
  const needsManualInput = targetVideo.manual_input_done === false;

  let statusText = "データ不足";
  let statusClass =
    "border-slate-100 bg-slate-100 text-slate-600";

  if (typeof latestTargetValue === "number" && typeof latestAverageValue === "number") {
    if (latestTargetValue > latestAverageValue) {
      statusText = "🚀 ペース良好";
      statusClass = "border-emerald-200 bg-emerald-500 text-white";
    } else if (latestTargetValue < latestAverageValue) {
      statusText = "🐢 伸び悩み";
      statusClass = "border-amber-200 bg-amber-500 text-white";
    } else {
      statusText = "🟰 ほぼ平均";
      statusClass = "border-slate-100 bg-slate-200 text-slate-700";
    }
  } else if (benchmarkCount === 0) {
    statusText = "比較データなし";
    statusClass = "border-slate-100 bg-slate-100 text-slate-600";
  }

  return (
    <Card className="relative overflow-hidden border-slate-100 bg-white shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/60 bg-white shadow-sm">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={targetVideo.caption || "最新の投稿"}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                  No Image
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                最新の投稿
              </p>
              <CardTitle className="text-lg font-semibold leading-tight md:text-xl">
                <span className="line-clamp-1">
                  {targetVideo.caption || "キャプションなし"}
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {targetVideo.posted_at
                  ? new Date(targetVideo.posted_at).toLocaleDateString("ja-JP")
                  : "投稿日未設定"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusClass}>{statusText}</Badge>
            {needsManualInput && (
              <Button
                size="sm"
                asChild
                className="bg-slate-900 text-white shadow hover:bg-slate-800"
              >
                <a href={`#${manualInputAnchorId}`}>📝 数値を入力する</a>
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
            指標: {metricLabel}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
            {benchmarkCount > 0 ? `過去${benchmarkCount}件平均との差` : "過去平均データなし"}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
            {latestHour !== null
              ? `${latestHour}h時点 最新 ${formatValue(latestTargetValue)} / 平均 ${formatValue(
                  latestAverageValue
                )}`
              : "比較データを収集中"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-[6px] w-8 rounded-full bg-amber-500" />
            最新動画
          </div>
          <div className="flex items-center gap-2">
            <span className="h-px w-8 border-t-2 border-dashed border-slate-400" />
            過去平均
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 24, left: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => `${val}h`}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: metricLabel,
                  angle: -90,
                  position: "insideLeft",
                  offset: 12,
                  style: { textAnchor: "middle" }
                }}
              />
              <Tooltip
                labelFormatter={(val) => `投稿から ${val} 時間後`}
                formatter={(value, name) => [
                  value,
                  name === "target" ? "最新動画" : "過去平均"
                ]}
                contentStyle={{
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 12px 30px rgba(15,23,42,0.12)"
                }}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="最新動画"
                stroke="#f97316"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="average"
                name="過去平均"
                stroke="#94a3b8"
                strokeDasharray="6 6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
