import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { id, reach = 0, shares = 0, profile_visits = 0, follows = 0 } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        { error: '動画IDが指定されていません。' },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('videos')
      .update({
        reach,
        shares,
        profile_visits,
        follows,
        manual_input_done: true,
      })
      .eq('id', id);

    if (error) {
      console.error('Manual metrics update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Manual metrics request error:', err);
    return NextResponse.json(
      { error: '保存処理に失敗しました。' },
      { status: 500 },
    );
  }
}
