import { NextResponse, type NextRequest } from "next/server";

import { getUserFromRequest } from "@/utils/supabase/auth";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { user } = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("*, metrics_logs(*)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (videoError) {
    return NextResponse.json({ error: videoError.message }, { status: 500 });
  }

  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: comparisonVideos, error: comparisonError } = await supabase
    .from("videos")
    .select("*, metrics_logs(*)")
    .eq("user_id", user.id)
    .neq("id", params.id);

  if (comparisonError) {
    return NextResponse.json({ error: comparisonError.message }, { status: 500 });
  }

  return NextResponse.json({
    video,
    comparisonVideos: comparisonVideos ?? [],
  });
}
