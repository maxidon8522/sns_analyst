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
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TIME_POINTS = [0, 3, 6, 12, 24, 48, 72];

type HeroAnalysisSectionProps = {
  videos: any[];
  metricKey: string;
  metricLabel: string;
  manualInputAnchorId?: string;
};

type TimepointMetrics = Record<number, number | null>;

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

const formatPercent = (value: number) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
};

const formatValue = (value: number | null | undefined) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("ja-JP").format(value);
};

export function HeroAnalysisSection({
  videos,
  metricKey,
  metricLabel,
  manualInputAnchorId = "manual-input"
}: HeroAnalysisSectionProps) {
  const { targetVideo, chartData, comparison, benchmarkCount, latestComparison } = useMemo(() => {
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

    let comparisonText = "📊 データ不足";
    let comparisonTone = "bg-slate-100 text-slate-600 border-slate-200";

    if (latest && typeof latest.average === "number" && latest.average > 0) {
      const diff = Math.round(((latest.target as number) - latest.average) / latest.average * 100);
      if (diff > 0) {
        comparisonText = `🚀 平均比 ${formatPercent(diff)}`;
        comparisonTone = "bg-emerald-100 text-emerald-700 border-emerald-200";
      } else if (diff < 0) {
        comparisonText = `🐢 平均比 ${formatPercent(diff)}`;
        comparisonTone = "bg-amber-100 text-amber-700 border-amber-200";
      } else {
        comparisonText = "🟰 平均比 0%";
        comparisonTone = "bg-slate-100 text-slate-600 border-slate-200";
      }
    }

    if (!latest && benchmarkVideos.length === 0) {
      comparisonText = "平均データなし";
      comparisonTone = "bg-slate-100 text-slate-600 border-slate-200";
    }

    return {
      targetVideo: target,
      chartData: data,
      comparison: { text: comparisonText, tone: comparisonTone },
      benchmarkCount: benchmarkVideos.length,
      latestComparison: latest ?? null
    };
  }, [metricKey, videos]);

  if (!targetVideo) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-500" />
            <CardTitle className="text-lg font-semibold text-slate-800">
              最新動画の初速
            </CardTitle>
          </div>
          <p className="text-sm text-slate-500">
            今回の動画の勝敗をいち早くチェックします。
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <p className="text-sm text-slate-500">
            まだ動画データがありません。投稿が追加されると最新動画のグラフが表示されます。
          </p>
        </CardContent>
      </Card>
    );
  }

  const thumbnailUrl = targetVideo.thumbnail_url || targetVideo.media_url;
  const needsManualInput = targetVideo.manual_input_done === false;
  const latestTargetValue = latestComparison?.target ?? null;
  const latestAverageValue = latestComparison?.average ?? null;
  const latestHour = latestComparison?.hour ?? null;

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="p-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-500" />
            <CardTitle className="text-lg font-semibold text-slate-800">
              最新動画の初速
            </CardTitle>
          </div>
          <Badge className={comparison.tone}>{comparison.text}</Badge>
        </div>
        <p className="text-sm text-slate-500">
          今回の動画が平均より伸びているかをチェックします。
        </p>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-center">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl bg-slate-100 shadow-sm">
            <div className="pt-[177%]" />
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={targetVideo.caption || "最新動画"}
                className="absolute inset-0 h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                No Image
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 space-y-1 p-4 text-white">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">
                Latest Post
              </p>
              <p className="text-base font-semibold leading-snug line-clamp-2">
                {targetVideo.caption || "キャプションなし"}
              </p>
              <p className="text-xs text-white/70">
                {targetVideo.posted_at
                  ? new Date(targetVideo.posted_at).toLocaleDateString("ja-JP")
                  : "投稿日未設定"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 px-3 py-1">
              指標: {metricLabel}
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1">
              {benchmarkCount > 0 ? `過去${benchmarkCount}件との比較` : "平均データなし"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs text-slate-500">最新 {metricLabel}</p>
              <p className="text-3xl font-bold text-slate-800">
                {formatValue(latestTargetValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">平均 {metricLabel}</p>
              <p className="text-3xl font-bold text-slate-800">
                {formatValue(latestAverageValue)}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              {latestHour !== null ? `${latestHour}h 時点の比較` : "最新値を取得中"}
            </p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 24, left: 12, bottom: 0 }}>
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
                  stroke="#0f172a"
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

          {needsManualInput && (
            <Button
              asChild
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
            >
              <a href={`#${manualInputAnchorId}`}>📝 リーチ数を入力して分析を完了する</a>
            </Button>
          )}
        </div>
      </div>
      </CardContent>
    </Card>
  );
}
