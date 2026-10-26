-- Relational storage for Social Distribution campaigns.
create extension if not exists pgcrypto;

create table if not exists public.social_campaigns (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 legacy_id text not null, name text not null, status text not null default 'Draft', approval_status text,
 production_id text not null default '', content_ids text[] not null default '{}', purpose text[] not null default '{}',
 direction text not null default '', platforms text[] not null default '{}', timing jsonb not null default '{}'::jsonb,
 staggered boolean not null default true, submitted_by text, submitted_at text, submitted_day text,
 snapshot jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(user_id, legacy_id)
);
create table if not exists public.social_campaign_targets (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 campaign_id uuid not null references public.social_campaigns(id) on delete cascade, account_key text not null,
 platform text not null, handle text not null, snapshot jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
 unique(campaign_id, account_key)
);
create table if not exists public.social_campaign_posts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 campaign_id uuid not null references public.social_campaigns(id) on delete cascade, legacy_post_id text not null,
 account_key text not null, asset_id text not null, platform text not null, scheduled_date date, scheduled_time time,
 caption text not null default '', prep_status text not null default 'Belum Disiapkan', execution_status text not null default 'Ready',
 published_url text, error_message text, snapshot jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(campaign_id, legacy_post_id)
);
create table if not exists public.social_campaign_approvals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 campaign_id uuid not null references public.social_campaigns(id) on delete cascade, decision text not null,
 actor text not null default '', note text, decided_at timestamptz not null default now(), snapshot jsonb not null default '{}'::jsonb
);
create table if not exists public.social_campaign_history (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 campaign_id uuid not null references public.social_campaigns(id) on delete cascade, occurred_at timestamptz not null default now(),
 event_text text not null, snapshot jsonb not null default '{}'::jsonb
);
create index if not exists social_campaigns_user_updated_idx on public.social_campaigns(user_id, updated_at desc);
create index if not exists social_campaign_targets_campaign_idx on public.social_campaign_targets(campaign_id);
create index if not exists social_campaign_posts_campaign_date_idx on public.social_campaign_posts(campaign_id, scheduled_date, scheduled_time);
create index if not exists social_campaign_approvals_campaign_idx on public.social_campaign_approvals(campaign_id, decided_at desc);
create index if not exists social_campaign_history_campaign_idx on public.social_campaign_history(campaign_id, occurred_at desc);

alter table public.social_campaigns enable row level security;
alter table public.social_campaign_targets enable row level security;
alter table public.social_campaign_posts enable row level security;
alter table public.social_campaign_approvals enable row level security;
alter table public.social_campaign_history enable row level security;

drop policy if exists social_campaigns_select_own on public.social_campaigns;
create policy social_campaigns_select_own on public.social_campaigns for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists social_campaigns_insert_own on public.social_campaigns;
create policy social_campaigns_insert_own on public.social_campaigns for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists social_campaigns_update_own on public.social_campaigns;
create policy social_campaigns_update_own on public.social_campaigns for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists social_campaigns_delete_own on public.social_campaigns;
create policy social_campaigns_delete_own on public.social_campaigns for delete to authenticated using(user_id=(select auth.uid()));

drop policy if exists social_campaign_targets_select_own on public.social_campaign_targets;
create policy social_campaign_targets_select_own on public.social_campaign_targets for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists social_campaign_targets_insert_own on public.social_campaign_targets;
create policy social_campaign_targets_insert_own on public.social_campaign_targets for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists social_campaign_targets_update_own on public.social_campaign_targets;
create policy social_campaign_targets_update_own on public.social_campaign_targets for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists social_campaign_targets_delete_own on public.social_campaign_targets;
create policy social_campaign_targets_delete_own on public.social_campaign_targets for delete to authenticated using(user_id=(select auth.uid()));

drop policy if exists social_campaign_posts_select_own on public.social_campaign_posts;
create policy social_campaign_posts_select_own on public.social_campaign_posts for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists social_campaign_posts_insert_own on public.social_campaign_posts;
create policy social_campaign_posts_insert_own on public.social_campaign_posts for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists social_campaign_posts_update_own on public.social_campaign_posts;
create policy social_campaign_posts_update_own on public.social_campaign_posts for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists social_campaign_posts_delete_own on public.social_campaign_posts;
create policy social_campaign_posts_delete_own on public.social_campaign_posts for delete to authenticated using(user_id=(select auth.uid()));

drop policy if exists social_campaign_approvals_select_own on public.social_campaign_approvals;
create policy social_campaign_approvals_select_own on public.social_campaign_approvals for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists social_campaign_approvals_insert_own on public.social_campaign_approvals;
create policy social_campaign_approvals_insert_own on public.social_campaign_approvals for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists social_campaign_approvals_update_own on public.social_campaign_approvals;
create policy social_campaign_approvals_update_own on public.social_campaign_approvals for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists social_campaign_approvals_delete_own on public.social_campaign_approvals;
create policy social_campaign_approvals_delete_own on public.social_campaign_approvals for delete to authenticated using(user_id=(select auth.uid()));

drop policy if exists social_campaign_history_select_own on public.social_campaign_history;
create policy social_campaign_history_select_own on public.social_campaign_history for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists social_campaign_history_insert_own on public.social_campaign_history;
create policy social_campaign_history_insert_own on public.social_campaign_history for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists social_campaign_history_update_own on public.social_campaign_history;
create policy social_campaign_history_update_own on public.social_campaign_history for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists social_campaign_history_delete_own on public.social_campaign_history;
create policy social_campaign_history_delete_own on public.social_campaign_history for delete to authenticated using(user_id=(select auth.uid()));

grant select, insert, update, delete on public.social_campaigns, public.social_campaign_targets, public.social_campaign_posts, public.social_campaign_approvals, public.social_campaign_history to authenticated;
