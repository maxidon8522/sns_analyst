import { NextResponse, type NextRequest } from 'next/server';

import { getMediaInsights } from '@/lib/instagram';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: videos, error: dbError } = await supabase
      .from('videos')
      .select('id, ig_media_id')
      .gte('posted_at', thirtyDaysAgo.toISOString());

    if (dbError) throw dbError;
    if (!videos || videos.length === 0) {
      return NextResponse.json({ message: 'No videos to update' });
    }

    const results: Array<{ id: string; status: string }> = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const video of videos) {
      try {
        const insights = await getMediaInsights(video.ig_media_id);

        if (insights) {
          await supabase.from('metrics_logs').insert({
            video_id: video.id,
            views: insights.views,
            likes: 0,
            saves: insights.saved,
            comments: 0,
            fetched_at: new Date().toISOString(),
          });
          results.push({ id: video.ig_media_id, status: 'updated' });
        } else {
          errors.push({ id: video.ig_media_id, error: 'No data from API' });
        }
      } catch (err) {
        console.error(`Error updating video ${video.ig_media_id}:`, err);
        errors.push({ id: video.ig_media_id, error: String(err) });
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      failures: errors.length,
      details: { results, errors },
    });
  } catch (error) {
    console.error('Cron Job Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
