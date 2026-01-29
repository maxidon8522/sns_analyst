"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SavesTrendChart } from "@/components/charts/saves-trend-chart";
import type {
  ComparisonSeries,
  TrendPoint,
} from "@/components/charts/saves-trend-chart";
import type { Database } from "@/types/database";
import { useAuth } from "@/components/auth/auth-provider";

type VideoRow = Database["public"]["Tables"]["videos"]["Row"];
type MetricsLogRow = Database["public"]["Tables"]["metrics_logs"]["Row"];

type VideoWithMetrics = VideoRow & {
  metrics_logs: MetricsLogRow[];
};

const MAX_COMPARISON_SERIES = 3;

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const [video, setVideo] = useState<VideoWithMetrics | null>(null);
  const [comparisonVideos, setComparisonVideos] = useState<VideoWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videoId = useMemo(() => params?.id, [params]);

  useEffect(() => {
    if (!videoId || !session?.access_token) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/videos/${videoId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error ?? "データ取得に失敗しました。");
        }
        setVideo(body?.video ?? null);
        setComparisonVideos(body?.comparisonVideos ?? []);
      } catch (err: any) {
        setError(err?.message ?? "データ取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [videoId, session?.access_token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTitle>読み込み中</AlertTitle>
          <AlertDescription>データを取得しています。</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error ?? "動画が見つかりませんでした。"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const mainSeries = buildTrendSeries(video);
  const comparisonSeries = buildComparisonSeries(
    comparisonVideos ?? [],
    MAX_COMPARISON_SERIES,
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Video Detail</p>
        <h1 className="text-2xl font-semibold">
          {video.caption ?? "キャプション未設定"}
        </h1>
        {video.permalink ? (
          <a
            href={video.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline"
          >
            Instagramで開く
          </a>
        ) : null}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>保存数推移</CardTitle>
        </CardHeader>
        <CardContent>
          {mainSeries.length ? (
            <SavesTrendChart
              data={mainSeries}
              label="この動画"
              comparisons={comparisonSeries}
            />
          ) : (
            <Alert>
              <AlertTitle>データが不足しています</AlertTitle>
              <AlertDescription>
                この動画のmetricsがまだ取得されていません。フェッチAPIを実行してから再度確認してください。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const buildTrendSeries = (video: VideoWithMetrics): TrendPoint[] => {
  if (!video.metrics_logs?.length) {
    return [];
  }

  const postedAt = parseDate(video.posted_at) ?? parseDate(video.created_at);
  if (!postedAt) {
    return [];
  }

  return video.metrics_logs
    .filter((log) => typeof log.saves === "number" && log.fetched_at)
    .map((log) => ({
      hour: calculateElapsedHours(postedAt, new Date(log.fetched_at)),
      saves: log.saves ?? 0,
    }))
    .sort((a, b) => a.hour - b.hour);
};

const buildComparisonSeries = (
  videos: VideoWithMetrics[],
  limit: number,
): ComparisonSeries[] => {
  const scored = videos
    .map((video) => {
      const series = buildTrendSeries(video);
      const maxSaves =
        series.reduce((max, point) => Math.max(max, point.saves), 0) ?? 0;
      return {
        video,
        series,
        maxSaves,
      };
    })
    .filter((entry) => entry.series.length > 0);

  const top = scored.sort((a, b) => b.maxSaves - a.maxSaves).slice(0, limit);

  return top.map((entry) => ({
    label: entry.video.caption ?? entry.video.id,
    data: entry.series,
  }));
};

const calculateElapsedHours = (start: Date, end: Date): number =>
  Number(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2));

const parseDate = (value: string | null): Date | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
