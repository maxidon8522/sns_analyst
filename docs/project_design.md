# Instagram Vlog Analytics Tool - Project Design Document

## 1. Project Overview
Instagramの留学Vlogアカウント運用を最適化するための分析ツール。
投稿時の「定性データ（25項目のタグ）」と、API経由で取得した「定量データ（再生数等の推移）」を統合し、データに基づいたPDCAを回す。

## 2. Tech Stack
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Visualization**: Recharts
- **Hosting**: Vercel
- **Automation**: GitHub Actions (for scheduling data fetch every 3 hours)
- **External API**: Instagram Graph API

## 3. Database Schema

### Table: `videos`
投稿動画のマスタデータ。
- `id` (uuid, pk)
- `ig_media_id` (text, unique): Instagram Media ID
- `permalink` (text): URL
- `thumbnail_url` (text)
- `caption` (text)
- `posted_at` (timestamp)
- `analysis_tags` (jsonb): ユーザー入力の25項目（後述）
- `self_score` (int): 自己採点 (0-100)
- `created_at` (timestamp)

### Table: `metrics_logs`
時系列のパフォーマンスデータ。
- `id` (bigint, pk)
- `video_id` (uuid, fk -> videos.id)
- `fetched_at` (timestamp): 取得日時
- `views` (int)
- `likes` (int)
- `saves` (int)
- `comments` (int)

## 4. Analysis Tags (JSON Structure for `analysis_tags`)
以下のJSON構造を厳守すること。

```json
{
  "basic": {
    "time_slot": "string (early_morning, morning, lunch, etc)",
    "length": "string (short, medium, long, extra_long)",
    "thumbnail_type": "string (none, face, text, emo)",
    "sound_type": "string (trend, chill, auto_voice, my_voice, asmr)"
  },
  "content": {
    "location": "string (room, school, cafe, city, trip)",
    "action": "string (study, eat, play, routine, talk, shopping)",
    "companion": "string (solo, local_friend, jp_friend, none)",
    "language_element": "string (jp_only, foreign_practice, none)",
    "reality_level": "string (perfect, natural, real)",
    "mood": "string (happy, calm, tired, emo)",
    "info_density": "string (high, medium, low)"
  },
  "editing": {
    "hook_visual": "string (impact, beauty, mystery, normal)",
    "hook_text": "string (question, conclusion, emotion, none)",
    "structure": "string (time, list, reason, montage)",
    "tempo": "string (fast, normal, slow)",
    "telop_amount": "string (full, point, none)",
    "filter": "string (bright, dark, raw)",
    "ending": "string (happy, bad, question, none)"
  },
  "strategy": {
    "caption_style": "string (diary, info, short)",
    "target": "string (new, existing, fan)",
    "cta": "boolean",
    "origin": "string (original, trend, copy)",
    "cost": "string (high, medium, low)",
    "purpose": "string (view, save, comment)"
  }
}
5. Key Features
Input Form: 25項目のタグを入力するUI。タブ切り替えなどで入力しやすくする。

Dashboard:

動画一覧（サムネ、投稿日、現在の保存数）。

詳細ページ：各動画のタグ情報表示。

Visualization:

Time-series Chart: 投稿後経過時間（X軸）と保存数（Y軸）の推移グラフ。複数の動画を重ねて比較可能にする。

Auto Fetch:

Instagram APIを叩いて最新のmetricsを取得し、metrics_logsに保存するAPI Route。

