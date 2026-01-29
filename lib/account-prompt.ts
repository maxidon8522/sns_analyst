import type { AnalysisTags, Database } from "@/types/database";

export type PromptGoalPrimary = "followers" | "reach" | "saves" | "profile_visits";
export type PromptMode = "stable_growth" | "buzz" | "follow_focus";

export type AccountPromptParams = {
  windowDays: number;
  primary: PromptGoalPrimary;
  secondary: PromptGoalPrimary[];
  mode: PromptMode;
};

type VideoRow = Database["public"]["Tables"]["videos"]["Row"];
type MetricsRow = Database["public"]["Tables"]["metrics_logs"]["Row"];
type AccountInsightRow = Database["public"]["Tables"]["account_insights"]["Row"];

export type AccountPromptData = {
  videos: VideoRow[];
  metricsLogs: MetricsRow[];
  accountInsights: AccountInsightRow[];
};

const ACCOUNT_PROMPT_TEMPLATE = `あなたはInstagramアカウントの成長戦略AIコンサルです。
単発バズではなく、アカウントを継続的に成長させる視点で分析・提案してください。

【前提】
- 感覚論は禁止。必ず与えられたデータを根拠にすること
- 不確実な点は「仮説」と明記すること
- analysis_tags（basic / content / editing / strategy）を必ず参照し、強みと弱みを結びつけること
- ユーザーが「次に何をすればいいか」が明確に分かるように書くこと

【出力は必ず以下の3ブロック構成で行ってください】

────────────────
① 今はどうなのか？（現状診断）
────────────────
- 現在のアカウント状態を3行で要約
- 成長を妨げている主なボトルネック（最大3つ、優先度順）
- すでに機能している強み（データ根拠つき）

────────────────
② 次にどんな動画を作るべきか？
────────────────
- 今のアカウントで最も効果が出やすい動画タイプ（3〜5個）
  - 各タイプについて：
    - どんな内容か
    - なぜ今それが効くのか（データ根拠 or 仮説）
- 次の10本分の具体的な動画企画
  - 各企画に含めること：
    - テーマ
    - 冒頭フック（0–3秒）
    - 構成の流れ（秒単位で簡潔に）
    - 推奨CTA（保存 / フォロー / プロフ遷移 など）

────────────────
③ 今後の展望・伸ばし方（30–90日）
────────────────
- 30日以内に安定させるべき指標
- 60日で伸ばしに行くポイント
- 90日でやるべきスケール戦略（シリーズ化・型化）
- 今後「やらない方がいいこと」「捨てるべきこと」

【入力データ（JSON）】
以下のデータのみを根拠に、上記3ブロックを作成してください。

{{ACCOUNT_INPUT_JSON}}
`;

const TAG_FIELDS: Record<keyof AnalysisTags, string[]> = {
  basic: ["time_slot", "length", "thumbnail_type", "sound_type"],
  content: [
    "location",
    "action",
    "companion",
    "language_element",
    "reality_level",
    "mood",
    "info_density",
  ],
  editing: [
    "hook_visual",
    "hook_text",
    "structure",
    "tempo",
    "telop_amount",
    "filter",
    "ending",
  ],
  strategy: ["caption_style", "target", "cta", "origin", "cost", "purpose"],
};

const LENGTH_BUCKET_MAP: Record<string, "<10" | "10-20" | "20+"> = {
  short: "<10",
  medium: "10-20",
  long: "20+",
  extra_long: "20+",
};

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const roundTo = (value: number, decimals = 4): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const avgOrNull = (values: Array<number | null | undefined>): number | null => {
  const nums = values.filter(isNumber);
  if (!nums.length) return null;
  return nums.reduce((sum, v) => sum + v, 0) / nums.length;
};

const safeRate = (numerator?: number | null, denominator?: number | null): number | null => {
  if (!isNumber(numerator) || !isNumber(denominator) || denominator === 0) {
    return null;
  }
  return roundTo(numerator / denominator);
};

const buildHourBucket = (): Record<string, number> =>
  Array.from({ length: 24 }).reduce((acc, _, index) => {
    acc[String(index)] = 0;
    return acc;
  }, {} as Record<string, number>);

const buildLengthBucket = (): Record<"<10" | "10-20" | "20+", number> => ({
  "<10": 0,
  "10-20": 0,
  "20+": 0,
});

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const truncateCaption = (caption: string | null, maxLength = 80): string | null => {
  if (!caption) return null;
  const trimmed = caption.trim();
  if (!trimmed) return null;
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}...`;
};

type LatestMetrics = {
  views: number | null;
  likes: number | null;
  saves: number | null;
  comments: number | null;
  fetched_at: string | null;
};

type VideoAggregate = {
  video: VideoRow;
  latestMetrics: LatestMetrics | null;
  rates: {
    like_rate: number | null;
    save_rate: number | null;
    comment_rate: number | null;
    share_rate: number | null;
    follow_rate: number | null;
  };
  scoreValue: number | null;
  scoreMetric: string | null;
};

const buildLatestMetricsMap = (metricsLogs: MetricsRow[]): Map<string, LatestMetrics> => {
  const map = new Map<string, LatestMetrics>();
  metricsLogs.forEach((log) => {
    if (!log.video_id) return;
    const fetchedAt = parseDate(log.fetched_at);
    const existing = map.get(log.video_id);
    if (existing) {
      const existingDate = parseDate(existing.fetched_at);
      if (existingDate && fetchedAt && existingDate >= fetchedAt) return;
      if (existingDate && !fetchedAt) return;
    }
    map.set(log.video_id, {
      views: isNumber(log.views) ? log.views : null,
      likes: isNumber(log.likes) ? log.likes : null,
      saves: isNumber(log.saves) ? log.saves : null,
      comments: isNumber(log.comments) ? log.comments : null,
      fetched_at: log.fetched_at ?? null,
    });
  });
  return map;
};

const chooseBenchmarkMetric = (
  aggregates: VideoAggregate[],
  primary: PromptGoalPrimary,
): string | null => {
  const hasMetric = (metric: string) =>
    aggregates.some((entry) => entry.scoreMetric === metric);

  if (primary === "followers") {
    if (hasMetric("follow_rate")) return "follow_rate";
    if (hasMetric("follows")) return "follows";
    if (hasMetric("profile_visits")) return "profile_visits";
    return null;
  }
  if (primary === "saves") {
    if (hasMetric("save_rate")) return "save_rate";
    if (hasMetric("saves")) return "saves";
    return null;
  }
  if (primary === "reach") {
    if (hasMetric("reach")) return "reach";
    if (hasMetric("views")) return "views";
    return null;
  }
  if (primary === "profile_visits") {
    if (hasMetric("profile_visits")) return "profile_visits";
    return null;
  }
  return null;
};

const pickScoreValue = (
  video: VideoRow,
  latestMetrics: LatestMetrics | null,
  rates: VideoAggregate["rates"],
  primary: PromptGoalPrimary,
): { value: number | null; metric: string | null } => {
  if (primary === "followers") {
    if (isNumber(rates.follow_rate)) return { value: rates.follow_rate, metric: "follow_rate" };
    if (isNumber(video.follows)) return { value: video.follows, metric: "follows" };
    if (isNumber(video.profile_visits)) {
      return { value: video.profile_visits, metric: "profile_visits" };
    }
    return { value: null, metric: null };
  }
  if (primary === "saves") {
    if (isNumber(rates.save_rate)) return { value: rates.save_rate, metric: "save_rate" };
    if (isNumber(latestMetrics?.saves)) return { value: latestMetrics.saves, metric: "saves" };
    return { value: null, metric: null };
  }
  if (primary === "reach") {
    if (isNumber(video.reach)) return { value: video.reach, metric: "reach" };
    if (isNumber(latestMetrics?.views)) return { value: latestMetrics.views, metric: "views" };
    return { value: null, metric: null };
  }
  if (primary === "profile_visits") {
    if (isNumber(video.profile_visits)) {
      return { value: video.profile_visits, metric: "profile_visits" };
    }
    return { value: null, metric: null };
  }
  return { value: null, metric: null };
};

const buildAggregates = (
  videos: VideoRow[],
  latestMetricsMap: Map<string, LatestMetrics>,
  primary: PromptGoalPrimary,
): VideoAggregate[] =>
  videos.map((video) => {
    const latestMetrics = latestMetricsMap.get(video.id) ?? null;
    const rates = {
      like_rate: safeRate(latestMetrics?.likes, latestMetrics?.views),
      save_rate: safeRate(latestMetrics?.saves, latestMetrics?.views),
      comment_rate: safeRate(latestMetrics?.comments, latestMetrics?.views),
      share_rate: safeRate(video.shares, video.reach),
      follow_rate: safeRate(video.follows, video.profile_visits),
    };
    const { value, metric } = pickScoreValue(video, latestMetrics, rates, primary);
    return {
      video,
      latestMetrics,
      rates,
      scoreValue: value,
      scoreMetric: metric,
    };
  });

const buildAggregateStats = (items: VideoAggregate[]) => ({
  per_video_latest_avg: {
    views: avgOrNull(items.map((item) => item.latestMetrics?.views)),
    likes: avgOrNull(items.map((item) => item.latestMetrics?.likes)),
    saves: avgOrNull(items.map((item) => item.latestMetrics?.saves)),
    comments: avgOrNull(items.map((item) => item.latestMetrics?.comments)),
    reach: avgOrNull(items.map((item) => item.video.reach)),
    shares: avgOrNull(items.map((item) => item.video.shares)),
    profile_visits: avgOrNull(items.map((item) => item.video.profile_visits)),
    follows: avgOrNull(items.map((item) => item.video.follows)),
  },
  rates_avg: {
    like_rate: avgOrNull(items.map((item) => item.rates.like_rate)),
    save_rate: avgOrNull(items.map((item) => item.rates.save_rate)),
    comment_rate: avgOrNull(items.map((item) => item.rates.comment_rate)),
    share_rate: avgOrNull(items.map((item) => item.rates.share_rate)),
    follow_rate: avgOrNull(items.map((item) => item.rates.follow_rate)),
  },
});

const buildTagInsights = (items: VideoAggregate[]) => {
  const buildCategory = (category: keyof AnalysisTags) => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const tags = item.video.analysis_tags;
      if (!tags) return;
      const section = tags[category] as Record<string, unknown> | undefined;
      if (!section) return;
      TAG_FIELDS[category].forEach((field) => {
        const raw = section[field];
        if (raw === null || raw === undefined) return;
        const value = typeof raw === "boolean" ? String(raw) : String(raw);
        const key = `${field}::${value}`;
        counts[key] = (counts[key] ?? 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([key, count]) => {
        const [field, value] = key.split("::");
        return { field, value, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  return {
    basic: buildCategory("basic"),
    content: buildCategory("content"),
    editing: buildCategory("editing"),
    strategy: buildCategory("strategy"),
  };
};

const buildSample = (item: VideoAggregate) => ({
  video_id: item.video.id,
  posted_at: item.video.posted_at ?? null,
  caption: truncateCaption(item.video.caption),
  manual_metrics: {
    reach: item.video.reach ?? null,
    shares: item.video.shares ?? null,
    profile_visits: item.video.profile_visits ?? null,
    follows: item.video.follows ?? null,
  },
  latest_metrics: {
    views: item.latestMetrics?.views ?? null,
    likes: item.latestMetrics?.likes ?? null,
    saves: item.latestMetrics?.saves ?? null,
    comments: item.latestMetrics?.comments ?? null,
  },
  rates: {
    save_rate: item.rates.save_rate,
    follow_rate: item.rates.follow_rate,
  },
  analysis_tags: item.video.analysis_tags ?? null,
  self_score: item.video.self_score ?? null,
});

export const buildAccountInputJson = (params: AccountPromptParams, data: AccountPromptData) => {
  const { windowDays, primary, secondary, mode } = params;
  const { videos, metricsLogs, accountInsights } = data;

  const latestMetricsMap = buildLatestMetricsMap(metricsLogs);
  const aggregates = buildAggregates(videos, latestMetricsMap, primary);

  const lengthBucket = buildLengthBucket();
  const postingHourBucket = buildHourBucket();
  let manualDoneTrue = 0;
  let manualDoneFalse = 0;

  videos.forEach((video) => {
    const analysisTags = video.analysis_tags;
    if (analysisTags?.basic?.length) {
      const bucket = LENGTH_BUCKET_MAP[analysisTags.basic.length] ?? null;
      if (bucket) {
        lengthBucket[bucket] += 1;
      }
    }
    const postedAt = parseDate(video.posted_at);
    if (postedAt) {
      const hour = postedAt.getHours();
      postingHourBucket[String(hour)] = (postingHourBucket[String(hour)] ?? 0) + 1;
    }
    if (video.manual_input_done) {
      manualDoneTrue += 1;
    } else {
      manualDoneFalse += 1;
    }
  });

  const accountInsightsSorted = [...accountInsights].sort((a, b) => {
    const aTime = parseDate(a.date)?.getTime() ?? 0;
    const bTime = parseDate(b.date)?.getTime() ?? 0;
    return bTime - aTime;
  });
  const latestInsight = accountInsightsSorted[0] ?? null;

  const accountSummary = {
    window_days: windowDays,
    latest: {
      followers_count: latestInsight?.followers_count ?? null,
      profile_views: latestInsight?.profile_views ?? null,
      website_clicks: latestInsight?.website_clicks ?? null,
      reach_daily: latestInsight?.reach_daily ?? null,
      impressions_daily: latestInsight?.impressions_daily ?? null,
      online_peak_hour: latestInsight?.online_peak_hour ?? null,
    },
    avg: {
      profile_views: avgOrNull(accountInsights.map((row) => row.profile_views)),
      website_clicks: avgOrNull(accountInsights.map((row) => row.website_clicks)),
      reach_daily: avgOrNull(accountInsights.map((row) => row.reach_daily)),
      impressions_daily: avgOrNull(accountInsights.map((row) => row.impressions_daily)),
    },
    audience_data: latestInsight?.audience_data ?? {},
  };

  const performanceAggregate = buildAggregateStats(aggregates);

  const sortedByPostedAt = [...aggregates].sort((a, b) => {
    const aTime = parseDate(a.video.posted_at)?.getTime() ?? 0;
    const bTime = parseDate(b.video.posted_at)?.getTime() ?? 0;
    return bTime - aTime;
  });
  const recent10 = sortedByPostedAt.slice(0, 10);

  const scored = aggregates.filter((item) => isNumber(item.scoreValue));
  const scoredSorted = [...scored].sort(
    (a, b) => (b.scoreValue ?? 0) - (a.scoreValue ?? 0),
  );
  const quartileCount = scoredSorted.length
    ? Math.max(1, Math.round(scoredSorted.length * 0.25))
    : 0;
  const topQuartile = scoredSorted.slice(0, quartileCount);
  const bottomQuartile = [...scoredSorted]
    .sort((a, b) => (a.scoreValue ?? 0) - (b.scoreValue ?? 0))
    .slice(0, quartileCount);

  const benchmarkMetric = chooseBenchmarkMetric(aggregates, primary);

  const benchmarks = {
    benchmark_metric: benchmarkMetric,
    recent10_avg: {
      count: recent10.length,
      ...buildAggregateStats(recent10),
    },
    top25_avg: {
      count: topQuartile.length,
      ...buildAggregateStats(topQuartile),
    },
    bottom25_avg: {
      count: bottomQuartile.length,
      ...buildAggregateStats(bottomQuartile),
    },
  };

  const topTags = buildTagInsights(topQuartile);
  const weakTags = buildTagInsights(bottomQuartile);

  const topVideos = scoredSorted.slice(0, 3).map(buildSample);
  const recentVideos = sortedByPostedAt.slice(0, 3).map(buildSample);

  const totalVideos = videos.length;
  const missingLatestCount = aggregates.filter((item) => !item.latestMetrics).length;
  const manualFalseRatio = totalVideos ? manualDoneFalse / totalVideos : 0;
  const missingLatestRatio = totalVideos ? missingLatestCount / totalVideos : 0;
  const warnings: string[] = [];

  if (!accountInsights.length) {
    warnings.push("account_insights が指定期間内に存在しません。");
  }
  if (totalVideos === 0) {
    warnings.push("指定期間内の動画データがありません。");
  }
  if (totalVideos > 0 && missingLatestRatio >= 0.5) {
    warnings.push(
      `metrics_logs が不足しています（latest未取得: ${missingLatestCount}/${totalVideos}）。`,
    );
  }
  if (totalVideos > 0 && manualFalseRatio >= 0.3) {
    warnings.push(
      `手入力が未完了の動画が多いです（manual_input_done=false: ${manualDoneFalse}/${totalVideos}）。`,
    );
  }

  return {
    schema_version: "account_prompt_v1",
    generated_at: new Date().toISOString(),
    analysis_window_days: windowDays,
    goal: {
      primary,
      secondary,
    },
    mode,
    account_summary: accountSummary,
    content_overview: {
      video_count: totalVideos,
      length_bucket: lengthBucket,
      posting_hour_bucket: postingHourBucket,
      manual_input_coverage: {
        manual_input_done_true: manualDoneTrue,
        manual_input_done_false: manualDoneFalse,
      },
    },
    performance_aggregate: performanceAggregate,
    benchmarks,
    analysis_tags_insights: {
      top_tags_by_performance: topTags,
      weak_tags_by_performance: weakTags,
    },
    samples: {
      top_videos: topVideos,
      recent_videos: recentVideos,
    },
    data_warnings: warnings,
  };
};

export const buildAccountPromptText = (accountInputJson: Record<string, unknown>): string => {
  const jsonString = JSON.stringify(accountInputJson, null, 2);
  return ACCOUNT_PROMPT_TEMPLATE.replace("{{ACCOUNT_INPUT_JSON}}", jsonString);
};
