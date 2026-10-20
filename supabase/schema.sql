-- SiteCraft AI — Supabase schema
-- Run this in the Supabase SQL editor (Database → SQL) for a new project.

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
  source_screenshot text,          -- data URL (consider moving to Storage for scale)
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

-- ---------- atomic credit spend ----------
create or replace function public.spend_credits(p_user_id uuid, p_amount integer)
returns setof public.users
language sql
security definer
as $$
  update public.users
     set credits = credits - p_amount
   where id = p_user_id and credits >= p_amount
  returning *;
$$;

-- ---------- Row Level Security ----------
-- The app talks to the DB with the service-role key from server routes only, and
-- enforces ownership in code. RLS is enabled so the anon key can never read data.
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.variants enable row level security;

create policy "users: self read" on public.users for select using (auth.uid() = id);
create policy "projects: owner" on public.projects for all using (auth.uid() = user_id);
create policy "variants: owner" on public.variants for all
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
