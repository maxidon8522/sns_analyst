import { NextResponse, type NextRequest } from "next/server";

import {
  buildAccountInputJson,
  buildAccountPromptText,
  type PromptGoalPrimary,
  type PromptMode,
} from "@/lib/account-prompt";
import type { Database } from "@/types/database";
import { getUserFromRequest } from "@/utils/supabase/auth";
import { createServerSupabaseClient } from "@/utils/supabase/server";

const WINDOW_DAY_OPTIONS = [30, 60, 90] as const;
const PRIMARY_GOALS: PromptGoalPrimary[] = [
  "followers",
  "reach",
  "saves",
  "profile_visits",
];
const MODES: PromptMode[] = ["stable_growth", "buzz", "follow_focus"];

const isPrimaryGoal = (value: unknown): value is PromptGoalPrimary =>
  typeof value === "string" && PRIMARY_GOALS.includes(value as PromptGoalPrimary);

const isMode = (value: unknown): value is PromptMode =>
  typeof value === "string" && MODES.includes(value as PromptMode);

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const requestedWindowDays = Number(body?.window_days);
  const windowDays = WINDOW_DAY_OPTIONS.includes(requestedWindowDays as (typeof WINDOW_DAY_OPTIONS)[number])
    ? requestedWindowDays
    : 30;
  const primary: PromptGoalPrimary = isPrimaryGoal(body?.primary)
    ? body.primary
    : "followers";
  const mode: PromptMode = isMode(body?.mode) ? body.mode : "stable_growth";
  const secondaryRaw = Array.isArray(body?.secondary) ? body.secondary : [];
  const secondary = Array.from(
    new Set(
      secondaryRaw.filter(isPrimaryGoal).filter((goal: PromptGoalPrimary) => goal !== primary),
    ),
  );

  const supabase = createServerSupabaseClient();
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setUTCDate(windowStart.getUTCDate() - windowDays);
  const windowStartIso = windowStart.toISOString();
  const windowStartDate = windowStart.toISOString().slice(0, 10);

  let videos: Database["public"]["Tables"]["videos"]["Row"][] = [];
  let manualMetricsMissing = false;
  const videoSelectWithManual =
    "id, user_id, ig_media_id, caption, posted_at, analysis_tags, self_score, reach, shares, profile_visits, follows, manual_input_done";
  const videoSelectBase =
    "id, user_id, ig_media_id, caption, posted_at, analysis_tags, self_score";

  const { data: videoData, error: videosError } = await supabase
    .from("videos")
    .select(videoSelectWithManual)
    .eq("user_id", user.id)
    .gte("posted_at", windowStartIso);

  if (videosError) {
    if (videosError.message?.includes("does not exist")) {
      manualMetricsMissing = true;
      const { data: fallbackVideos, error: fallbackError } = await supabase
        .from("videos")
        .select(videoSelectBase)
        .eq("user_id", user.id)
        .gte("posted_at", windowStartIso);

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }

      videos = (fallbackVideos ?? []).map((video) => ({
        ...video,
        reach: null,
        shares: null,
        profile_visits: null,
        follows: null,
        manual_input_done: null,
      })) as Database["public"]["Tables"]["videos"]["Row"][];
    } else {
      return NextResponse.json({ error: videosError.message }, { status: 500 });
    }
  } else {
    videos = videoData ?? [];
  }

  const videoIds = (videos ?? []).map((video) => video.id);
  let metricsLogs: Database["public"]["Tables"]["metrics_logs"]["Row"][] = [];

  if (videoIds.length) {
    const { data: metricsData, error: metricsError } = await supabase
      .from("metrics_logs")
      .select("id, video_id, user_id, fetched_at, views, likes, saves, comments")
      .in("video_id", videoIds)
      .eq("user_id", user.id)
      .gte("fetched_at", windowStartIso);

    if (metricsError) {
      return NextResponse.json({ error: metricsError.message }, { status: 500 });
    }
    metricsLogs = metricsData ?? [];
  }

  const { data: accountInsights, error: insightsError } = await supabase
    .from("account_insights")
    .select(
      "id, user_id, date, followers_count, profile_views, website_clicks, reach_daily, impressions_daily, online_peak_hour, audience_data, created_at",
    )
    .eq("user_id", user.id)
    .gte("date", windowStartDate);

  if (insightsError) {
    return NextResponse.json({ error: insightsError.message }, { status: 500 });
  }

  const accountInputJson = buildAccountInputJson(
    {
      windowDays,
      primary,
      secondary,
      mode,
    },
    {
      videos: videos ?? [],
      metricsLogs,
      accountInsights: accountInsights ?? [],
    },
  );
  if (manualMetricsMissing) {
    accountInputJson.data_warnings.push(
      "videos の手入力指標カラム（reach/shares/profile_visits/follows）がDBに存在しません。",
    );
  }

  const promptText = buildAccountPromptText(accountInputJson);

  return NextResponse.json({
    prompt_text: promptText,
    account_input_json: accountInputJson,
    data_warnings: accountInputJson.data_warnings ?? [],
  });
}
