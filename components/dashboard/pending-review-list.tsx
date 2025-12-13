'use client';

import { useEffect, useMemo, useState } from 'react';
import { differenceInDays } from 'date-fns';

import { getBrowserSupabaseClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Video = {
  id: string;
  caption: string | null;
  posted_at: string | null;
  thumbnail_url: string | null;
};

type FormState = {
  reach: string;
  shares: string;
  profile_visits: string;
  follows: string;
};

const initialFormState: FormState = {
  reach: '',
  shares: '',
  profile_visits: '',
  follows: '',
};

export function PendingReviewList() {
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(initialFormState);

  const fetchPendingVideos = async () => {
    // ★修正: テスト用に「5日前」の制限を一時的にコメントアウトして無効化します
    setLoading(true);
    // const fiveDaysAgo = new Date();
    // fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const { data, error } = await supabase
      .from('videos')
      .select('id, caption, posted_at, thumbnail_url')
      // .lt('posted_at', fiveDaysAgo.toISOString())
      .eq('manual_input_done', false)
      .order('posted_at', { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchPendingVideos();
  }, []);

  const handleEdit = (video: Video) => {
    setEditingId(video.id);
    setFormData(initialFormState);
  };

  const handleSubmit = async (id: string) => {
    const payload = {
      reach: Number(formData.reach) || 0,
      shares: Number(formData.shares) || 0,
      profile_visits: Number(formData.profile_visits) || 0,
      follows: Number(formData.follows) || 0,
      manual_input_done: true,
    };

    const { error } = await supabase.from('videos').update(payload).eq('id', id);

    if (!error) {
      setEditingId(null);
      setFormData(initialFormState);
      void fetchPendingVideos();
    }
  };

  if (loading) {
    return <div>確認中...</div>;
  }

  if (!videos.length) {
    return null;
  }

  return (
    <Card className="mb-8 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          📝 振り返り入力待ち ({videos.length}件)
          <span className="text-sm font-normal text-gray-600">
            投稿から5日経過しました。インサイトの結果を入力してください。
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {videos.map((video) => (
          <div key={video.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-start gap-4">
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                {video.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div>
                <p className="line-clamp-2 text-sm font-bold">
                  {video.caption ?? 'キャプション未設定'}
                </p>
                {video.posted_at ? (
                  <p className="mt-1 text-xs text-gray-500">
                    投稿日: {new Date(video.posted_at).toLocaleDateString()} (
                    {differenceInDays(new Date(), new Date(video.posted_at))}日前)
                  </p>
                ) : null}
              </div>
            </div>

            {editingId === video.id ? (
              <div className="grid animate-in fade-in gap-4 md:grid-cols-4">
                {([
                  { key: 'reach', label: 'リーチ数', placeholder: '例: 1200' },
                  { key: 'shares', label: 'シェア数', placeholder: '例: 5' },
                  { key: 'profile_visits', label: 'プロフアクセス', placeholder: '例: 12' },
                  { key: 'follows', label: 'フォロー数', placeholder: '例: 2' },
                ] as const).map((field) => (
                  <div key={field.key} className="flex flex-col gap-1">
                    <Label htmlFor={`${video.id}-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`${video.id}-${field.key}`}
                      type="number"
                      placeholder={field.placeholder}
                      value={formData[field.key]}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          [field.key]: event.target.value,
                        })
                      }
                    />
                  </div>
                ))}
                <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null);
                      setFormData(initialFormState);
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button onClick={() => handleSubmit(video.id)}>保存して完了</Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => handleEdit(video)}
              >
                結果を入力する
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
