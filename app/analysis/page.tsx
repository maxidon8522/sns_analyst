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
import { HeroComparisonChart } from "@/components/analysis/hero-comparison-chart";
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

const LONG_TERM_RANGE_OPTIONS = [3, 7, 14, 30, 90];
const DEFAULT_LONG_TERM_RANGE = 30;
const createLongTermBaseline = (range: number) =>
  Array.from({ length: range + 1 }, (_, day) => ({ day }));

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [videoLegends, setVideoLegends] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [longTermRange, setLongTermRange] = useState<number>(DEFAULT_LONG_TERM_RANGE);
  const [longTermData, setLongTermData] = useState<any[]>(
    createLongTermBaseline(DEFAULT_LONG_TERM_RANGE)
  );
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
          setLongTermData(createLongTermBaseline(DEFAULT_LONG_TERM_RANGE));
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
    processGrowthData(videos, selectedMetric, displayCount);
  }, [videos, selectedMetric, displayCount]);

  useEffect(() => {
    processLongTermData(videos, selectedMetric, displayCount, longTermRange);
  }, [videos, selectedMetric, displayCount, longTermRange]);

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
    console.log("Processing graph with:", { metric: selectedMetric, count: displayCount });
    try {
      const limit = count === "all" ? videos.length : Number(count);
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
            const metricValue = Number(log?.[metric] ?? 0) || 0;
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
    count: number | "all",
    range: number
  ) => {
    try {
      const limit = count === "all" ? videos.length : Number(count);
      const recentVideos = videos.slice(0, limit);
      const days = Array.from({ length: range + 1 }, (_, day) => day);
      const dataMap: Record<number, any> = {};
      days.forEach((day) => {
        dataMap[day] = { day };
      });

      if (!recentVideos.length) {
        setLongTermData(days.map((day) => dataMap[day]));
        return;
      }

      recentVideos.forEach((video) => {
        const logs = video.metrics_logs;
        if (!Array.isArray(logs) || logs.length === 0 || !video.posted_at) return;
        const postedAt = new Date(video.posted_at);

        const enrichedLogs = logs
          .filter((log: any) => log.fetched_at)
          .map((log: any) => {
            const fetchedDate = new Date(log.fetched_at);
            return {
              log,
              dayDiff: Math.max(0, differenceInDays(fetchedDate, postedAt)),
              fetchedMs: fetchedDate.getTime()
            };
          })
          .sort((a: any, b: any) => {
            if (a.dayDiff === b.dayDiff) return a.fetchedMs - b.fetchedMs;
            return a.dayDiff - b.dayDiff;
          });

        if (!enrichedLogs.length) return;

        days.forEach((day) => {
          let selected: any = null;
          for (let i = enrichedLogs.length - 1; i >= 0; i--) {
            if (enrichedLogs[i].dayDiff <= day) {
              selected = enrichedLogs[i];
              break;
            }
          }
          if (!selected) {
            selected = enrichedLogs[0];
          }

          const metricValue = Number(selected.log?.[metric] ?? 0) || 0;
          dataMap[day][video.id] = metricValue;
        });
      });

      setLongTermData(days.map((day) => dataMap[day]));
    } catch (error) {
      console.error(error);
      setLongTermData(createLongTermBaseline(range));
    }
  };

  if (loading) return <div className="container mx-auto p-6 space-y-6"><Skeleton className="h-40 w-full" /></div>;

  const metricLabel = METRIC_LABELS[selectedMetric];

  return (
    <div className="container mx-auto p-6 space-y-10 max-w-6xl">
      <HeroComparisonChart
        videos={videos}
        metricKey={selectedMetric}
        metricLabel={metricLabel}
        manualInputAnchorId="manual-input"
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>データ取得エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200/80 bg-white/80 shadow-sm">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
            <Label htmlFor="long-term-range" className="text-sm font-medium text-muted-foreground">
              分析期間
            </Label>
            <Select
              value={String(longTermRange)}
              onValueChange={(value) => setLongTermRange(Number(value))}
            >
              <SelectTrigger id="long-term-range" className="w-40">
                <SelectValue placeholder="期間を選択" />
              </SelectTrigger>
              <SelectContent>
                {LONG_TERM_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}日
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="range-select" className="text-sm font-medium text-muted-foreground">
              比較件数
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-100 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              分析した投稿数
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl font-semibold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">件の動画</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">平均保存数</CardTitle>
            <Bookmark className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl font-semibold">{stats.avgSaves}</div>
            <p className="text-xs text-muted-foreground">回 / 投稿</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">平均リーチ</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl font-semibold">{stats.avgReach > 0 ? stats.avgReach : "-"}</div>
            <p className="text-xs text-muted-foreground">アカウント (手動入力分)</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-indigo-900">最高パフォーマンス</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xl font-semibold text-indigo-700">
              {stats.topPost?.metrics_logs?.[0]?.saves || 0}
            </div>
            <p className="text-xs text-indigo-600/80 truncate">
              {stats.topPost?.caption?.slice(0, 15) || "-"}...
            </p>
          </CardContent>
        </Card>
      </div>

      {growthData.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            初速分析 ({metricLabel}推移)
          </h2>
          <GrowthChart
            data={growthData}
            videos={videoLegends}
            metricLabel={metricLabel}
          />
        </div>
      )}

      <div className="space-y-4 mt-6">
        <h2 className="text-lg font-semibold tracking-tight">長期推移分析</h2>
        <LongTermChart
          data={longTermData}
          videos={videoLegends}
          metricLabel={metricLabel}
        />
      </div>

      <div id="manual-input" className="scroll-mt-24">
        <PendingReviewList />
      </div>
    </div>
  );
}
