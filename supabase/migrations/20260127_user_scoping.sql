-- Add per-user scoping for videos, metrics_logs, and account_insights.
-- Run in Supabase SQL editor. Backfill user_id before making it NOT NULL.

alter table public.videos
  add column if not exists user_id uuid;

alter table public.videos
  drop constraint if exists videos_ig_media_id_key;

alter table public.videos
  add constraint videos_user_ig_media_id_key unique (user_id, ig_media_id);

create index if not exists videos_user_id_idx
  on public.videos (user_id);

alter table public.metrics_logs
  add column if not exists user_id uuid;

alter table public.metrics_logs
  drop constraint if exists metrics_logs_user_id_fkey;

alter table public.metrics_logs
  add constraint metrics_logs_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

create index if not exists metrics_logs_user_id_idx
  on public.metrics_logs (user_id);

alter table public.account_insights
  add column if not exists user_id uuid;

alter table public.account_insights
  drop constraint if exists account_insights_date_key;

alter table public.account_insights
  add constraint account_insights_user_date_key unique (user_id, date);

create index if not exists account_insights_user_id_idx
  on public.account_insights (user_id);

alter table public.videos enable row level security;
alter table public.metrics_logs enable row level security;
alter table public.account_insights enable row level security;

drop policy if exists "Users can view own videos" on public.videos;
create policy "Users can view own videos"
  on public.videos for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own videos" on public.videos;
create policy "Users can insert own videos"
  on public.videos for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own videos" on public.videos;
create policy "Users can update own videos"
  on public.videos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own videos" on public.videos;
create policy "Users can delete own videos"
  on public.videos for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own metrics logs" on public.metrics_logs;
create policy "Users can view own metrics logs"
  on public.metrics_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own metrics logs" on public.metrics_logs;
create policy "Users can insert own metrics logs"
  on public.metrics_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own metrics logs" on public.metrics_logs;
create policy "Users can update own metrics logs"
  on public.metrics_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own metrics logs" on public.metrics_logs;
create policy "Users can delete own metrics logs"
  on public.metrics_logs for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own account insights" on public.account_insights;
create policy "Users can view own account insights"
  on public.account_insights for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own account insights" on public.account_insights;
create policy "Users can insert own account insights"
  on public.account_insights for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own account insights" on public.account_insights;
create policy "Users can update own account insights"
  on public.account_insights for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own account insights" on public.account_insights;
create policy "Users can delete own account insights"
  on public.account_insights for delete
  using (auth.uid() = user_id);

-- Optional: after backfilling user_id, enforce NOT NULL
-- alter table public.videos alter column user_id set not null;
-- alter table public.metrics_logs alter column user_id set not null;
-- alter table public.account_insights alter column user_id set not null;
