"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrowserSupabaseClient } from "@/utils/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ type: "error" | "success"; text: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        router.replace("/analysis");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      if (!data.session) {
        setStatus({
          type: "success",
          text: "確認メールを送信しました。メール内のリンクで認証してください。",
        });
        return;
      }

      router.replace("/analysis");
    } catch (err: any) {
      setStatus({
        type: "error",
        text: err?.message ?? "認証に失敗しました。",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "signin" ? "ログイン" : "新規登録"}</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "メールアドレスとパスワードでログインします。"
              : "アカウントを作成して分析にアクセスします。"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <Alert variant={status.type === "error" ? "destructive" : "default"}>
              <AlertTitle>{status.type === "error" ? "エラー" : "完了"}</AlertTitle>
              <AlertDescription>{status.text}</AlertDescription>
            </Alert>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "処理中..." : mode === "signin" ? "ログイン" : "新規登録"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-between">
          <Button
            type="button"
            variant="ghost"
            className="px-0 text-sm"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setStatus(null);
            }}
          >
            {mode === "signin" ? "新規登録はこちら" : "ログインはこちら"}
          </Button>
          <span className="text-xs text-slate-400">
            パスワードは8文字以上
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
