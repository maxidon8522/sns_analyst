"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { differenceInHours } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GrowthChart } from "@/components/analysis/growth-chart";
import { PendingReviewList } from "@/components/dashboard/pending-review-list";

type MetricsLog = {
  fetched_at: string;
  saves: number;
};

type Video = {
  id: string;
  caption: string;
  posted_at: string;
  metrics_logs?: MetricsLog[];
};

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [videoLegends, setVideoLegends] = useState<any[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadData() {
      try {
        console.log("Loading analysis data...");
        const { data: videos, error: dbError } = await supabase
          .from("videos")
          .select("*, metrics_logs(*)")
          .order("posted_at", { ascending: false });

        if (dbError) throw dbError;

        if (!videos || videos.length === 0) {
          console.log("No videos found.");
          setLoading(false);
          return;
        }

        processGrowthData(videos);
      } catch (err: any) {
        console.error("Analysis Load Error:", err);
        setError(err.message || "データの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const processGrowthData = (videos: Video[]) => {
    try {
      const recentVideos = videos.slice(0, 5);
      const growthDataMap: Record<number, any> = {};
      const timePoints = [0, 3, 6, 12, 24, 48, 72];
      timePoints.forEach((h) => (growthDataMap[h] = { hour: h }));

      const colors = ["#2563eb", "#db2777", "#16a34a", "#d97706", "#9333ea"];
      const legends = recentVideos.map((video, index) => ({
        id: video.id,
        title: video.caption
          ? video.caption.slice(0, 10) + "..."
          : "No Title",
        color: colors[index % colors.length],
      }));
      setVideoLegends(legends);

      recentVideos.forEach((video) => {
        const logs = video.metrics_logs;
        if (!Array.isArray(logs) || logs.length === 0) return;

        const postedAt = new Date(video.posted_at);

        logs.forEach((log: MetricsLog) => {
          if (!log.fetched_at) return;

          const fetchedAt = new Date(log.fetched_at);
          const diffHours = differenceInHours(fetchedAt, postedAt);

          const targetPoint = timePoints.reduce((prev, curr) =>
            Math.abs(curr - diffHours) < Math.abs(prev - diffHours)
              ? curr
              : prev
          );

          if (Math.abs(targetPoint - diffHours) <= 3) {
            growthDataMap[targetPoint][video.id] = log.saves;
          }
        });
      });

      const finalData = Object.values(growthDataMap).sort(
        (a: any, b: any) => a.hour - b.hour
      );
      setGrowthData(finalData);
    } catch (e) {
      console.error("Graph Processing Error:", e);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 1. 振り返り入力リスト (ここに出ます！) */}
      <PendingReviewList />

      {/* 2. 推移グラフ */}
      {growthData.length > 0 && (
        <div className="mb-8">
          <GrowthChart data={growthData} videos={videoLegends} />
        </div>
      )}

      {/* ここに将来的に統計ランキングなどを戻せます */}
      <div className="text-center text-muted-foreground text-sm">
        データ収集中...
      </div>
    </div>
  );
}
