"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { InstagramMedia } from "@/lib/instagram";
import { useAuth } from "@/components/auth/auth-provider";
import { AnalysisTagsForm } from "@/components/forms/analysis-tags-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AnalysisSubmitPayload = {
  ig_media_id: string;
  tags: Record<string, unknown>;
  score: number;
};

type NewAnalysisClientProps = {
  igMediaId: string;
};

export default function NewAnalysisClient({ igMediaId }: NewAnalysisClientProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [post, setPost] = useState<InstagramMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!igMediaId) {
      router.replace("/instagram");
      return;
    }
    if (!session?.access_token) return;

    const loadPost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/instagram/fetch-posts?media_id=${igMediaId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error ?? "投稿の取得に失敗しました。");
        }
        setPost(body);
      } catch (err: any) {
        setError(err?.message ?? "投稿の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    void loadPost();
  }, [igMediaId, router, session?.access_token]);

  const handleSubmit = async (values: any) => {
    if (!session?.access_token) return;
    setSaving(true);
    setError(null);

    try {
      const { self_score, ...analysisTags } = values;
      const payload: AnalysisSubmitPayload = {
        ig_media_id: igMediaId,
        tags: analysisTags,
        score: Number(self_score ?? 0),
      };

      const res = await fetch("/api/videos/save-analysis", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? "保存に失敗しました。");
      }
      router.push("/instagram?created=true");
    } catch (err: any) {
      setError(err?.message ?? "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container p-6">
        <div className="rounded-md bg-slate-50 p-4 text-slate-500">
          読み込み中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-6">
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container p-6">
        <Alert variant="destructive">
          <AlertTitle>投稿が見つかりません</AlertTitle>
          <AlertDescription>投稿情報が取得できませんでした。</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">動画の分析・タグ付け</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                対象の投稿
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-black/5">
                <div className="flex flex-col items-center text-gray-400">
                  <span className="mb-2 text-4xl">
                    {post.media_type === "VIDEO" || post.media_type === "REELS"
                      ? "🎥"
                      : "📷"}
                  </span>
                  <span className="text-xs">{post.media_type}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">❤️ {post.like_count}</Badge>
                  <Badge variant="outline">💬 {post.comments_count}</Badge>
                  <Badge variant="outline">👀 {post.insights?.views ?? "-"}</Badge>
                  <Badge variant="outline">🔖 {post.insights?.saved ?? "-"}</Badge>
                </div>
                <p className="line-clamp-4 rounded-md bg-gray-50 p-3 text-sm text-gray-600">
                  {post.caption}
                </p>
                <div className="text-right text-xs text-muted-foreground">
                  投稿日: {new Date(post.timestamp).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>分析データを入力</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisTagsForm
                igMediaId={igMediaId}
                onSubmit={handleSubmit}
                submitLabel={saving ? "保存中..." : "保存する"}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
