"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";

type MarketingFunnelProps = {
  reach?: number | null;
  profileViews?: number | null;
  websiteClicks?: number | null;
};

const formatNumber = (value: number) => new Intl.NumberFormat("ja-JP").format(value);

const getRate = (from: number, to: number) =>
  from > 0 ? Math.round((to / from) * 100) : null;

export function MarketingFunnel({
  reach,
  profileViews,
  websiteClicks
}: MarketingFunnelProps) {
  const hasValidReach = typeof reach === "number" && reach > 0;
  const hasValidProfileViews = typeof profileViews === "number" && profileViews > 0;

  if (!hasValidReach || !hasValidProfileViews) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-lg font-semibold text-slate-800">
              コンバージョン分析
            </CardTitle>
          </div>
          <p className="text-sm text-slate-500">
            リーチからサイト訪問までの動線を可視化します。
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <EmptyState
            title="コンバージョンデータ不足"
            description="リーチやプロフィール閲覧のデータがまだ取得できていません。"
          />
        </CardContent>
      </Card>
    );
  }

  const safeReach = typeof reach === "number" ? reach : 0;
  const safeProfileViews = typeof profileViews === "number" ? profileViews : 0;
  const safeWebsiteClicks = typeof websiteClicks === "number" ? websiteClicks : 0;
  const reachText = typeof reach === "number" ? formatNumber(reach) : "-";
  const profileText = typeof profileViews === "number" ? formatNumber(profileViews) : "-";
  const websiteText = typeof websiteClicks === "number" ? formatNumber(websiteClicks) : "-";

  const chartData = [
    { step: "リーチ数", value: safeReach },
    { step: "プロフィール閲覧数", value: safeProfileViews },
    { step: "Webサイトクリック数", value: safeWebsiteClicks }
  ];

  const profileRate = getRate(safeReach, safeProfileViews);
  const websiteRate = getRate(safeProfileViews, safeWebsiteClicks);
  const overallRate = getRate(safeReach, safeWebsiteClicks);

  const colors = ["#0ea5e9", "#38bdf8", "#a5b4fc"];
  const overallBadgeTone =
    overallRate !== null && overallRate > 0
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-100 text-slate-600";

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="p-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-lg font-semibold text-slate-800">
              コンバージョン分析
            </CardTitle>
          </div>
          <Badge className={`text-xs ${overallBadgeTone}`}>
            全体CVR {overallRate !== null ? `${overallRate}%` : "-"}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">
          リーチからサイト訪問までの動線を可視化します。
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-0">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-xs text-slate-500">リーチ</p>
            <p className="text-3xl font-bold text-slate-800">
              {reachText}
            </p>
            <p className="text-[10px] text-slate-400">人</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-xs text-slate-500">プロフィール閲覧</p>
            <p className="text-3xl font-bold text-slate-800">
              {profileText}
            </p>
            <p className="text-[10px] text-slate-400">回</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-xs text-slate-500">Webクリック</p>
            <p className="text-3xl font-bold text-slate-800">
              {websiteText}
            </p>
            <p className="text-[10px] text-slate-400">回</p>
          </div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 24, left: 12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <YAxis
                type="category"
                dataKey="step"
                tick={{ fontSize: 12 }}
                width={120}
              />
              <Tooltip
                formatter={(value) => formatNumber(Number(value))}
                contentStyle={{
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 12px 30px rgba(15,23,42,0.12)"
                }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(value: number) => formatNumber(value)}
                />
                {chartData.map((entry, index) => (
                  <Cell key={entry.step} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Badge variant="outline" className="gap-1 text-xs text-slate-600">
            リーチ → プロフ {profileRate !== null ? `${profileRate}%` : "-"}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs text-slate-600">
            プロフ → Web {websiteRate !== null ? `${websiteRate}%` : "-"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
