-- Enable UUIDs
create extension if not exists "pgcrypto";

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  ig_media_id text not null,
  permalink text,
  thumbnail_url text,
  caption text,
  posted_at timestamptz,
  analysis_tags jsonb,
  self_score int check (self_score between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  constraint videos_ig_media_id_key unique (ig_media_id),
  constraint videos_analysis_tags_json check (
    analysis_tags is null or jsonb_typeof(analysis_tags) = 'object'
  )
);

create table if not exists public.metrics_logs (
  id bigserial primary key,
  video_id uuid not null references public.videos (id) on delete cascade,
  fetched_at timestamptz not null default timezone('utc', now()),
  views int default 0,
  likes int default 0,
  saves int default 0,
  comments int default 0
);

create index if not exists metrics_logs_video_id_idx
  on public.metrics_logs (video_id);

create index if not exists metrics_logs_fetched_at_idx
  on public.metrics_logs (fetched_at);
