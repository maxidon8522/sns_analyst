-- Meta OAuth connections per user.

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

drop policy if exists "Users can view own meta connections" on public.meta_connections;
create policy "Users can view own meta connections"
  on public.meta_connections
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own meta connections" on public.meta_connections;
create policy "Users can insert own meta connections"
  on public.meta_connections
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own meta connections" on public.meta_connections;
create policy "Users can update own meta connections"
  on public.meta_connections
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own meta connections" on public.meta_connections;
create policy "Users can delete own meta connections"
  on public.meta_connections
  for delete
  using (auth.uid() = user_id);
