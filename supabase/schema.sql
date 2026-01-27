-- Enable UUIDs
create extension if not exists "pgcrypto";

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ig_media_id text not null,
  permalink text,
  thumbnail_url text,
  media_url text,
  caption text,
  posted_at timestamptz,
  analysis_tags jsonb,
  self_score int check (self_score between 0 and 100),
  reach int,
  shares int,
  profile_visits int,
  follows int,
  manual_input_done boolean default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint videos_user_ig_media_id_key unique (user_id, ig_media_id),
  constraint videos_analysis_tags_json check (
    analysis_tags is null or jsonb_typeof(analysis_tags) = 'object'
  )
);

create index if not exists videos_user_id_idx
  on public.videos (user_id);

create table if not exists public.metrics_logs (
  id bigserial primary key,
  video_id uuid not null references public.videos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  fetched_at timestamptz not null default timezone('utc', now()),
  views int default 0,
  likes int default 0,
  saves int default 0,
  comments int default 0
);

create index if not exists metrics_logs_video_id_idx
  on public.metrics_logs (video_id);

create index if not exists metrics_logs_user_id_idx
  on public.metrics_logs (user_id);

create index if not exists metrics_logs_fetched_at_idx
  on public.metrics_logs (fetched_at);

create table if not exists public.account_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  followers_count int,
  profile_views int,
  website_clicks int,
  reach_daily int,
  impressions_daily int,
  online_peak_hour int,
  audience_data jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint account_insights_user_date_key unique (user_id, date)
);

create index if not exists account_insights_user_id_idx
  on public.account_insights (user_id);

alter table public.videos enable row level security;
alter table public.metrics_logs enable row level security;
alter table public.account_insights enable row level security;

create policy "Users can view own videos"
  on public.videos
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own videos"
  on public.videos
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own videos"
  on public.videos
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own videos"
  on public.videos
  for delete
  using (auth.uid() = user_id);

create policy "Users can view own metrics logs"
  on public.metrics_logs
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own metrics logs"
  on public.metrics_logs
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own metrics logs"
  on public.metrics_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own metrics logs"
  on public.metrics_logs
  for delete
  using (auth.uid() = user_id);

create policy "Users can view own account insights"
  on public.account_insights
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own account insights"
  on public.account_insights
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own account insights"
  on public.account_insights
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own account insights"
  on public.account_insights
  for delete
  using (auth.uid() = user_id);

create table if not exists public.meta_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  access_token text not null,
  token_type text,
  expires_at timestamptz,
  scopes text[],
  meta_user_id text,
  instagram_user_id text,
  page_id text,
  page_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint meta_connections_user_provider_key unique (user_id, provider)
);

alter table public.meta_connections enable row level security;

create policy "Users can view own meta connections"
  on public.meta_connections
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own meta connections"
  on public.meta_connections
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own meta connections"
  on public.meta_connections
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own meta connections"
  on public.meta_connections
  for delete
  using (auth.uid() = user_id);
