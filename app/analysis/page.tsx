"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { differenceInHours } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GrowthChart } from "@/components/analysis/growth-chart";
import { PendingReviewList } from "@/components/dashboard/pending-review-list";
import { TrendingUp, Users, Bookmark, Video } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [videoLegends, setVideoLegends] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    avgSaves: 0,
    avgReach: 0,
    topPost: null as any
  });
  useEffect(() => {
    async function loadData() {
      try {
        const { data: videos, error: dbError } = await supabase
          .from('videos')
          .select('*, metrics_logs(*)')
          .order('posted_at', { ascending: false });

        if (dbError) throw dbError;

        if (!videos || videos.length === 0) {
          setLoading(false);
          return;
        }

        processGrowthData(videos);
        calculateStats(videos);

      } catch (err: any) {
        console.error("Analysis Load Error:", err);
        setError(err.message || "データの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  const processGrowthData = (videos: any[]) => {
    try {
      const recentVideos = videos.slice(0, 5);
      const growthDataMap: Record<number, any> = {};
      const timePoints = [0, 3, 6, 12, 24, 48, 72];
      
      timePoints.forEach(h => growthDataMap[h] = { hour: h });

      const colors = ["#2563eb", "#db2777", "#16a34a", "#d97706", "#9333ea"];
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
            growthDataMap[targetPoint][video.id] = log.saves;
          }
        });
      });
      setGrowthData(Object.values(growthDataMap).sort((a: any, b: any) => a.hour - b.hour));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="container mx-auto p-6 space-y-6"><Skeleton className="h-40 w-full" /></div>;

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      {/* 1. 振り返り入力リスト */}
      <PendingReviewList />

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
          <h2 className="text-lg font-semibold tracking-tight">初速分析 (保存数推移)</h2>
          <GrowthChart data={growthData} videos={videoLegends} />
        </div>
      )}
    </div>
  );
}
