import { NextResponse, type NextRequest } from "next/server";

import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  fetchInstagramBusinessAccount,
  verifySignedState,
} from "@/lib/meta";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const DEFAULT_SCOPES = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
].join(",");

const buildRedirectUrl = (
  request: NextRequest,
  status: "success" | "error",
  reason?: string,
) => {
  const params = new URLSearchParams({ meta: status });
  if (reason) params.set("reason", reason);
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const url = base ? new URL(base) : new URL(request.url);
  url.pathname = "/settings";
  url.search = params.toString();
  return url.toString();
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(buildRedirectUrl(request, "error", error));
  }

  if (!code || !state) {
    return NextResponse.redirect(
      buildRedirectUrl(request, "error", "missing_params"),
    );
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
    return NextResponse.redirect(
      buildRedirectUrl(request, "error", "env_missing"),
    );
  }

  const payload = verifySignedState(state, stateSecret);
  if (!payload) {
    return NextResponse.redirect(
      buildRedirectUrl(request, "error", "invalid_state"),
    );
  }

  const ageMs = Date.now() - payload.ts;
  if (ageMs > 1000 * 60 * 10) {
    return NextResponse.redirect(
      buildRedirectUrl(request, "error", "state_expired"),
    );
  }

  try {
    const shortToken = await exchangeCodeForToken({
      appId,
      appSecret,
      redirectUri,
      code,
    });

    const longToken = await exchangeForLongLivedToken({
      appId,
      appSecret,
      shortLivedToken: shortToken.access_token,
    });

    const accessToken = longToken.access_token;
    const expiresIn = longToken.expires_in ?? shortToken.expires_in ?? null;

    const account = await fetchInstagramBusinessAccount(accessToken);
    if (!account) {
      return NextResponse.redirect(
        buildRedirectUrl(request, "error", "no_ig_account"),
      );
    }

    const expiresAt =
      typeof expiresIn === "number"
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null;

    const supabase = createServerSupabaseClient();
    const scopes = (process.env.META_SCOPES || DEFAULT_SCOPES)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const { error: upsertError } = await supabase
      .from("meta_connections")
      .upsert(
        {
          user_id: payload.uid,
          provider: "instagram",
          access_token: accessToken,
          token_type: longToken.token_type ?? shortToken.token_type ?? null,
          expires_at: expiresAt,
          scopes,
          instagram_user_id: account.instagramUserId,
          page_id: account.pageId,
          page_name: account.pageName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" },
      );

    if (upsertError) {
      return NextResponse.redirect(
        buildRedirectUrl(request, "error", "db_error"),
      );
    }

    return NextResponse.redirect(buildRedirectUrl(request, "success"));
  } catch (err) {
    console.error("Meta OAuth callback error:", err);
    return NextResponse.redirect(
      buildRedirectUrl(request, "error", "callback_failed"),
    );
  }
}
