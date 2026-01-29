"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PromptGoalPrimary = "followers" | "reach" | "saves" | "profile_visits";
type PromptMode = "stable_growth" | "buzz" | "follow_focus";

const WINDOW_OPTIONS = [30, 60, 90] as const;
const GOAL_OPTIONS: { value: PromptGoalPrimary; label: string }[] = [
  { value: "followers", label: "フォロワー" },
  { value: "reach", label: "リーチ" },
  { value: "saves", label: "保存" },
  { value: "profile_visits", label: "プロフィール遷移" },
];
const MODE_OPTIONS: { value: PromptMode; label: string; description: string }[] = [
  { value: "stable_growth", label: "安定成長", description: "継続的に伸ばす" },
  { value: "buzz", label: "バズ狙い", description: "短期リーチを最大化" },
  { value: "follow_focus", label: "フォロー重視", description: "フォロワー獲得に集中" },
];

export default function AccountAdvisorPromptPage() {
  const { session, loading } = useAuth();
  const [windowDays, setWindowDays] = useState<number>(30);
  const [primary, setPrimary] = useState<PromptGoalPrimary>("followers");
  const [secondary, setSecondary] = useState<PromptGoalPrimary[]>([]);
  const [mode, setMode] = useState<PromptMode>("stable_growth");
  const [promptText, setPromptText] = useState("");
  const [accountJson, setAccountJson] = useState<Record<string, unknown> | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setSecondary((prev) => prev.filter((goal) => goal !== primary));
  }, [primary]);

  const jsonText = useMemo(
    () => (accountJson ? JSON.stringify(accountJson, null, 2) : ""),
    [accountJson],
  );

  const handleToggleSecondary = (goal: PromptGoalPrimary) => {
    setSecondary((prev) =>
      prev.includes(goal) ? prev.filter((item) => item !== goal) : [...prev, goal],
    );
  };

  const handleGenerate = async () => {
    if (!session?.access_token) {
      setError("ログインが必要です。");
      return;
    }

    setGenerating(true);
    setError(null);
    setCopied(null);

    try {
      const res = await fetch("/api/account/prompt-input", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          window_days: windowDays,
          primary,
          secondary,
          mode,
        }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? "プロンプト生成に失敗しました。");
      }

      setPromptText(body?.prompt_text ?? "");
      setAccountJson(body?.account_input_json ?? null);
      setWarnings(Array.isArray(body?.data_warnings) ? body.data_warnings : []);
    } catch (err: any) {
      setError(err?.message ?? "プロンプト生成に失敗しました。");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied("コピーに失敗しました");
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Account Advisor Prompt</h1>
          <p className="text-muted-foreground">
            DBの集約結果から、LLMに貼るだけのアドバイス用プロンプトを生成します。
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating || loading} className="gap-2">
          <Sparkles className="h-4 w-4" />
          {generating ? "生成中..." : "プロンプト生成"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">入力</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>対象期間</Label>
              <Select value={String(windowDays)} onValueChange={(value) => setWindowDays(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="期間を選択" />
                </SelectTrigger>
                <SelectContent>
                  {WINDOW_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}日
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>目標（primary）</Label>
              <Select value={primary} onValueChange={(value) => setPrimary(value as PromptGoalPrimary)}>
                <SelectTrigger>
                  <SelectValue placeholder="目標を選択" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>目標（secondary）</Label>
              <div className="grid gap-2">
                {GOAL_OPTIONS.map((option) => {
                  const disabled = option.value === primary;
                  const checked = secondary.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                        disabled ? "cursor-not-allowed border-slate-200 text-slate-400" : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        disabled={disabled}
                        checked={checked}
                        onChange={() => handleToggleSecondary(option.value)}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>分析モード</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as PromptMode)}>
                <SelectTrigger>
                  <SelectValue placeholder="モードを選択" />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">生成されたプロンプト</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="min-h-[320px] w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                readOnly
                value={promptText}
                placeholder="ここに生成されたプロンプトが表示されます。"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={!promptText}
                  onClick={() => copyToClipboard(promptText, "全文をコピーしました")}
                >
                  コピー
                </Button>
                <Button
                  variant="secondary"
                  disabled={!jsonText}
                  onClick={() => copyToClipboard(jsonText, "JSONをコピーしました")}
                >
                  JSONだけコピー
                </Button>
                {copied && <span className="text-sm text-green-600">{copied}</span>}
              </div>
            </CardContent>
          </Card>

          {warnings.length > 0 && (
            <Alert>
              <AlertTitle>data_warnings</AlertTitle>
              <AlertDescription className="space-y-1">
                {warnings.map((warning, index) => (
                  <div key={`${warning}-${index}`}>- {warning}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
