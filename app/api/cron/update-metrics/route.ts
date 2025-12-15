import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { getMediaInsights } from '@/lib/instagram';
import type { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase environment variables are missing for cron task.');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

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

    const results: Array<{ id: string; status: string; data?: unknown }> = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const video of videos) {
      try {
        const insights = await getMediaInsights(video.ig_media_id);
        const metrics = insights ?? {
          likes: 0,
          comments: 0,
          views: 0,
          reach: 0,
          saved: 0,
        };

        await supabase.from('metrics_logs').insert({
          video_id: video.id,
          views: metrics.views,
          likes: metrics.likes,
          comments: metrics.comments,
          saves: metrics.saved,
          fetched_at: new Date().toISOString(),
        });
        results.push({ id: video.ig_media_id, status: 'updated', data: metrics });

        if (!insights) {
          console.warn(
            `No insight data returned for media ${video.ig_media_id}. Default metrics stored.`,
          );
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
