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

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const safeReach = typeof reach === "number" ? reach : 0;
  const safeProfileViews = typeof profileViews === "number" ? profileViews : 0;
  const safeWebsiteClicks = typeof websiteClicks === "number" ? websiteClicks : 0;
  const reachText = typeof reach === "number" ? formatNumber(reach) : "-";
  const profileText = typeof profileViews === "number" ? formatNumber(profileViews) : "-";
  const websiteText = typeof websiteClicks === "number" ? formatNumber(websiteClicks) : "-";

  const hasData =
    typeof reach === "number" ||
    typeof profileViews === "number" ||
    typeof websiteClicks === "number";

  const chartData = [
    { step: "リーチ数", value: safeReach },
    { step: "プロフィール閲覧数", value: safeProfileViews },
    { step: "Webサイトクリック数", value: safeWebsiteClicks }
  ];

  const profileRate = getRate(safeReach, safeProfileViews);
  const websiteRate = getRate(safeProfileViews, safeWebsiteClicks);
  const overallRate = getRate(safeReach, safeWebsiteClicks);

  const colors = ["#0ea5e9", "#38bdf8", "#a5b4fc"];

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">コンバージョン分析</CardTitle>
          <p className="text-sm text-muted-foreground">
            リーチからサイト訪問までの動線を可視化します。
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          全体CVR {overallRate !== null ? `${overallRate}%` : "-"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-xs text-muted-foreground">リーチ</p>
            <p className="text-lg font-semibold text-slate-900">
              {reachText}
            </p>
            <p className="text-[10px] text-muted-foreground">人</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-xs text-muted-foreground">プロフィール閲覧</p>
            <p className="text-lg font-semibold text-slate-900">
              {profileText}
            </p>
            <p className="text-[10px] text-muted-foreground">回</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Webクリック</p>
            <p className="text-lg font-semibold text-slate-900">
              {websiteText}
            </p>
            <p className="text-[10px] text-muted-foreground">回</p>
          </div>
        </div>

        {!hasData ? (
          <p className="text-sm text-muted-foreground">
            まだデータがありません。Cronでアカウントインサイトを取得してください。
          </p>
        ) : (
          <>
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

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1 text-xs">
                リーチ → プロフ {profileRate !== null ? `${profileRate}%` : "-"}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                プロフ → Web {websiteRate !== null ? `${websiteRate}%` : "-"}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
