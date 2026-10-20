-- SiteCraft AI — Supabase / Postgres schema
-- Run in the Supabase SQL editor (Database → SQL). Safe to re-run.

create extension if not exists "pgcrypto";

-- ---------- users (mirrors auth.users; app-level profile + credits) ----------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free','professional','developer','business')),
  credits integer not null default 15,
  credits_reset_at timestamptz not null default (now() + interval '1 month'),
  created_at timestamptz not null default now()
);

-- ---------- projects ----------
create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  source_type text not null check (source_type in ('url','screenshot','describe')),
  source_url text,
  source_screenshot text,          -- Storage public URL (bucket "screenshots") or data URL
  description text,
  instructions text,
  mode text not null check (mode in ('multi','manual')),
  style text,
  status text not null default 'draft' check (status in ('draft','generating','ready','failed')),
  active_variant_id text,
  published_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects(user_id, updated_at desc);

-- ---------- variants ----------
create table if not exists public.variants (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  label text not null,
  style_key text not null,
  html text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists variants_project_idx on public.variants(project_id, created_at);

-- ---------- credit ledger ----------
create table if not exists public.credit_transactions (
  id text primary key default ('tx_' || gen_random_uuid()::text),
  user_id uuid not null references public.users(id) on delete cascade,
  delta integer not null,
  balance_after integer not null,
  reason text not null,
  ref_id text,
  created_at timestamptz not null default now()
);
create index if not exists credit_tx_user_idx on public.credit_transactions(user_id, created_at desc);

-- ---------- payments ----------
create table if not exists public.payments (
  id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null check (provider in ('razorpay','stripe','manual')),
  plan text not null,
  amount integer not null,
  currency text not null,
  status text not null default 'created' check (status in ('created','paid','failed')),
  provider_ref text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_user_idx on public.payments(user_id, created_at desc);

-- ---------- atomic credit spend (+ ledger) ----------
create or replace function public.spend_credits(p_user_id uuid, p_amount integer, p_reason text default 'generate', p_ref text default null)
returns setof public.users
language plpgsql
security definer
as $$
declare
  u public.users;
begin
  update public.users
     set credits = credits - p_amount
   where id = p_user_id and credits >= p_amount
  returning * into u;
  if not found then
    return;
  end if;
  insert into public.credit_transactions (user_id, delta, balance_after, reason, ref_id)
  values (p_user_id, -p_amount, u.credits, p_reason, p_ref);
  return next u;
end;
$$;

-- ---------- grant / set credits (+ ledger) ----------
create or replace function public.grant_credits(p_user_id uuid, p_amount integer, p_reason text default 'admin', p_ref text default null, p_set boolean default false)
returns setof public.users
language plpgsql
security definer
as $$
declare
  prev integer;
  u public.users;
begin
  select credits into prev from public.users where id = p_user_id for update;
  if prev is null then
    return;
  end if;
  update public.users
     set credits = case when p_set then p_amount else credits + p_amount end
   where id = p_user_id
  returning * into u;
  insert into public.credit_transactions (user_id, delta, balance_after, reason, ref_id)
  values (p_user_id, u.credits - prev, u.credits, p_reason, p_ref);
  return next u;
end;
$$;

-- ---------- Storage bucket for screenshots ----------
insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- ---------- Row Level Security ----------
-- The app talks to the DB with the service-role key from server routes only and
-- enforces ownership in code. RLS is enabled so the anon key can never read data.
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.variants enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.payments enable row level security;

drop policy if exists "users: self read" on public.users;
create policy "users: self read" on public.users for select using (auth.uid() = id);
drop policy if exists "projects: owner" on public.projects;
create policy "projects: owner" on public.projects for all using (auth.uid() = user_id);
drop policy if exists "variants: owner" on public.variants;
create policy "variants: owner" on public.variants for all
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists "credits: self read" on public.credit_transactions;
create policy "credits: self read" on public.credit_transactions for select using (auth.uid() = user_id);
drop policy if exists "payments: self read" on public.payments;
create policy "payments: self read" on public.payments for select using (auth.uid() = user_id);
