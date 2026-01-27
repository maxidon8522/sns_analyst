import { NextResponse, type NextRequest } from "next/server";

import { getUserFromRequest } from "@/utils/supabase/auth";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const access_token = body?.access_token as string | undefined;
  const instagram_user_id = body?.instagram_user_id as string | undefined;
  const page_id = body?.page_id as string | undefined;
  const page_name = body?.page_name as string | undefined;

  if (!access_token || !instagram_user_id) {
    return NextResponse.json(
      { error: "access_token と instagram_user_id は必須です。" },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("meta_connections")
    .upsert(
      {
        user_id: user.id,
        provider: "instagram",
        access_token,
        instagram_user_id,
        page_id: page_id ?? null,
        page_name: page_name ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
