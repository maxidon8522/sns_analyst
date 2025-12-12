'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type TagPerformanceStat = {
  value: string;
  label: string;
  avgSaves: number;
  avgViews: number;
  sampleCount: number;
};

type ChartCategory = {
  id: string;
  label: string;
};

type TagPerformanceChartProps = {
  categories: ChartCategory[];
  statsByCategory: Record<string, TagPerformanceStat[]>;
};

type ChartDatum = {
  value: string;
  label: string;
  avgSaves: number;
  avgViews: number;
  sampleCount: number;
};

export function TagPerformanceChart({
  categories,
  statsByCategory,
}: TagPerformanceChartProps) {
  const [selectedCategory, setSelectedCategory] = useState(
    categories[0]?.id ?? '',
  );

  const selectedStats = statsByCategory[selectedCategory] ?? [];

  const chartData = useMemo<ChartDatum[]>(
    () =>
      selectedStats.map((stat) => ({
        value: stat.value,
        label: stat.label,
        avgSaves: Number(stat.avgSaves.toFixed(1)),
        avgViews: Number(stat.avgViews.toFixed(1)),
        sampleCount: stat.sampleCount,
      })),
    [selectedStats],
  );

  const totalSamples = useMemo(
    () => selectedStats.reduce((sum, stat) => sum + stat.sampleCount, 0),
    [selectedStats],
  );

  const activeCategoryLabel =
    categories.find((category) => category.id === selectedCategory)?.label ??
    'カテゴリ未選択';

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <p className="text-sm text-muted-foreground">
          {selectedStats.length
            ? `${activeCategoryLabel}: ${totalSamples} 本のサンプル`
            : 'まだこのカテゴリのサンプルがありません。'}
        </p>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="カテゴリを選択" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {chartData.length ? (
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 16, right: 24, bottom: 16, left: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                interval={0}
                height={70}
              />
              <YAxis
                label={{
                  value: '平均保存数',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.2)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }

                  const stat = payload[0]?.payload as ChartDatum | undefined;
                  if (!stat) {
                    return null;
                  }

                  return (
                    <div className="rounded-md border bg-background p-3 text-xs shadow-lg">
                      <p className="font-semibold">{label}</p>
                      <p className="mt-1">平均保存数: {stat.avgSaves} 件</p>
                      <p>平均再生数: {stat.avgViews} 件</p>
                      <p className="text-muted-foreground">
                        サンプル: {stat.sampleCount} 本
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="avgSaves" fill="#0f172a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          このカテゴリで比較できるデータがまだありません。
        </div>
      )}
    </div>
  );
}
