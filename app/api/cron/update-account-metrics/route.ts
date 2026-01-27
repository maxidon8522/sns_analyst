import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { getAccountInsights } from '@/lib/instagram';
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

export async function GET() {
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

    const recordDate = getRecordDate();
    const results: Array<{ user_id: string; success: boolean; error?: string }> =
      [];

    for (const connection of connections) {
      try {
        if (!connection.access_token || !connection.instagram_user_id) {
          throw new Error('Missing access token or Instagram user id');
        }

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

        results.push({ user_id: connection.user_id, success: true });
      } catch (error) {
        console.error('Account insights cron error:', error);
        results.push({
          user_id: connection.user_id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({ success: true, date: recordDate, results });
  } catch (error) {
    console.error('Account insights cron error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
