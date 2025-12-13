"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Video = {
  id: string;
  caption: string;
  posted_at: string;
  thumbnail_url: string;
  manual_input_done: boolean;
};

export function PendingReviewList() {
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
    void fetchAllVideos();
  }, []);

  const fetchAllVideos = async () => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .order("posted_at", { ascending: false })
      .limit(5);

    if (data) setVideos(data as Video[]);
    setLoading(false);
  };

  const handleSubmit = async (id: string) => {
    const { error } = await supabase
      .from("videos")
      .update({
        reach: Number(formData.reach),
        shares: Number(formData.shares),
        profile_visits: Number(formData.profile_visits),
        follows: Number(formData.follows),
        manual_input_done: true
      })
      .eq("id", id);

    if (!error) {
      alert("保存しました！");
      setEditingId(null);
      setFormData({ reach: "", shares: "", profile_visits: "", follows: "" });
      void fetchAllVideos();
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50 mb-8">
      <CardHeader>
        <CardTitle className="text-orange-700">
          📝 手動データ入力（強制表示モード）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <p>読み込み中...</p>}
        {!loading && videos.length === 0 && <p>動画データが見つかりません。</p>}
        
        {videos.map((video) => (
          <div key={video.id} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex gap-4 items-center mb-4">
               <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs">No Image</div>
                  )}
               </div>
               <div className="flex-1">
                 <p className="text-sm font-bold line-clamp-1">{video.caption || "キャプションなし"}</p>
                 <p className="text-xs text-gray-500">{new Date(video.posted_at).toLocaleDateString()}</p>
               </div>
               {video.manual_input_done && <span className="text-xs text-green-600 font-bold">入力済</span>}
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
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="w-full">キャンセル</Button>
                  <Button size="sm" onClick={() => handleSubmit(video.id)} className="w-full">保存</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="w-full" onClick={() => setEditingId(video.id)}>
                数値を入力する
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
