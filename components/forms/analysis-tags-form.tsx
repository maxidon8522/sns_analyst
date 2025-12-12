'use client';

import { useState } from 'react';
import { z } from 'zod';
import {
  useForm,
  type Control,
  type FieldPath,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import type { AnalysisTags } from '../../types/database';

type OptionLabel = {
  label: string;
  description?: string;
};

type RadioOption<T extends string> = {
  value: T;
} & OptionLabel;

const createOptions = <const T extends readonly string[]>(
  values: T,
  labels: Record<T[number], OptionLabel>,
): RadioOption<T[number]>[] =>
  values.map((value) => ({
    value,
    ...labels[value],
  }));

const TIME_SLOT_VALUES = [
  'early_morning',
  'morning',
  'lunch',
  'afternoon',
  'evening',
  'night',
] as const;
const LENGTH_VALUES = ['short', 'medium', 'long', 'extra_long'] as const;
const THUMBNAIL_VALUES = ['none', 'face', 'text', 'emo'] as const;
const SOUND_VALUES = ['trend', 'chill', 'auto_voice', 'my_voice', 'asmr'] as const;
const LOCATION_VALUES = ['room', 'school', 'cafe', 'city', 'trip'] as const;
const ACTION_VALUES = ['study', 'eat', 'play', 'routine', 'talk', 'shopping'] as const;
const COMPANION_VALUES = ['solo', 'local_friend', 'jp_friend', 'none'] as const;
const LANGUAGE_VALUES = ['jp_only', 'foreign_practice', 'none'] as const;
const REALITY_VALUES = ['perfect', 'natural', 'real'] as const;
const MOOD_VALUES = ['happy', 'calm', 'tired', 'emo'] as const;
const INFO_DENSITY_VALUES = ['high', 'medium', 'low'] as const;
const HOOK_VISUAL_VALUES = ['impact', 'beauty', 'mystery', 'normal'] as const;
const HOOK_TEXT_VALUES = ['question', 'conclusion', 'emotion', 'none'] as const;
const STRUCTURE_VALUES = ['time', 'list', 'reason', 'montage'] as const;
const TEMPO_VALUES = ['fast', 'normal', 'slow'] as const;
const TELOP_VALUES = ['full', 'point', 'none'] as const;
const FILTER_VALUES = ['bright', 'dark', 'raw'] as const;
const ENDING_VALUES = ['happy', 'bad', 'question', 'none'] as const;
const CAPTION_STYLE_VALUES = ['diary', 'info', 'short'] as const;
const TARGET_VALUES = ['new', 'existing', 'fan'] as const;
const ORIGIN_VALUES = ['original', 'trend', 'copy'] as const;
const COST_VALUES = ['high', 'medium', 'low'] as const;
const PURPOSE_VALUES = ['view', 'save', 'comment'] as const;

const timeSlotOptions = createOptions(
  TIME_SLOT_VALUES,
  {
    early_morning: { label: '早朝', description: '4-7時' },
    morning: { label: '朝', description: '7-11時' },
    lunch: { label: 'ランチ', description: '11-13時' },
    afternoon: { label: '午後', description: '13-17時' },
    evening: { label: '夕方', description: '17-20時' },
    night: { label: '夜', description: '20時以降' },
  } satisfies Record<(typeof TIME_SLOT_VALUES)[number], OptionLabel>,
);
const lengthOptions = createOptions(
  LENGTH_VALUES,
  {
    short: { label: 'ショート', description: '〜20秒' },
    medium: { label: 'ミドル', description: '20-40秒' },
    long: { label: 'ロング', description: '40-60秒' },
    extra_long: { label: '超ロング', description: '60秒以上' },
  } satisfies Record<(typeof LENGTH_VALUES)[number], OptionLabel>,
);
const thumbnailOptions = createOptions(
  THUMBNAIL_VALUES,
  {
    none: { label: 'B-roll', description: 'サムネ無し' },
    face: { label: '顔アップ', description: '表情重視' },
    text: { label: 'テキスト', description: 'キャプション重視' },
    emo: { label: 'エモショット', description: '感情で惹きつけ' },
  } satisfies Record<(typeof THUMBNAIL_VALUES)[number], OptionLabel>,
);
const soundOptions = createOptions(
  SOUND_VALUES,
  {
    trend: { label: 'トレンド', description: '流行音源' },
    chill: { label: 'チル', description: 'Lo-Fi/BGM' },
    auto_voice: { label: '自動音声', description: '読み上げ' },
    my_voice: { label: '地声', description: '本人ナレーション' },
    asmr: { label: 'ASMR', description: '環境音/ささやき' },
  } satisfies Record<(typeof SOUND_VALUES)[number], OptionLabel>,
);
const locationOptions = createOptions(
  LOCATION_VALUES,
  {
    room: { label: '部屋', description: '寮・自室' },
    school: { label: '学校', description: '授業/キャンパス' },
    cafe: { label: 'カフェ', description: '作業・友達' },
    city: { label: '街歩き', description: 'シティ散策' },
    trip: { label: '旅', description: '遠出/旅行' },
  } satisfies Record<(typeof LOCATION_VALUES)[number], OptionLabel>,
);
const actionOptions = createOptions(
  ACTION_VALUES,
  {
    study: { label: '勉強', description: 'Study/Library' },
    eat: { label: 'グルメ', description: '食事シーン' },
    play: { label: '遊び', description: 'アクティビティ' },
    routine: { label: 'ルーティン', description: '1日の流れ' },
    talk: { label: 'トーク', description: '語り/語りかけ' },
    shopping: { label: 'ショッピング', description: '買い物' },
  } satisfies Record<(typeof ACTION_VALUES)[number], OptionLabel>,
);
const companionOptions = createOptions(
  COMPANION_VALUES,
  {
    solo: { label: 'ソロ', description: '一人時間' },
    local_friend: { label: '現地友達', description: '海外の友達' },
    jp_friend: { label: '日本人友達', description: '留学生仲間' },
    none: { label: '登場なし', description: '顔出しゼロ' },
  } satisfies Record<(typeof COMPANION_VALUES)[number], OptionLabel>,
);
const languageOptions = createOptions(
  LANGUAGE_VALUES,
  {
    jp_only: { label: '日本語のみ', description: 'JP字幕/音声' },
    foreign_practice: { label: '外国語練習', description: '英語など' },
    none: { label: '言語なし', description: '音楽のみ' },
  } satisfies Record<(typeof LANGUAGE_VALUES)[number], OptionLabel>,
);
const realityOptions = createOptions(
  REALITY_VALUES,
  {
    perfect: { label: '演出', description: '理想的/スタイリッシュ' },
    natural: { label: 'ナチュラル', description: 'ありのまま' },
    real: { label: 'リアル', description: '生々しい' },
  } satisfies Record<(typeof REALITY_VALUES)[number], OptionLabel>,
);
const moodOptions = createOptions(
  MOOD_VALUES,
  {
    happy: { label: 'Happy', description: '明るい空気' },
    calm: { label: 'Calm', description: '落ち着き' },
    tired: { label: 'Tired', description: '疲れ気味' },
    emo: { label: 'Emo', description: '感情的' },
  } satisfies Record<(typeof MOOD_VALUES)[number], OptionLabel>,
);
const infoDensityOptions = createOptions(
  INFO_DENSITY_VALUES,
  {
    high: { label: '情報多め', description: 'Tips量多' },
    medium: { label: '標準', description: 'バランス' },
    low: { label: 'ゆるめ', description: '空気感重視' },
  } satisfies Record<(typeof INFO_DENSITY_VALUES)[number], OptionLabel>,
);
const hookVisualOptions = createOptions(
  HOOK_VISUAL_VALUES,
  {
    impact: { label: 'インパクト', description: '強い導入' },
    beauty: { label: 'ビューティー', description: '映像美' },
    mystery: { label: 'ミステリー', description: '謎で惹きつけ' },
    normal: { label: 'スタンダード', description: '通常' },
  } satisfies Record<(typeof HOOK_VISUAL_VALUES)[number], OptionLabel>,
);
const hookTextOptions = createOptions(
  HOOK_TEXT_VALUES,
  {
    question: { label: '質問', description: '問いかける' },
    conclusion: { label: '結論', description: '先出し結論' },
    emotion: { label: 'エモ', description: '感情をシェア' },
    none: { label: 'なし', description: 'テキスト無し' },
  } satisfies Record<(typeof HOOK_TEXT_VALUES)[number], OptionLabel>,
);
const structureOptions = createOptions(
  STRUCTURE_VALUES,
  {
    time: { label: 'タイムライン', description: '時系列' },
    list: { label: 'リスト', description: '箇条書き' },
    reason: { label: '理由', description: 'Why構成' },
    montage: { label: 'モンタージュ', description: '断片的編集' },
  } satisfies Record<(typeof STRUCTURE_VALUES)[number], OptionLabel>,
);
const tempoOptions = createOptions(
  TEMPO_VALUES,
  {
    fast: { label: 'ハイテンポ', description: 'テンポ速め' },
    normal: { label: 'ノーマル', description: '標準' },
    slow: { label: 'スロー', description: 'ゆっくり' },
  } satisfies Record<(typeof TEMPO_VALUES)[number], OptionLabel>,
);
const telopOptions = createOptions(
  TELOP_VALUES,
  {
    full: { label: 'フルテロップ', description: 'ほぼ全編' },
    point: { label: 'ポイント', description: '要所のみ' },
    none: { label: 'なし', description: 'テロップ無し' },
  } satisfies Record<(typeof TELOP_VALUES)[number], OptionLabel>,
);
const filterOptions = createOptions(
  FILTER_VALUES,
  {
    bright: { label: '明るめ', description: '彩度高め' },
    dark: { label: 'ダーク', description: 'ムーディ' },
    raw: { label: 'RAW', description: '無加工' },
  } satisfies Record<(typeof FILTER_VALUES)[number], OptionLabel>,
);
const endingOptions = createOptions(
  ENDING_VALUES,
  {
    happy: { label: 'ハッピー', description: '前向きに締め' },
    bad: { label: 'バッド', description: '失敗や反省' },
    question: { label: '問いかけ', description: '次へ繋ぐ' },
    none: { label: 'フェードアウト', description: '自然に終了' },
  } satisfies Record<(typeof ENDING_VALUES)[number], OptionLabel>,
);
const captionStyleOptions = createOptions(
  CAPTION_STYLE_VALUES,
  {
    diary: { label: '日記', description: '感想ベース' },
    info: { label: '情報', description: 'Tips/How to' },
    short: { label: '一言', description: 'シンプル' },
  } satisfies Record<(typeof CAPTION_STYLE_VALUES)[number], OptionLabel>,
);
const targetOptions = createOptions(
  TARGET_VALUES,
  {
    new: { label: '新規', description: '未接触層' },
    existing: { label: '既存', description: 'フォロワー' },
    fan: { label: 'ファン', description: '濃い層' },
  } satisfies Record<(typeof TARGET_VALUES)[number], OptionLabel>,
);
const originOptions = createOptions(
  ORIGIN_VALUES,
  {
    original: { label: 'オリジナル', description: '完全自作' },
    trend: { label: 'トレンド', description: '音源・構成' },
    copy: { label: 'リメイク', description: '人気投稿を再構築' },
  } satisfies Record<(typeof ORIGIN_VALUES)[number], OptionLabel>,
);
const costOptions = createOptions(
  COST_VALUES,
  {
    high: { label: '高コスト', description: '撮影/編集重' },
    medium: { label: '中コスト', description: '程よい手間' },
    low: { label: '低コスト', description: 'スマホのみ' },
  } satisfies Record<(typeof COST_VALUES)[number], OptionLabel>,
);
const purposeOptions = createOptions(
  PURPOSE_VALUES,
  {
    view: { label: '再生', description: 'リーチ重視' },
    save: { label: '保存', description: '有益性重視' },
    comment: { label: 'コメント', description: '会話重視' },
  } satisfies Record<(typeof PURPOSE_VALUES)[number], OptionLabel>,
);

const CTA_OPTIONS = [
  { value: 'true', label: 'CTAあり', description: 'コメントや保存を促す' },
  { value: 'false', label: 'CTAなし', description: '自然体で締める' },
] as const;

const AnalysisTagsOnlySchema = z.object({
  basic: z.object({
    time_slot: z.enum(TIME_SLOT_VALUES),
    length: z.enum(LENGTH_VALUES),
    thumbnail_type: z.enum(THUMBNAIL_VALUES),
    sound_type: z.enum(SOUND_VALUES),
  }),
  content: z.object({
    location: z.enum(LOCATION_VALUES),
    action: z.enum(ACTION_VALUES),
    companion: z.enum(COMPANION_VALUES),
    language_element: z.enum(LANGUAGE_VALUES),
    reality_level: z.enum(REALITY_VALUES),
    mood: z.enum(MOOD_VALUES),
    info_density: z.enum(INFO_DENSITY_VALUES),
  }),
  editing: z.object({
    hook_visual: z.enum(HOOK_VISUAL_VALUES),
    hook_text: z.enum(HOOK_TEXT_VALUES),
    structure: z.enum(STRUCTURE_VALUES),
    tempo: z.enum(TEMPO_VALUES),
    telop_amount: z.enum(TELOP_VALUES),
    filter: z.enum(FILTER_VALUES),
    ending: z.enum(ENDING_VALUES),
  }),
  strategy: z.object({
    caption_style: z.enum(CAPTION_STYLE_VALUES),
    target: z.enum(TARGET_VALUES),
    cta: z.boolean(),
    origin: z.enum(ORIGIN_VALUES),
    cost: z.enum(COST_VALUES),
    purpose: z.enum(PURPOSE_VALUES),
  }),
});

export const analysisTagsSchema = AnalysisTagsOnlySchema.extend({
  self_score: z.number().int().min(0).max(100),
});

export type AnalysisTagsFormValues = z.infer<typeof analysisTagsSchema>;

export const defaultAnalysisTagsFormValues: AnalysisTagsFormValues = {
  basic: {
    time_slot: timeSlotOptions[1].value,
    length: lengthOptions[1].value,
    thumbnail_type: thumbnailOptions[1].value,
    sound_type: soundOptions[0].value,
  },
  content: {
    location: locationOptions[0].value,
    action: actionOptions[0].value,
    companion: companionOptions[0].value,
    language_element: languageOptions[0].value,
    reality_level: realityOptions[1].value,
    mood: moodOptions[0].value,
    info_density: infoDensityOptions[1].value,
  },
  editing: {
    hook_visual: hookVisualOptions[0].value,
    hook_text: hookTextOptions[0].value,
    structure: structureOptions[0].value,
    tempo: tempoOptions[1].value,
    telop_amount: telopOptions[1].value,
    filter: filterOptions[2].value,
    ending: endingOptions[0].value,
  },
  strategy: {
    caption_style: captionStyleOptions[0].value,
    target: targetOptions[0].value,
    cta: true,
    origin: originOptions[0].value,
    cost: costOptions[1].value,
    purpose: purposeOptions[1].value,
  },
  self_score: 70,
};

type TagFieldConfig = {
  name: FieldPath<AnalysisTagsFormValues>;
  label: string;
  options: RadioOption<string>[];
  gridClassName?: string;
};

type TagTabConfig = {
  value: 'basic' | 'content' | 'editing' | 'strategy';
  label: string;
  description: string;
  fields: TagFieldConfig[];
};

const ANALYSIS_TAG_SECTIONS: TagTabConfig[] = [
  {
    value: 'basic',
    label: 'Basic',
    description: '尺・音源・サムネといった基本設定を選択します。',
    fields: [
      {
        name: 'basic.time_slot',
        label: '投稿時間帯',
        options: timeSlotOptions,
        gridClassName: 'grid grid-cols-2 gap-2 sm:grid-cols-3',
      },
      {
        name: 'basic.length',
        label: '動画の長さ',
        options: lengthOptions,
        gridClassName: 'grid grid-cols-2 gap-2',
      },
      {
        name: 'basic.thumbnail_type',
        label: 'サムネタイプ',
        options: thumbnailOptions,
        gridClassName: 'grid grid-cols-2 gap-2',
      },
      {
        name: 'basic.sound_type',
        label: '音源タイプ',
        options: soundOptions,
        gridClassName: 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5',
      },
    ],
  },
  {
    value: 'content',
    label: 'Content',
    description: 'ロケーションやムードなど定性タグを入力します。',
    fields: [
      {
        name: 'content.location',
        label: 'ロケーション',
        options: locationOptions,
      },
      {
        name: 'content.action',
        label: '主なアクション',
        options: actionOptions,
        gridClassName: 'grid grid-cols-2 gap-2 sm:grid-cols-3',
      },
      {
        name: 'content.companion',
        label: '登場人物',
        options: companionOptions,
      },
      {
        name: 'content.language_element',
        label: '言語要素',
        options: languageOptions,
      },
      {
        name: 'content.reality_level',
        label: 'リアリティ',
        options: realityOptions,
      },
      {
        name: 'content.mood',
        label: 'ムード',
        options: moodOptions,
      },
      {
        name: 'content.info_density',
        label: '情報量',
        options: infoDensityOptions,
      },
    ],
  },
  {
    value: 'editing',
    label: 'Editing',
    description: 'フックや構成など編集の特徴をタグ付けします。',
    fields: [
      {
        name: 'editing.hook_visual',
        label: 'ビジュアルフック',
        options: hookVisualOptions,
      },
      {
        name: 'editing.hook_text',
        label: 'テキストフック',
        options: hookTextOptions,
      },
      {
        name: 'editing.structure',
        label: '構成',
        options: structureOptions,
      },
      {
        name: 'editing.tempo',
        label: 'テンポ',
        options: tempoOptions,
      },
      {
        name: 'editing.telop_amount',
        label: 'テロップ量',
        options: telopOptions,
      },
      {
        name: 'editing.filter',
        label: 'フィルター',
        options: filterOptions,
      },
      {
        name: 'editing.ending',
        label: 'エンディング',
        options: endingOptions,
      },
    ],
  },
  {
    value: 'strategy',
    label: 'Strategy',
    description: '狙うオーディエンスやゴールを定義します。',
    fields: [
      {
        name: 'strategy.caption_style',
        label: 'キャプションスタイル',
        options: captionStyleOptions,
      },
      {
        name: 'strategy.target',
        label: 'ターゲット',
        options: targetOptions,
      },
      {
        name: 'strategy.origin',
        label: 'ネタの由来',
        options: originOptions,
      },
      {
        name: 'strategy.cost',
        label: '制作コスト',
        options: costOptions,
      },
      {
        name: 'strategy.purpose',
        label: '目的',
        options: purposeOptions,
      },
    ],
  },
];

export const analysisTagSections = ANALYSIS_TAG_SECTIONS;

type AnalysisTagsFormProps = {
  defaultValues?: AnalysisTagsFormValues;
  onSubmit?: (values: AnalysisTagsFormValues) => void | Promise<void>;
  submitLabel?: string;
  className?: string;
  igMediaId?: string;
  serverAction?: (formData: FormData) => Promise<void>;
};

export const AnalysisTagsForm = ({
  defaultValues = defaultAnalysisTagsFormValues,
  onSubmit,
  submitLabel = '保存する',
  className,
  igMediaId,
  serverAction,
}: AnalysisTagsFormProps) => {
  const form = useForm<AnalysisTagsFormValues>({
    resolver: zodResolver(analysisTagsSchema),
    defaultValues,
  });

  const [isClientSubmitting, setIsClientSubmitting] = useState(false);

  const handleSubmit = async (values: AnalysisTagsFormValues) => {
    if (serverAction) {
      if (!igMediaId) {
        console.error('ig_media_id is required when using serverAction');
        return;
      }

      setIsClientSubmitting(true);
      try {
        const { self_score, ...analysisTags } = values;
        const payload = new FormData();
        payload.append('ig_media_id', igMediaId);
        payload.append('tags', JSON.stringify(analysisTags));
        payload.append('score', String(self_score));
        await serverAction(payload);
      } finally {
        setIsClientSubmitting(false);
      }
      return;
    }

    await onSubmit?.(values);
  };

  const formClassName = ['space-y-8', className].filter(Boolean).join(' ');

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={formClassName}
      >
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {ANALYSIS_TAG_SECTIONS.map((section) => (
              <TabsTrigger key={section.value} value={section.value}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {ANALYSIS_TAG_SECTIONS.map((section) => (
            <TabsContent
              key={section.value}
              value={section.value}
              className="space-y-6"
            >
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
              <div className="grid gap-6">
                {section.fields.map((field) => (
                  <TagRadioGroupField
                    key={field.name}
                    control={form.control}
                    {...field}
                  />
                ))}
                {section.value === 'strategy' ? (
                  <BooleanRadioGroupField control={form.control} />
                ) : null}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <FormField
          control={form.control}
          name="self_score"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-semibold">
                  自己採点 (0-100)
                </FormLabel>
                <span className="text-sm font-medium text-muted-foreground">
                  {field.value}
                </span>
              </div>
              <FormControl>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[field.value]}
                  onValueChange={(value) => field.onChange(value[0] ?? 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={form.formState.isSubmitting || isClientSubmitting}
        >
          {form.formState.isSubmitting || isClientSubmitting
            ? '保存中...'
            : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

type TagRadioGroupFieldProps = TagFieldConfig & {
  control: Control<AnalysisTagsFormValues>;
};

const TagRadioGroupField = ({
  control,
  name,
  label,
  options,
  gridClassName = 'grid grid-cols-2 gap-2 sm:grid-cols-3',
}: TagRadioGroupFieldProps) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="space-y-3">
        <FormLabel className="text-base font-semibold">{label}</FormLabel>
        <FormControl>
          <RadioGroup
            onValueChange={field.onChange}
            value={field.value}
            className={gridClassName}
          >
            {options.map((option) => {
              const id = `${name}-${option.value}`;
              const isSelected = field.value === option.value;
              return (
                <div key={option.value} className="w-full">
                  <RadioGroupItem
                    value={option.value}
                    id={id}
                    className="sr-only"
                  />
                  <OptionCard
                    id={id}
                    label={option.label}
                    description={option.description}
                    isSelected={isSelected}
                  />
                </div>
              );
            })}
          </RadioGroup>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

type BooleanRadioGroupFieldProps = {
  control: Control<AnalysisTagsFormValues>;
};

const BooleanRadioGroupField = ({
  control,
}: BooleanRadioGroupFieldProps) => (
  <FormField
    control={control}
    name="strategy.cta"
    render={({ field }) => {
      const currentValue = field.value ? 'true' : 'false';
      return (
        <FormItem className="space-y-3">
          <FormLabel className="text-base font-semibold">CTAの有無</FormLabel>
          <FormControl>
            <RadioGroup
              className="grid grid-cols-2 gap-2"
              value={currentValue}
              onValueChange={(value) => field.onChange(value === 'true')}
            >
              {CTA_OPTIONS.map((option) => {
                const id = `strategy.cta-${option.value}`;
                const isSelected = currentValue === option.value;
                return (
                  <div key={option.value} className="w-full">
                    <RadioGroupItem
                      value={option.value}
                      id={id}
                      className="sr-only"
                    />
                    <OptionCard
                      id={id}
                      label={option.label}
                      description={option.description}
                      isSelected={isSelected}
                    />
                  </div>
                );
              })}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      );
    }}
  />
);

type OptionCardProps = {
  id: string;
  label: string;
  description?: string;
  isSelected: boolean;
};

const OptionCard = ({
  id,
  label,
  description,
  isSelected,
}: OptionCardProps) => {
  const baseClasses =
    'flex min-h-[60px] cursor-pointer select-none flex-col items-center justify-center rounded-xl border p-3 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
  const activeClasses = 'border-primary bg-primary/10 text-primary';
  const inactiveClasses = 'border-border bg-card text-foreground hover:border-primary/40';

  return (
    <Label
      htmlFor={id}
      className={`${baseClasses} ${
        isSelected ? activeClasses : inactiveClasses
      }`}
    >
      <span>{label}</span>
      {description ? (
        <span className="mt-1 text-xs font-normal text-muted-foreground">
          {description}
        </span>
      ) : null}
    </Label>
  );
};
