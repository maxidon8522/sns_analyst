import { NextResponse, type NextRequest } from 'next/server';

import {
  getInstagramPosts,
  getPostWithInsights,
} from '@/lib/instagram';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get('media_id');

  try {
    if (mediaId) {
      const post = await getPostWithInsights(mediaId);

      if (!post) {
        return NextResponse.json(
          { error: 'Post not found or API error' },
          { status: 404 },
        );
      }
      return NextResponse.json(post);
    }

    const posts = await getInstagramPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
