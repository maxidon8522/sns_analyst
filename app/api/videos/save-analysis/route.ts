import { NextResponse, type NextRequest } from "next/server";

import { getPostWithInsights } from "@/lib/instagram";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { getUserFromRequest } from "@/utils/supabase/auth";

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ig_media_id = body?.ig_media_id as string | undefined;
  const tags = body?.tags;
  const score = body?.score;

  if (!ig_media_id || !tags) {
    return NextResponse.json(
      { error: "ig_media_id と tags は必須です。" },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient();
  const { data: connection, error: connectionError } = await supabase
    .from("meta_connections")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("provider", "instagram")
    .maybeSingle();

  if (connectionError) {
    return NextResponse.json({ error: connectionError.message }, { status: 500 });
  }

  if (!connection?.access_token) {
    return NextResponse.json(
      { error: "Meta連携が必要です。" },
      { status: 400 },
    );
  }

  const post = await getPostWithInsights(ig_media_id, {
    accessToken: connection.access_token,
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { error } = await supabase.from("videos").upsert(
    {
      user_id: user.id,
      ig_media_id: post.id,
      permalink: post.permalink,
      thumbnail_url: post.thumbnail_url || post.media_url,
      media_url: post.media_url,
      caption: post.caption,
      posted_at: post.timestamp,
      analysis_tags: tags,
      self_score: Number(score),
    },
    { onConflict: "user_id,ig_media_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
