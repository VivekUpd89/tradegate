create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key,
  email text unique,
  display_name text,
  tradingview_webhook_token text unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now()
);

create table if not exists strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  slug text not null,
  name text not null,
  style text not null,
  market text not null,
  timeframe text not null,
  checklist jsonb not null default '[]'::jsonb,
  forbidden jsonb not null default '[]'::jsonb,
  min_risk_reward numeric not null default 1.5,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique(user_id, slug)
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  strategy_id uuid references strategies(id) on delete set null,
  strategy_slug text,
  symbol text not null,
  direction text not null,
  entry_price numeric not null,
  stop_loss numeric not null,
  target_price numeric not null,
  thesis text not null,
  market_context text not null,
  emotions jsonb not null default '[]'::jsonb,
  confidence int not null default 50,
  verdict text not null,
  risk_reward numeric not null,
  discipline_score int not null,
  clarity_score int not null,
  warnings jsonb not null default '[]'::jsonb,
  critical_questions jsonb not null default '[]'::jsonb,
  checklist_hits jsonb not null default '[]'::jsonb,
  checklist_misses jsonb not null default '[]'::jsonb,
  guardrails jsonb not null default '[]'::jsonb,
  checklist_score int not null default 0,
  execution_readiness int not null default 0,
  override_reason text,
  override_executed boolean not null default false,
  summary text not null,
  outcome text,
  journal_note text,
  source text default 'manual',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table strategies enable row level security;
alter table reviews enable row level security;

create policy "profiles_select_own" on profiles
for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
for update using (auth.uid() = id);

create policy "strategies_select_own" on strategies
for select using (auth.uid() = user_id);

create policy "strategies_insert_own" on strategies
for insert with check (auth.uid() = user_id);

create policy "strategies_update_own" on strategies
for update using (auth.uid() = user_id);

create policy "strategies_delete_own" on strategies
for delete using (auth.uid() = user_id);

create policy "reviews_select_own" on reviews
for select using (auth.uid() = user_id);

create policy "reviews_insert_own" on reviews
for insert with check (auth.uid() = user_id);

create policy "reviews_update_own" on reviews
for update using (auth.uid() = user_id);

create policy "reviews_delete_own" on reviews
for delete using (auth.uid() = user_id);
