"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type MetaConnection = {
  provider: string;
  instagram_user_id: string | null;
  page_id: string | null;
  page_name: string | null;
  created_at: string | null;
  expires_at: string | null;
};

export default function SettingsPage() {
  const { user, loading, signOut, session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<MetaConnection | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        ログインが必要です。
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const fetchConnection = async () => {
    if (!session?.access_token) return;
    setConnectionLoading(true);
    setConnectionError(null);

    try {
      const res = await fetch("/api/meta/connection", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? "接続情報の取得に失敗しました。");
      }
      setConnection(body?.connection ?? null);
    } catch (err: any) {
      setConnectionError(err?.message ?? "接続情報の取得に失敗しました。");
    } finally {
      setConnectionLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.access_token) {
      setConnectionLoading(false);
      return;
    }
    void fetchConnection();
  }, [session?.access_token]);

  const handleConnect = async () => {
    if (!session?.access_token) return;

    const res = await fetch("/api/meta/oauth/start", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.url) {
      setConnectionError(body?.error ?? "OAuth開始に失敗しました。");
      return;
    }

    window.location.href = body.url as string;
  };

  const handleDisconnect = async () => {
    if (!session?.access_token) return;
    const res = await fetch("/api/meta/connection", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setConnectionError(body?.error ?? "連携解除に失敗しました。");
      return;
    }
    setConnection(null);
  };

  const metaStatus = searchParams.get("meta");
  const metaReason = searchParams.get("reason");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>アカウント</CardTitle>
          <CardDescription>ログイン中のユーザー情報です。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <div>
            <span className="text-slate-400">メール:</span>{" "}
            <span className="font-medium text-slate-800">{user.email}</span>
          </div>
          <div>
            <span className="text-slate-400">ユーザーID:</span>{" "}
            <span className="font-mono text-xs">{user.id}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleSignOut}>
            ログアウト
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meta API 連携</CardTitle>
          <CardDescription>
            Instagramアカウントを接続して分析データを取得します。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          {metaStatus === "success" && (
            <Alert>
              <AlertTitle>連携完了</AlertTitle>
              <AlertDescription>Metaアカウントの連携が完了しました。</AlertDescription>
            </Alert>
          )}
          {metaStatus === "error" && (
            <Alert variant="destructive">
              <AlertTitle>連携エラー</AlertTitle>
              <AlertDescription>
                連携に失敗しました。{metaReason ? `(${metaReason})` : ""}
              </AlertDescription>
            </Alert>
          )}
          {connectionError && (
            <Alert variant="destructive">
              <AlertTitle>取得エラー</AlertTitle>
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}
          {connectionLoading ? (
            <p>接続状態を確認中...</p>
          ) : connection ? (
            <div className="space-y-2">
              <div>
                <span className="text-slate-400">接続中のページ:</span>{" "}
                <span className="font-medium text-slate-800">
                  {connection.page_name ?? "不明"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Instagram ID:</span>{" "}
                <span className="font-mono text-xs">
                  {connection.instagram_user_id ?? "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">有効期限:</span>{" "}
                <span className="font-medium text-slate-800">
                  {connection.expires_at
                    ? new Date(connection.expires_at).toLocaleDateString()
                    : "不明"}
                </span>
              </div>
            </div>
          ) : (
            <p>まだ連携がありません。接続して開始してください。</p>
          )}
        </CardContent>
        <CardFooter>
          {connection ? (
            <Button variant="outline" onClick={handleDisconnect}>
              連携を解除する
            </Button>
          ) : (
            <Button onClick={handleConnect}>Meta連携を開始する</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
