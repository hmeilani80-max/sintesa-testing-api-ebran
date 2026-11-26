-- Apify collection pipeline for Situasi: raw evidence, run history, and idempotent observation promotion.
create table if not exists public.situasi_apify_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_category text not null check (source_category in ('news','social','government')),
  actor_id text not null,
  actor_run_id text,
  dataset_id text,
  status text not null default 'running' check (status in ('running','success','partial','failed')),
  items_seen integer not null default 0,
  items_saved integer not null default 0,
  observations_inserted integer not null default 0,
  duplicates_skipped integer not null default 0,
  unmatched_items integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists situasi_apify_runs_started_idx
  on public.situasi_apify_ingestion_runs(started_at desc);
create index if not exists situasi_apify_runs_status_idx
  on public.situasi_apify_ingestion_runs(status, source_category);

create table if not exists public.situasi_apify_items (
  id uuid primary key default gen_random_uuid(),
  item_hash text not null unique,
  run_id uuid references public.situasi_apify_ingestion_runs(id) on delete set null,
  source_category text not null check (source_category in ('news','social','government')),
  source_name text,
  platform text,
  title text,
  content text not null,
  source_url text,
  published_at timestamptz,
  province text,
  region text,
  actor_name text,
  topic_slug text references public.situasi_system_findings(slug) on delete set null,
  match_status text not null default 'unmatched'
    check (match_status in ('unmatched','matched','missing_timestamp','missing_source_url')),
  raw_item jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists situasi_apify_items_category_created_idx
  on public.situasi_apify_items(source_category, created_at desc);
create index if not exists situasi_apify_items_topic_published_idx
  on public.situasi_apify_items(topic_slug, published_at desc);
create index if not exists situasi_apify_items_province_published_idx
  on public.situasi_apify_items(province, published_at desc);

alter table public.situasi_apify_ingestion_runs enable row level security;
alter table public.situasi_apify_items enable row level security;

drop policy if exists situasi_apify_runs_read_authenticated on public.situasi_apify_ingestion_runs;
create policy situasi_apify_runs_read_authenticated
  on public.situasi_apify_ingestion_runs for select to authenticated using (true);
drop policy if exists situasi_apify_items_read_authenticated on public.situasi_apify_items;
create policy situasi_apify_items_read_authenticated
  on public.situasi_apify_items for select to authenticated using (true);

revoke insert, update, delete on public.situasi_apify_ingestion_runs from anon, authenticated;
revoke insert, update, delete on public.situasi_apify_items from anon, authenticated;
grant select on public.situasi_apify_ingestion_runs, public.situasi_apify_items to authenticated;

-- APIFY observations keep their original platform label while remaining idempotent by source URL.
create unique index if not exists situasi_observations_apify_source_url_uidx
  on public.situasi_observations(source_url)
  where (metadata ->> 'ingestion_source') = 'apify' and source_url is not null;

create or replace function public.ingest_situasi_apify_observation(
  p_topic_slug text,
  p_platform text,
  p_actor text,
  p_content text,
  p_narrative text,
  p_observed_at timestamptz,
  p_source_url text,
  p_region text default null,
  p_metadata jsonb default '{}'::jsonb
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_inserted integer;
begin
  if p_topic_slug is null or p_content is null or length(trim(p_content)) = 0
     or p_source_url is null or p_observed_at is null then
    raise exception 'topic, content, source URL, and observed_at are required';
  end if;
  if not exists (select 1 from public.situasi_system_findings where slug = p_topic_slug) then
    raise exception 'unknown system finding topic';
  end if;

  insert into public.situasi_observations(
    topic_slug, actor, platform, content, narrative, region, observed_at, source_url, metadata
  ) values (
    p_topic_slug, nullif(left(trim(coalesce(p_actor,'')),300),''),
    left(coalesce(nullif(trim(p_platform),''),'Apify'),80),
    left(p_content,12000), left(coalesce(p_narrative,''),1000),
    nullif(left(trim(coalesce(p_region,'')),160),''),
    p_observed_at, p_source_url,
    coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('ingestion_source','apify')
  )
  on conflict (source_url)
    where (metadata ->> 'ingestion_source') = 'apify' and source_url is not null
  do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted = 1;
end;
$$;

revoke all on function public.ingest_situasi_apify_observation(text,text,text,text,text,timestamptz,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.ingest_situasi_apify_observation(text,text,text,text,text,timestamptz,text,text,jsonb)
  to service_role;
