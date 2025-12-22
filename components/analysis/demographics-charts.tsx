"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";

type DemographicsChartsProps = {
  countries?: Record<string, number>;
  cities?: Record<string, number>;
  genderAge?: Record<string, number>;
};

type AgeGenderRow = {
  age: string;
  female: number;
  male: number;
  unknown: number;
};

const buildAgeGenderData = (genderAge?: Record<string, number>) => {
  if (!genderAge) return [];

  const bucket: Record<string, AgeGenderRow> = {};

  Object.entries(genderAge).forEach(([key, value]) => {
    const [gender, age] = key.split(".");
    const ageKey = age || "不明";
    if (!bucket[ageKey]) {
      bucket[ageKey] = { age: ageKey, female: 0, male: 0, unknown: 0 };
    }

    const safeValue = typeof value === "number" ? value : Number(value) || 0;
    if (gender === "F") {
      bucket[ageKey].female += safeValue;
    } else if (gender === "M") {
      bucket[ageKey].male += safeValue;
    } else {
      bucket[ageKey].unknown += safeValue;
    }
  });

  return Object.values(bucket).sort((a, b) => {
    const parseAge = (label: string) => {
      const match = label.match(/\d+/);
      return match ? Number(match[0]) : 999;
    };
    return parseAge(a.age) - parseAge(b.age);
  });
};

const getTopEntries = (data?: Record<string, number>, limit = 5) => {
  if (!data) return [];
  return Object.entries(data)
    .map(([label, value]) => ({
      label,
      value: typeof value === "number" ? value : Number(value) || 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

export function DemographicsCharts({ countries, cities, genderAge }: DemographicsChartsProps) {
  const hasValues = (data?: Record<string, number>) =>
    !!data && Object.values(data).some((value) => Number(value) > 0);

  const hasDemographics = hasValues(countries) || hasValues(cities) || hasValues(genderAge);

  if (!hasDemographics) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">視聴者属性</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="属性データ未取得"
              description="フォロワー数が100人未満、またはデータ収集中です。"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const ageGenderData = buildAgeGenderData(genderAge);
  const topCountries = getTopEntries(countries);
  const topCities = getTopEntries(cities);

  const hasAgeGender = ageGenderData.length > 0;
  const hasGeo = topCountries.length > 0 || topCities.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">年齢・性別分布</CardTitle>
          <p className="text-sm text-muted-foreground">
            コア視聴者の構成比を把握します。
          </p>
        </CardHeader>
        <CardContent>
          {!hasAgeGender ? (
            <p className="text-sm text-muted-foreground">
              まだデモグラフィックデータがありません。
            </p>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageGenderData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="age" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={30} />
                  <Tooltip
                    formatter={(value) => value}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "none",
                      boxShadow: "0 12px 30px rgba(15,23,42,0.12)"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="female" stackId="a" name="女性" fill="#f472b6" />
                  <Bar dataKey="male" stackId="a" name="男性" fill="#60a5fa" />
                  <Bar dataKey="unknown" stackId="a" name="その他" fill="#cbd5f5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">国・都市ランキング</CardTitle>
          <p className="text-sm text-muted-foreground">
            主要地域を上位5件で表示します。
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasGeo ? (
            <p className="text-sm text-muted-foreground">
              地域データがまだありません。
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">上位 国</p>
                {topCountries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    国別データがありません。
                  </p>
                ) : (
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topCountries}
                        layout="vertical"
                        margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="label"
                          tick={{ fontSize: 11 }}
                          width={60}
                        />
                        <Tooltip
                          formatter={(value) => value}
                          contentStyle={{
                            borderRadius: "10px",
                            border: "none",
                            boxShadow: "0 12px 30px rgba(15,23,42,0.12)"
                          }}
                        />
                        <Bar dataKey="value" fill="#38bdf8" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">上位 都市</p>
                {topCities.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    都市データがありません。
                  </p>
                ) : (
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topCities}
                        layout="vertical"
                        margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="label"
                          tick={{ fontSize: 11 }}
                          width={80}
                        />
                        <Tooltip
                          formatter={(value) => value}
                          contentStyle={{
                            borderRadius: "10px",
                            border: "none",
                            boxShadow: "0 12px 30px rgba(15,23,42,0.12)"
                          }}
                        />
                        <Bar dataKey="value" fill="#818cf8" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
