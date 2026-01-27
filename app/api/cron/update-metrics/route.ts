import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { getAccountInsights, getMediaInsights } from '@/lib/instagram';
import type { Database } from '@/types/database';

export const dynamic = 'force-dynamic';

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getRecordDate = () => {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  return formatLocalDate(start);
};

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
    const { data: connections, error: connectionsError } = await supabase
      .from('meta_connections')
      .select('user_id, access_token, instagram_user_id')
      .eq('provider', 'instagram');

    if (connectionsError) {
      throw connectionsError;
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({ message: 'No connections to update' });
    }

    const results: Array<{
      user_id: string;
      account?: { success: boolean; error?: string; date?: string };
      videoMetrics?: { updated: number; failures: number };
    }> = [];

    for (const connection of connections) {
      const recordDate = getRecordDate();
      let accountError: string | null = null;

      if (!connection.access_token || !connection.instagram_user_id) {
        results.push({
          user_id: connection.user_id,
          account: {
            success: false,
            error: 'Missing access token or Instagram user id',
            date: recordDate,
          },
          videoMetrics: { updated: 0, failures: 1 },
        });
        continue;
      }

      try {
        const insights = await getAccountInsights({
          accessToken: connection.access_token,
          userId: connection.instagram_user_id,
        });

        if (!insights) {
          throw new Error('Failed to fetch account insights');
        }

        const payload = {
          user_id: connection.user_id,
          date: recordDate,
          followers_count: insights.dailyStats.followersCount,
          profile_views: insights.dailyStats.profileViews,
          website_clicks: insights.dailyStats.websiteClicks,
          reach_daily: insights.dailyStats.reachDaily,
          impressions_daily: insights.dailyStats.impressionsDaily,
          online_peak_hour: insights.dailyStats.onlinePeakHour,
          audience_data: {
            ...insights.demographics,
            onlineFollowersByHour: insights.dailyStats.onlineFollowersByHour,
          },
        };

        const { error } = await supabase
          .from('account_insights')
          .upsert(payload, { onConflict: 'user_id,date' });

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Account insights update error:', error);
        accountError = error instanceof Error ? error.message : String(error);
      }

      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: videos, error: dbError } = await supabase
          .from('videos')
          .select('id, ig_media_id')
          .eq('user_id', connection.user_id)
          .gte('posted_at', thirtyDaysAgo.toISOString());

        if (dbError) throw dbError;
        if (!videos || videos.length === 0) {
          results.push({
            user_id: connection.user_id,
            account: {
              success: !accountError,
              error: accountError ?? undefined,
              date: recordDate,
            },
            videoMetrics: { updated: 0, failures: 0 },
          });
          continue;
        }

        const errors: Array<{ id: string; error: string }> = [];
        let updated = 0;

        for (const video of videos) {
          try {
            const insights = await getMediaInsights(video.ig_media_id, {
              accessToken: connection.access_token,
            });
            if (!insights || insights.insightsOk === false) {
              const errorMessage = insights
                ? 'Insights response unavailable'
                : 'Insights fetch failed';
              console.warn(
                `No insight data returned for media ${video.ig_media_id}. Skipping insert.`,
              );
              errors.push({ id: video.ig_media_id, error: errorMessage });
              continue;
            }

            await supabase.from('metrics_logs').insert({
              user_id: connection.user_id,
              video_id: video.id,
              views: insights.views,
              likes: insights.likes,
              comments: insights.comments,
              saves: insights.saved,
              fetched_at: new Date().toISOString(),
            });
            updated += 1;
          } catch (err) {
            console.error(`Error updating video ${video.ig_media_id}:`, err);
            errors.push({ id: video.ig_media_id, error: String(err) });
          }
        }

        results.push({
          user_id: connection.user_id,
          account: {
            success: !accountError,
            error: accountError ?? undefined,
            date: recordDate,
          },
          videoMetrics: { updated, failures: errors.length },
        });
      } catch (error) {
        console.error('Cron Job Error:', error);
        results.push({
          user_id: connection.user_id,
          account: {
            success: !accountError,
            error: accountError ?? undefined,
            date: recordDate,
          },
          videoMetrics: { updated: 0, failures: 1 },
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Cron Job Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
