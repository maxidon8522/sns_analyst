import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

import { SavesTrendChart } from '@/components/charts/saves-trend-chart';
import type { ComparisonSeries, TrendPoint } from '@/components/charts/saves-trend-chart';

import { createServerSupabaseUserClient } from '@/utils/supabase/user';
import type { Database } from '@/types/database';

type VideoRow = Database['public']['Tables']['videos']['Row'];
type MetricsLogRow = Database['public']['Tables']['metrics_logs']['Row'];

type VideoWithMetrics = VideoRow & {
  metrics_logs: MetricsLogRow[];
};

type VideoDetailPageProps = {
  params: {
    id: string;
  };
};

const MAX_COMPARISON_SERIES = 3;

export default async function VideoDetailPage({
  params,
}: VideoDetailPageProps) {
  const supabase = createServerSupabaseUserClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    notFound();
  }

  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('*, metrics_logs(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (videoError) {
    throw new Error(videoError.message);
  }

  if (!video) {
    notFound();
  }

  const { data: comparisonVideos, error: comparisonError } = await supabase
    .from('videos')
    .select('*, metrics_logs(*)')
    .neq('id', params.id)
    .eq('user_id', user.id);

  if (comparisonError) {
    throw new Error(comparisonError.message);
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
          {video.caption ?? 'キャプション未設定'}
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
    .filter((log) => typeof log.saves === 'number' && log.fetched_at)
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

  const top = scored
    .sort((a, b) => b.maxSaves - a.maxSaves)
    .slice(0, limit);

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
