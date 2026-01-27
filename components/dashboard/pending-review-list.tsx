"use client";

import { useEffect, useState } from "react";
import { useBrowserSupabaseClient } from "@/hooks/use-supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/auth-provider";

type Video = {
  id: string;
  caption: string;
  posted_at: string;
  thumbnail_url: string;
  media_url?: string;
  manual_input_done: boolean;
};

export function PendingReviewList() {
  const supabase = useBrowserSupabaseClient();
  const { user, session } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    reach: "",
    shares: "",
    profile_visits: "",
    follows: ""
  });

  useEffect(() => {
    if (!supabase || !user) return;
    void fetchAllVideos();
  }, [supabase, user]);

  const fetchAllVideos = async () => {
    if (!supabase || !user) return;
    const { data } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", user.id)
      .order("posted_at", { ascending: false })
      .limit(5);

    if (data) setVideos(data as Video[]);
    setLoading(false);
  };

  const handleSubmit = async (id: string) => {
    try {
      console.log("Saving data for:", id);
      const payload = {
        reach: Number(formData.reach || 0),
        shares: Number(formData.shares || 0),
        profile_visits: Number(formData.profile_visits || 0),
        follows: Number(formData.follows || 0)
      };

      const response = await fetch("/api/manual-metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ id, ...payload })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? "Unknown error");
      }

      alert("✅ 保存しました！");
      setEditingId(null);
      setFormData({ reach: "", shares: "", profile_visits: "", follows: "" });
      void fetchAllVideos();
    } catch (err: any) {
      console.error("Save Error:", err);
      alert(`保存に失敗しました。\nエラー内容: ${err.message}`);
    }
  };

  return (
    <Card className="mb-8 border-slate-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>📝 手動データ入力（強制表示モード）</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <p>読み込み中...</p>}
        {!loading && videos.length === 0 && <p>動画データが見つかりません。</p>}
        
        {videos.map((video) => {
          const thumbnailSrc = video.thumbnail_url || video.media_url;

          return (
            <div key={video.id} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex gap-4 items-center mb-4">
               <div className="w-16 h-16 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                  {thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs">No Image</div>
                  )}
               </div>
               <div className="flex-1">
                 <p className="text-sm font-bold text-slate-800 line-clamp-1">
                   {video.caption || "キャプションなし"}
                 </p>
                 <p className="text-xs text-slate-400">{new Date(video.posted_at).toLocaleDateString()}</p>
               </div>
               {video.manual_input_done && (
                 <span className="text-xs font-semibold text-emerald-600">入力済</span>
               )}
            </div>

            {editingId === video.id ? (
              <div className="grid grid-cols-2 gap-2 animate-in fade-in">
                <div>
                  <Label className="text-xs">リーチ</Label>
                  <Input type="number" value={formData.reach} onChange={e => setFormData({...formData, reach: e.target.value})} />
                </div>
                <div>
                  <Label className="text-xs">シェア</Label>
                  <Input type="number" value={formData.shares} onChange={e => setFormData({...formData, shares: e.target.value})} />
                </div>
                <div>
                  <Label className="text-xs">プロフ</Label>
                  <Input type="number" value={formData.profile_visits} onChange={e => setFormData({...formData, profile_visits: e.target.value})} />
                </div>
                <div>
                  <Label className="text-xs">フォロー</Label>
                  <Input type="number" value={formData.follows} onChange={e => setFormData({...formData, follows: e.target.value})} />
                </div>
                <div className="col-span-2 flex gap-2 mt-2">
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                    className="w-full"
                  >
                    キャンセル
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => handleSubmit(video.id)}
                    className="w-full"
                  >
                    保存
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setEditingId(video.id)}
              >
                数値を入力する
              </Button>
            )}
          </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
