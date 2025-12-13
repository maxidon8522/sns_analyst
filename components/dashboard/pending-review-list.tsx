'use client';

import { useEffect, useState } from 'react';
import { differenceInDays } from 'date-fns';
import { ClipboardList, PencilLine } from 'lucide-react';

import { getBrowserSupabaseClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(initialFormState);

  const fetchPendingVideos = async () => {
    setLoading(true);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    try {
      const supabase = getBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('videos')
        .select('id, caption, posted_at, thumbnail_url')
        .lt('posted_at', fiveDaysAgo.toISOString())
        .eq('manual_input_done', false)
        .order('posted_at', { ascending: false });

      if (error) {
        console.error('Pending List Error:', error);
      }

      if (data) {
        setVideos(data);
      }
    } catch (err) {
      console.error('Pending List Error:', err);
    } finally {
      setLoading(false);
    }
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

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.from('videos').update(payload).eq('id', id);

      if (!error) {
        setEditingId(null);
        setFormData(initialFormState);
        void fetchPendingVideos();
      } else {
        console.error('Pending Submit Error:', error);
      }
    } catch (err) {
      console.error('Pending Submit Error:', err);
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
      <CardHeader className="space-y-4">
        <CardTitle className="flex flex-col gap-2 text-orange-700 md:flex-row md:items-center">
          <span className="flex items-center gap-2 text-base font-semibold">
            📝 振り返り入力待ち ({videos.length}件)
          </span>
          <span className="text-sm font-normal text-gray-600">
            投稿5日後以降の動画だけが表示されます。
          </span>
        </CardTitle>
        <Alert className="border-orange-200 bg-white/90">
          <AlertTitle className="flex items-center gap-2 text-sm font-semibold text-orange-700">
            <ClipboardList className="h-4 w-4" />
            手動入力ガイド
          </AlertTitle>
          <AlertDescription className="text-xs text-gray-600">
            ① 一覧の「インサイトを入力」ボタンを押す → ② リーチ/シェア/プロフィールアクセス/フォロー数を入力 → ③
            「保存して完了」で登録されます。
          </AlertDescription>
        </Alert>
      </CardHeader>
      <CardContent className="space-y-5">
        {videos.map((video) => {
          const isEditing = editingId === video.id;
          return (
            <div
              key={video.id}
              className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex flex-1 gap-4">
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
                  <div className="space-y-2 text-sm">
                    <p className="line-clamp-2 font-semibold text-gray-800">
                      {video.caption ?? 'キャプション未設定'}
                    </p>
                    {video.posted_at ? (
                      <p className="text-xs text-gray-500">
                        投稿日: {new Date(video.posted_at).toLocaleDateString()} (
                        {differenceInDays(new Date(), new Date(video.posted_at))}日前)
                      </p>
                    ) : null}
                  </div>
                </div>
                {!isEditing && (
                  <div className="flex w-full flex-col gap-2 text-sm md:w-64">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-600">
                      <ClipboardList className="h-4 w-4" />
                      入力待ち
                    </p>
                    <p className="text-xs text-gray-500">
                      Instagramアプリのインサイトを確認して、4つの指標を入力してください。
                    </p>
                    <Button className="w-full gap-2" onClick={() => handleEdit(video)}>
                      <PencilLine className="h-4 w-4" />
                      インサイトを入力
                    </Button>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="mt-4 animate-in fade-in rounded-lg border border-dashed border-orange-200 bg-orange-50/60 p-4">
                  <p className="mb-3 text-sm font-semibold text-orange-700">
                    Step 2. 指標を入力
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
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
                  </div>
                  <div className="mt-4 flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-end">
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
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
