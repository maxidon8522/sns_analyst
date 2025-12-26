"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { InstagramMedia } from "@/lib/instagram";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function InstagramPage() {
  const [posts, setPosts] = useState<InstagramMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPosts() {
      try {
        console.log("Fetching posts from API...");
        const res = await fetch("/api/instagram/fetch-posts");

        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();
        console.log("Frontend received data:", data);

        if (Array.isArray(data)) {
          setPosts(data);
        } else if (data.data && Array.isArray(data.data)) {
          setPosts(data.data);
        } else {
          console.warn("Unexpected data format:", data);
          setPosts([]);
        }
      } catch (err) {
        console.error(err);
        setError("データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Instagram投稿の取り込み</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Instagram投稿の取り込み</h1>
        <div className="flex gap-2">
          <Button asChild variant="default" className="gap-2">
            <Link href="/analysis">
              <BarChart3 className="h-4 w-4" />
              分析レポートを見る
            </Link>
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            再読み込み
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground">
        最新のInstagram投稿を取得して、分析タグを付ける動画を選択してください。
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && posts.length === 0 && (
        <Alert>
          <AlertTitle>投稿が見つかりません</AlertTitle>
          <AlertDescription>
            Instagramに最新の投稿があるか確認し、再度取得してください。
            <br />
            (APIからは0件が返ってきています)
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const isVideo = post.media_type === "VIDEO" || post.media_type === "REELS";
          const imageSrc = post.thumbnail_url || post.media_url;

          return (
            <Card key={post.id} className="flex flex-col">
              <CardHeader>
                <div className="relative mb-2 aspect-video overflow-hidden rounded-md bg-black/10">
                  {imageSrc ? (
                    <>
                      <img
                        src={imageSrc}
                        alt={post.caption || "Instagram post"}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      {isVideo && (
                        <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                          🎥 Video
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                      {isVideo ? "🎥 Video" : "📷 Image"}
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary">{post.media_type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="line-clamp-3 text-sm text-gray-700">
                  {post.caption || "キャプションなし"}
                </p>
                <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                  <span>❤️ {post.like_count}</span>
                  <span>💬 {post.comments_count}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/videos/new?ig_media_id=${post.id}`}>
                    この投稿を分析する
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
