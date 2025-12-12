import { NextResponse, type NextRequest } from 'next/server';

import {
  fetchInstagramMediaInsights,
  type InstagramInsights,
} from '@/lib/instagram';
import { createServerSupabaseClient } from '@/utils/supabase/server';

type VideoRecord = {
  id: string;
  ig_media_id: string;
  posted_at: string | null;
};

const getCronSecret = (): string => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error('CRON_SECRET is not configured.');
  }

  return secret;
};

const isAuthorized = (request: NextRequest): boolean => {
  const header = request.headers.get('authorization');
  if (!header) {
    return false;
  }

  const expected = `Bearer ${getCronSecret()}`;
  return header === expected;
};

const ONE_MONTH_MS = 1000 * 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sinceISO = new Date(Date.now() - ONE_MONTH_MS).toISOString();
    const supabase = createServerSupabaseClient();

    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('id, ig_media_id, posted_at')
      .gte('posted_at', sinceISO)
      .order('posted_at', { ascending: false });

    if (videosError) {
      return NextResponse.json(
        { error: videosError.message },
        { status: 500 },
      );
    }

    if (!videos?.length) {
      return NextResponse.json({
        message: 'No recent videos found.',
        inserted: 0,
        processed: 0,
        failures: [],
      });
    }

    const metricsResults = await collectMetrics(videos);
    if (!metricsResults.entries.length) {
      return NextResponse.json({
        message: 'No metrics could be fetched.',
        inserted: 0,
        processed: videos.length,
        failures: metricsResults.failures,
      });
    }

    const { error: insertError } = await supabase
      .from('metrics_logs')
      .insert(metricsResults.entries);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Metrics updated successfully.',
      processed: videos.length,
      inserted: metricsResults.entries.length,
      failures: metricsResults.failures,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type MetricsInsertPayload = {
  video_id: string;
  views: number;
  likes: number;
  saves: number;
  comments: number;
};

const collectMetrics = async (videos: VideoRecord[]) => {
  const entries: MetricsInsertPayload[] = [];
  const failures: Array<{ video_id: string; reason: string }> = [];

  for (const video of videos) {
    try {
      const metrics = await fetchInstagramMediaInsights(video.ig_media_id);
      entries.push(mapInsightsToInsert(video.id, metrics));
    } catch (error) {
      failures.push({
        video_id: video.id,
        reason:
          error instanceof Error ? error.message : 'Failed to fetch metrics.',
      });
    }
  }

  return { entries, failures };
};

const mapInsightsToInsert = (
  videoId: string,
  insights: InstagramInsights,
): MetricsInsertPayload => ({
  video_id: videoId,
  views: insights.views,
  likes: insights.likes,
  saves: insights.saves,
  comments: insights.comments,
});
