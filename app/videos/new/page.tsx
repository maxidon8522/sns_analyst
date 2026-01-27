import { redirect } from 'next/navigation';
import { getPostWithInsights } from '@/lib/instagram';
import {
  createServerSupabaseUserActionClient,
  createServerSupabaseUserClient,
} from '@/utils/supabase/user';
import { AnalysisTagsForm } from '@/components/forms/analysis-tags-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

async function saveAnalysisAction(formData: FormData) {
  'use server';

  const supabase = createServerSupabaseUserActionClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('ログインが必要です');
  }

  const { data: connection, error: connectionError } = await supabase
    .from('meta_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'instagram')
    .maybeSingle();

  if (connectionError || !connection?.access_token) {
    throw new Error('Meta連携が必要です');
  }
  const ig_media_id = formData.get('ig_media_id') as string;
  const rawTags = formData.get('tags') as string;
  const score = formData.get('score');

  const post = await getPostWithInsights(ig_media_id, {
    accessToken: connection.access_token,
  });
  if (!post) {
    throw new Error('Post not found');
  }

  const { error } = await supabase.from('videos').upsert(
    {
      user_id: user.id,
      ig_media_id: post.id,
      permalink: post.permalink,
      thumbnail_url: post.thumbnail_url || post.media_url,
      media_url: post.media_url,
      caption: post.caption,
      posted_at: post.timestamp,
      analysis_tags: JSON.parse(rawTags),
      self_score: Number(score),
    },
    {
      onConflict: 'user_id,ig_media_id',
    },
  );

  if (error) {
    console.error('DB Insert/Update Error:', error);
    throw new Error('Failed to save analysis');
  }

  redirect('/instagram?created=true');
}

export default async function NewAnalysisPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = createServerSupabaseUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const ig_media_id = searchParams.ig_media_id as string;

  if (!ig_media_id) {
    redirect('/instagram');
  }

  const { data: connection } = await supabase
    .from('meta_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'instagram')
    .maybeSingle();

  if (!connection?.access_token) {
    return (
      <div className="container p-6">
        <div className="rounded-md bg-amber-50 p-4 text-amber-700">
          Meta連携が必要です。設定ページから連携してください。
        </div>
      </div>
    );
  }

  const post = await getPostWithInsights(ig_media_id, {
    accessToken: connection.access_token,
  });

  if (!post) {
    return (
      <div className="container p-6">
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          投稿が見つかりませんでした。(ID: {ig_media_id})
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">動画の分析・タグ付け</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                対象の投稿
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-black/5">
                <div className="flex flex-col items-center text-gray-400">
                  <span className="mb-2 text-4xl">
                    {post.media_type === 'VIDEO' || post.media_type === 'REELS'
                      ? '🎥'
                      : '📷'}
                  </span>
                  <span className="text-xs">{post.media_type}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">❤️ {post.like_count}</Badge>
                  <Badge variant="outline">💬 {post.comments_count}</Badge>
                  <Badge variant="outline">👀 {post.insights?.views ?? '-'}</Badge>
                  <Badge variant="outline">🔖 {post.insights?.saved ?? '-'}</Badge>
                </div>
                <p className="line-clamp-4 rounded-md bg-gray-50 p-3 text-sm text-gray-600">
                  {post.caption}
                </p>
                <div className="text-right text-xs text-muted-foreground">
                  投稿日: {new Date(post.timestamp).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>分析データを入力</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisTagsForm
                igMediaId={ig_media_id}
                serverAction={saveAnalysisAction}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
