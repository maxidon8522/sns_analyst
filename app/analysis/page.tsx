"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { differenceInDays, differenceInHours } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { GrowthChart } from "@/components/analysis/growth-chart";
import { LongTermChart } from "@/components/analysis/long-term-chart";
import { PendingReviewList } from "@/components/dashboard/pending-review-list";
import { TrendingUp, Users, Bookmark, Video } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MetricKey = "views" | "saves" | "likes" | "comments";

const METRIC_LABELS: Record<MetricKey, string> = {
  views: "再生数",
  saves: "保存数",
  likes: "いいね数",
  comments: "コメント数"
};

const LONG_TERM_TARGET_DAYS = [3, 7, 14, 30, 90];
const createEmptyLongTermData = () =>
  LONG_TERM_TARGET_DAYS.map((day) => ({ day }));

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [videoLegends, setVideoLegends] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [longTermData, setLongTermData] = useState<any[]>(createEmptyLongTermData());
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("views");
  const [displayCount, setDisplayCount] = useState<number | "all">(5);
  const [stats, setStats] = useState({
    totalPosts: 0,
    avgSaves: 0,
    avgReach: 0,
    topPost: null as any
  });
  useEffect(() => {
    async function loadData() {
      try {
        const { data: fetchedVideos, error: dbError } = await supabase
          .from('videos')
          .select('*, metrics_logs(*)')
          .order('posted_at', { ascending: false });

        if (dbError) throw dbError;

        if (!fetchedVideos || fetchedVideos.length === 0) {
          setLoading(false);
          setGrowthData([]);
          setVideoLegends([]);
          setLongTermData(createEmptyLongTermData());
          return;
        }

        setVideos(fetchedVideos);
        calculateStats(fetchedVideos);

      } catch (err: any) {
        console.error("Analysis Load Error:", err);
        setError(err.message || "データの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!videos.length) return;
    processGrowthData(videos, selectedMetric, displayCount);
    processLongTermData(videos, selectedMetric, displayCount);
  }, [videos, selectedMetric, displayCount]);

  const calculateStats = (videos: any[]) => {
    const totalPosts = videos.length;
    
    // 平均保存数 (最新のログを使用)
    let totalSaves = 0;
    let totalReach = 0;
    let maxSaves = -1;
    let topPost = null;

    videos.forEach(v => {
      // 最新のログを探す
      const latestLog = v.metrics_logs?.sort((a: any, b: any) => 
        new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()
      )[0];
      
      const currentSaves = latestLog?.saves || 0;
      totalSaves += currentSaves;
      totalReach += v.reach || 0; // 手動入力されたリーチ

      if (currentSaves > maxSaves) {
        maxSaves = currentSaves;
        topPost = v;
      }
    });

    setStats({
      totalPosts,
      avgSaves: totalPosts ? Math.round(totalSaves / totalPosts) : 0,
      avgReach: totalPosts ? Math.round(totalReach / totalPosts) : 0,
      topPost
    });
  };

  const processGrowthData = (
    videos: any[],
    metric: MetricKey,
    count: number | "all"
  ) => {
    try {
      const limit = count === "all" ? videos.length : count;
      const recentVideos = videos.slice(0, limit);
      if (!recentVideos.length) {
        setGrowthData([]);
        setVideoLegends([]);
        return;
      }
      const growthDataMap: Record<number, any> = {};
      const timePoints = [0, 3, 6, 12, 24, 48, 72];
      
      timePoints.forEach(h => growthDataMap[h] = { hour: h });

      const colors = [
        "#2563eb",
        "#db2777",
        "#16a34a",
        "#d97706",
        "#9333ea",
        "#0f172a",
        "#14b8a6",
        "#f97316",
        "#4f46e5",
        "#a855f7",
        "#22d3ee",
        "#84cc16",
        "#ef4444",
        "#6366f1",
        "#f59e0b",
        "#06b6d4",
        "#10b981",
        "#7c3aed",
        "#e11d48",
        "#0ea5e9"
      ];
      const legends = recentVideos.map((video, index) => ({
        id: video.id,
        title: video.caption ? (video.caption.slice(0, 10) + "...") : "No Title",
        color: colors[index % colors.length]
      }));
      setVideoLegends(legends);

      recentVideos.forEach((video) => {
        const logs = video.metrics_logs;
        if (!Array.isArray(logs) || logs.length === 0) return;
        const postedAt = new Date(video.posted_at);

        logs.forEach((log: any) => {
          if (!log.fetched_at) return;
          const diffHours = differenceInHours(new Date(log.fetched_at), postedAt);
          const targetPoint = timePoints.reduce((prev, curr) => 
            Math.abs(curr - diffHours) < Math.abs(prev - diffHours) ? curr : prev
          );

          if (Math.abs(targetPoint - diffHours) <= 3) {
            const metricValue = Number(log[metric]) || 0;
            growthDataMap[targetPoint][video.id] = metricValue;
          }
        });
      });
      setGrowthData(Object.values(growthDataMap).sort((a: any, b: any) => a.hour - b.hour));
    } catch (e) {
      console.error(e);
    }
  };

  const processLongTermData = (
    videos: any[],
    metric: MetricKey,
    count: number | "all"
  ) => {
    try {
      const limit = count === "all" ? videos.length : count;
      const recentVideos = videos.slice(0, limit);
      const dataMap: Record<number, any> = {};
      LONG_TERM_TARGET_DAYS.forEach((day) => {
        dataMap[day] = { day };
      });

      if (!recentVideos.length) {
        setLongTermData(createEmptyLongTermData());
        return;
      }

      recentVideos.forEach((video) => {
        const logs = video.metrics_logs;
        if (!Array.isArray(logs) || logs.length === 0 || !video.posted_at) return;
        const postedAt = new Date(video.posted_at);

        LONG_TERM_TARGET_DAYS.forEach((targetDay) => {
          let closestLog: { log: any; diff: number } | null = null;

          logs.forEach((log: any) => {
            if (!log.fetched_at) return;
            const diff = Math.abs(
              differenceInDays(new Date(log.fetched_at), postedAt) - targetDay
            );

            if (!closestLog || diff < closestLog.diff) {
              closestLog = { log, diff };
            }
          });

          if (closestLog && closestLog.diff <= 1) {
            const metricValue = Number(closestLog.log?.[metric]) || 0;
            dataMap[targetDay][video.id] = metricValue;
          }
        });
      });

      setLongTermData(LONG_TERM_TARGET_DAYS.map((day) => dataMap[day]));
    } catch (error) {
      console.error(error);
      setLongTermData(createEmptyLongTermData());
    }
  };

  if (loading) return <div className="container mx-auto p-6 space-y-6"><Skeleton className="h-40 w-full" /></div>;

  const metricLabel = METRIC_LABELS[selectedMetric];

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      {/* 1. 振り返り入力リスト */}
      <PendingReviewList />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>データ取得エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 2. KPIカード (ここが新しい！) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">分析した投稿数</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">件の動画</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均保存数</CardTitle>
            <Bookmark className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgSaves}</div>
            <p className="text-xs text-muted-foreground">回 / 投稿</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均リーチ</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgReach > 0 ? stats.avgReach : "-"}</div>
            <p className="text-xs text-muted-foreground">アカウント (手動入力分)</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900">最高パフォーマンス</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700">
              {stats.topPost?.metrics_logs?.[0]?.saves || 0}
            </div>
            <p className="text-xs text-indigo-600/80 truncate">
              {stats.topPost?.caption?.slice(0, 15) || "-"}...
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. 推移グラフ */}
      {growthData.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              初速分析 ({metricLabel}推移)
            </h2>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="space-y-1">
                <Label htmlFor="metric-select" className="text-sm font-medium text-muted-foreground">
                  分析指標
                </Label>
                <Select
                  value={selectedMetric}
                  onValueChange={(value) => setSelectedMetric(value as MetricKey)}
                >
                  <SelectTrigger id="metric-select" className="w-48">
                    <SelectValue placeholder="指標を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METRIC_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="range-select" className="text-sm font-medium text-muted-foreground">
                  表示件数
                </Label>
                <Select
                  value={displayCount === "all" ? "all" : String(displayCount)}
                  onValueChange={(value) =>
                    setDisplayCount(value === "all" ? "all" : Number(value))
                  }
                >
                  <SelectTrigger id="range-select" className="w-40">
                    <SelectValue placeholder="件数を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">最新5件</SelectItem>
                    <SelectItem value="10">最新10件</SelectItem>
                    <SelectItem value="20">最新20件</SelectItem>
                    <SelectItem value="all">全て</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <GrowthChart
            data={growthData}
            videos={videoLegends}
            metricLabel={metricLabel}
          />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          長期分析 ({metricLabel}推移)
        </h2>
        <LongTermChart
          data={longTermData}
          videos={videoLegends}
          metricLabel={metricLabel}
        />
      </div>
    </div>
  );
}
