import { Sparkles } from 'lucide-react';

import { TagPerformanceChart, type TagPerformanceStat } from '@/components/analysis/tag-performance-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { AnalysisTags, Database } from '@/types/database';
import { createServerSupabaseClient } from '@/utils/supabase/server';

type VideoRow = Database['public']['Tables']['videos']['Row'];
type MetricsRow = Pick<
  Database['public']['Tables']['metrics_logs']['Row'],
  'saves' | 'views' | 'fetched_at'
>;

type VideoWithMetrics = VideoRow & {
  metrics_logs: MetricsRow[] | null;
};

type TagPath = readonly [keyof AnalysisTags, string];

type TagCategoryConfig = {
  id: string;
  label: string;
  path: TagPath;
  optionLabels: Record<string, string>;
};

const TAG_CATEGORIES = [
  {
    id: 'time_slot',
    label: '投稿時間帯',
    path: ['basic', 'time_slot'],
    optionLabels: {
      early_morning: '早朝 (4-7時)',
      morning: '朝 (7-11時)',
      lunch: 'ランチ (11-13時)',
      afternoon: '午後 (13-17時)',
      evening: '夕方 (17-20時)',
      night: '夜 (20時以降)',
    },
  },
  {
    id: 'sound_type',
    label: '音源タイプ',
    path: ['basic', 'sound_type'],
    optionLabels: {
      trend: 'トレンド音源',
      chill: 'チル/BGM',
      auto_voice: '自動音声',
      my_voice: '地声ナレーション',
      asmr: 'ASMR/環境音',
    },
  },
  {
    id: 'location',
    label: 'ロケーション',
    path: ['content', 'location'],
    optionLabels: {
      room: '部屋',
      school: '学校',
      cafe: 'カフェ',
      city: '街歩き',
      trip: '旅先',
    },
  },
  {
    id: 'action',
    label: 'シーン/行動',
    path: ['content', 'action'],
    optionLabels: {
      study: '勉強',
      eat: 'グルメ',
      play: '遊び',
      routine: 'ルーティン',
      talk: 'トーク',
      shopping: 'ショッピング',
    },
  },
  {
    id: 'mood',
    label: '動画の空気感',
    path: ['content', 'mood'],
    optionLabels: {
      happy: 'Happy',
      calm: 'Calm',
      tired: 'Tired',
      emo: 'Emo',
    },
  },
  {
    id: 'hook_text',
    label: 'フックのテキスト',
    path: ['editing', 'hook_text'],
    optionLabels: {
      question: '質問系',
      conclusion: '結論提示',
      emotion: 'エモ訴求',
      none: 'テキストなし',
    },
  },
  {
    id: 'telop_amount',
    label: 'テロップ量',
    path: ['editing', 'telop_amount'],
    optionLabels: {
      full: 'フルテロップ',
      point: 'ポイントのみ',
      none: 'テロップなし',
    },
  },
  {
    id: 'target',
    label: 'ターゲット',
    path: ['strategy', 'target'],
    optionLabels: {
      new: '新規',
      existing: '既存フォロワー',
      fan: '濃いファン',
    },
  },
  {
    id: 'origin',
    label: '企画の由来',
    path: ['strategy', 'origin'],
    optionLabels: {
      original: 'オリジナル',
      trend: 'トレンド',
      copy: '再現/引用',
    },
  },
  {
    id: 'purpose',
    label: '狙い',
    path: ['strategy', 'purpose'],
    optionLabels: {
      view: '再生獲得',
      save: '保存獲得',
      comment: 'コメント誘発',
    },
  },
] as const satisfies readonly TagCategoryConfig[];

type TagCategoryId = (typeof TAG_CATEGORIES)[number]['id'];

type StatsByCategory = Record<TagCategoryId, TagPerformanceStat[]>;

type WinningTag = TagPerformanceStat & {
  categoryId: TagCategoryId;
  categoryLabel: string;
};

export default async function AnalysisDashboardPage() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('videos')
    .select('id, caption, analysis_tags, metrics_logs(fetched_at, saves, views)')
    .order('fetched_at', { foreignTable: 'metrics_logs', ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const videos: VideoWithMetrics[] = data ?? [];
  const statsByCategory = buildTagStats(videos);
  const winningTags = buildWinningTags(statsByCategory, 6);

  const totalVideos = videos.length;
  const videosWithMetrics = videos.filter((video) => !!getLatestMetrics(video.metrics_logs)).length;
  const lastUpdatedAt = getLastUpdatedAt(videos);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">タグ別パフォーマンス分析</p>
        <h1 className="text-3xl font-bold">どのタグが保存を生むのか？</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Supabaseに蓄積した動画データを全量集計し、タグごとの平均保存数・再生数を可視化します。
          ハイパフォーマンスの兆しがある要素を素早く見つけましょう。
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>勝ちタグランキング</CardTitle>
            <CardDescription>平均保存数が高かったタグをカテゴリ横断でピックアップ。</CardDescription>
          </CardHeader>
          <CardContent>
            {winningTags.length ? (
              <ul className="space-y-3">
                {winningTags.map((tag, index) => (
                  <li
                    key={`${tag.categoryId}-${tag.value}`}
                    className="flex items-center justify-between rounded-md border border-border/70 p-4"
                  >
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        #{index + 1} {tag.categoryLabel}
                      </p>
                      <p className="text-lg font-semibold">{tag.label}</p>
                      <p className="text-xs text-muted-foreground">
                        平均保存 {formatMetric(tag.avgSaves)} 件 / 平均再生{' '}
                        {formatMetric(tag.avgViews)} 件 ・ n={tag.sampleCount}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      +{formatMetric(tag.avgSaves)} 保存
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                まだ十分な動画データがないため、ランキングを作成できません。
                まずはInstagram投稿を取り込みタグ付けしてください。
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AIプランナー</CardTitle>
            <CardDescription>次の撮影テーマが思いつかない時はLLMに相談。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">タグ付き動画</dt>
                <dd className="text-2xl font-semibold">{totalVideos}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">最新同期</dt>
                <dd className="text-base font-medium">{formatDate(lastUpdatedAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">metricsあり</dt>
                <dd className="text-2xl font-semibold">{videosWithMetrics}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">データカバレッジ</dt>
                <dd className="text-base font-medium">
                  {totalVideos ? Math.round((videosWithMetrics / totalVideos) * 100) : 0}%
                </dd>
              </div>
            </dl>
            <Button className="w-full" variant="secondary">
              <Sparkles className="mr-2 h-4 w-4" />
              このデータをもとに次の企画を提案して
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>タグ × 保存数の相関</CardTitle>
          <CardDescription>
            プルダウンでカテゴリを切り替えて、各タグが平均保存数にどの程度寄与しているかを確認できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagPerformanceChart
            categories={TAG_CATEGORIES.map(({ id, label }) => ({ id, label }))}
            statsByCategory={statsByCategory}
          />
        </CardContent>
      </Card>
    </div>
  );
}

const buildTagStats = (videos: VideoWithMetrics[]): StatsByCategory => {
  const accumulator: Record<
    TagCategoryId,
    Record<string, { count: number; saves: number; views: number }>
  > = TAG_CATEGORIES.reduce(
    (acc, category) => ({
      ...acc,
      [category.id]: {},
    }),
    {} as Record<
      TagCategoryId,
      Record<string, { count: number; saves: number; views: number }>
    >,
  );

  videos.forEach((video) => {
    if (!video.analysis_tags) {
      return;
    }

    const metrics = getLatestMetrics(video.metrics_logs);
    if (!metrics) {
      return;
    }

    TAG_CATEGORIES.forEach((category) => {
      const value = getTagValue(video.analysis_tags, category.path);
      if (!value) {
        return;
      }

      const bucket =
        accumulator[category.id][value] ??
        (accumulator[category.id][value] = {
          count: 0,
          saves: 0,
          views: 0,
        });

      bucket.count += 1;
      bucket.saves += metrics.saves;
      bucket.views += metrics.views;
    });
  });

  return TAG_CATEGORIES.reduce(
    (result, category) => ({
      ...result,
      [category.id]: Object.entries(accumulator[category.id])
        .map(([value, data]) => ({
          value,
          label: category.optionLabels[value] ?? value,
          avgSaves: data.count ? data.saves / data.count : 0,
          avgViews: data.count ? data.views / data.count : 0,
          sampleCount: data.count,
        }))
        .sort((a, b) => b.avgSaves - a.avgSaves),
    }),
    {} as StatsByCategory,
  );
};

const buildWinningTags = (
  statsByCategory: StatsByCategory,
  limit: number,
): WinningTag[] =>
  TAG_CATEGORIES.flatMap((category) =>
    (statsByCategory[category.id] ?? []).map((stat) => ({
      ...stat,
      categoryId: category.id,
      categoryLabel: category.label,
    })),
  )
    .filter((entry) => entry.sampleCount > 0)
    .sort((a, b) => b.avgSaves - a.avgSaves)
    .slice(0, limit);

const getTagValue = (tags: AnalysisTags, path: TagPath): string | null => {
  const [section, field] = path;
  const sectionValue = tags[section];
  if (!sectionValue) {
    return null;
  }

  const value = (sectionValue as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : null;
};

const getLatestMetrics = (logs: MetricsRow[] | null): { saves: number; views: number } | null => {
  if (!logs?.length) {
    return null;
  }

  const latest = [...logs].sort((a, b) => {
    const aTime = a.fetched_at ? new Date(a.fetched_at).getTime() : 0;
    const bTime = b.fetched_at ? new Date(b.fetched_at).getTime() : 0;
    return bTime - aTime;
  })[0];

  if (typeof latest?.saves !== 'number' && typeof latest?.views !== 'number') {
    return null;
  }

  return {
    saves: typeof latest.saves === 'number' ? latest.saves : 0,
    views: typeof latest.views === 'number' ? latest.views : 0,
  };
};

const getLastUpdatedAt = (videos: VideoWithMetrics[]): Date | null => {
  let latest: Date | null = null;

  videos.forEach((video) => {
    video.metrics_logs?.forEach((log) => {
      if (!log.fetched_at) {
        return;
      }
      const fetchedAt = new Date(log.fetched_at);
      if (Number.isNaN(fetchedAt.getTime())) {
        return;
      }
      if (!latest || fetchedAt.getTime() > latest.getTime()) {
        latest = fetchedAt;
      }
    });
  });

  return latest;
};

const formatDate = (date: Date | null): string =>
  date
    ? date.toLocaleString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '未取得';

const formatMetric = (value: number): string =>
  Number.isFinite(value) ? (value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)) : '0';
