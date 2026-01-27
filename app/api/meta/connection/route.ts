import { NextResponse, type NextRequest } from "next/server";

import { getUserFromRequest } from "@/utils/supabase/auth";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("meta_connections")
    .select(
      "provider, instagram_user_id, page_id, page_name, created_at, expires_at",
    )
    .eq("user_id", user.id)
    .eq("provider", "instagram")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ connection: data ?? null });
}

export async function DELETE(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("meta_connections")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "instagram");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
