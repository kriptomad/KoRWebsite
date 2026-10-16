-- KOC-Digital-Core-Enterprise — Postgres schema (Supabase)
-- Transactional state: comments, RBAC roles/permissions, audit trail, and the
-- first-party CMS content store (hero slides/products/recipes/posts — see
-- src/lib/db/content-store.ts). Sanity remains available as an optional,
-- advanced external CMS swap-in (src/lib/sanity) but is not required: by
-- default the Owner's Command Dashboard CRUD modules read/write the tables
-- below directly.

create extension if not exists "pgcrypto";

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_system boolean not null default false,
  permissions text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists staff_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  role_id uuid not null references roles(id),
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('recipe', 'post')),
  target_id text not null,
  name text not null,
  -- Email is only used for moderation contact / GDPR erasure lookups, never shown publicly.
  email text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden', 'purged')),
  created_at timestamptz not null default now()
);

create index if not exists comments_target_idx on comments (target_type, target_id, status);
create index if not exists comments_email_idx on comments (email);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_role text not null,
  action text not null,
  target_summary text not null,
  ip_address text not null,
  created_at timestamptz not null default now()
);

-- Seed baseline system roles (Owner keeps full access and cannot be deleted).
insert into roles (name, is_system, permissions) values
  ('Owner', true, array['content.create','content.publish','products.manage','recipes.manage','posts.manage','comments.moderate','roles.manage','audit.view','gdpr.manage']),
  ('Editor', false, array['content.create','content.publish','products.manage','recipes.manage','posts.manage']),
  ('Moderator', false, array['comments.moderate'])
on conflict (name) do nothing;

-- First-party CMS content tables. Each row stores its full domain object as
-- jsonb in `data` (shape mirrors the TS types in src/types/index.ts) — this
-- keeps the schema simple and stable while the content shape evolves, and
-- `position` preserves display/carousel order. `id` is a plain text primary
-- key (app-generated via crypto.randomUUID()) rather than a uuid column,
-- since seed/demo rows use human-readable ids like "prod-hake".

create table if not exists hero_slides (
  id text primary key,
  position integer not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  slug text,
  position integer not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists products_slug_idx on products (slug);

create table if not exists recipes (
  id text primary key,
  slug text,
  position integer not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists recipes_slug_idx on recipes (slug);

create table if not exists posts (
  id text primary key,
  slug text,
  position integer not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists posts_slug_idx on posts (slug);
