import { NextResponse, type NextRequest } from 'next/server';

import {
  getInstagramPosts,
  getPostWithInsights,
} from '@/lib/instagram';
import { getUserFromRequest } from '@/utils/supabase/auth';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get('media_id');

  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { data: connection, error: connectionError } = await supabase
      .from('meta_connections')
      .select('access_token, instagram_user_id')
      .eq('user_id', user.id)
      .eq('provider', 'instagram')
      .maybeSingle();

    if (connectionError) {
      return NextResponse.json(
        { error: connectionError.message },
        { status: 500 },
      );
    }

    if (!connection?.access_token || !connection.instagram_user_id) {
      return NextResponse.json(
        { error: 'Meta連携が必要です' },
        { status: 400 },
      );
    }

    if (mediaId) {
      const post = await getPostWithInsights(mediaId, {
        accessToken: connection.access_token,
      });

      if (!post) {
        return NextResponse.json(
          { error: 'Post not found or API error' },
          { status: 404 },
        );
      }
      return NextResponse.json(post);
    }

    const posts = await getInstagramPosts({
      accessToken: connection.access_token,
      userId: connection.instagram_user_id,
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
