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
    const insights = await getAccountInsights();

    if (!insights) {
      console.error('Account insights fetch failed.');
      return NextResponse.json(
        { error: 'Failed to fetch account insights' },
        { status: 500 },
      );
    }

    const recordDate = getRecordDate();
    const payload = {
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
      .upsert(payload, { onConflict: 'date' });

    if (error) {
      console.error('Account insights upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to store account insights' },
        { status: 500 },
      );
    }

    console.log('Account insights stored:', recordDate);
    return NextResponse.json({ success: true, date: recordDate });
  } catch (error) {
    console.error('Account insights cron error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
