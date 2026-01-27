import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createMetaAuthUrl, createSignedState } from "@/lib/meta";
import { getUserFromRequest } from "@/utils/supabase/auth";

export const runtime = "nodejs";

const DEFAULT_SCOPES = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
].join(",");

export async function GET(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const stateSecret = process.env.META_OAUTH_STATE_SECRET;
  const redirectUri =
    process.env.META_REDIRECT_URI ||
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/oauth/callback`
      : "");

  if (!appId || !appSecret || !stateSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Meta OAuth environment variables are missing." },
      { status: 500 },
    );
  }

  const scope = process.env.META_SCOPES || DEFAULT_SCOPES;
  const state = createSignedState(
    {
      uid: user.id,
      nonce: crypto.randomBytes(16).toString("hex"),
      ts: Date.now(),
    },
    stateSecret,
  );

  const authUrl = createMetaAuthUrl({
    appId,
    redirectUri,
    state,
    scope,
  });

  return NextResponse.json({ url: authUrl });
}
