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
  const postInput = body?.post;

  const postFromBody =
    postInput && typeof postInput === "object"
      ? {
          id: (postInput as any).id as string | undefined,
          permalink: (postInput as any).permalink as string | null | undefined,
          thumbnail_url: (postInput as any).thumbnail_url as string | null | undefined,
          media_url: (postInput as any).media_url as string | null | undefined,
          caption: (postInput as any).caption as string | null | undefined,
          timestamp: (postInput as any).timestamp as string | null | undefined,
        }
      : null;

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

  let post = null as Awaited<ReturnType<typeof getPostWithInsights>> | null;
  if (connection?.access_token) {
    post = await getPostWithInsights(ig_media_id, {
      accessToken: connection.access_token,
    });
  }

  const payload = {
    user_id: user.id,
    ig_media_id,
    analysis_tags: tags,
    self_score: Number(score),
    permalink: post?.permalink ?? postFromBody?.permalink ?? null,
    thumbnail_url:
      post?.thumbnail_url ??
      post?.media_url ??
      postFromBody?.thumbnail_url ??
      postFromBody?.media_url ??
      null,
    media_url: post?.media_url ?? postFromBody?.media_url ?? null,
    caption: post?.caption ?? postFromBody?.caption ?? null,
    posted_at: post?.timestamp ?? postFromBody?.timestamp ?? null,
  };

  const { error } = await supabase
    .from("videos")
    .upsert(payload, { onConflict: "user_id,ig_media_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
