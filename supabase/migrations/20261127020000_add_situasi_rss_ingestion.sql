-- RSS ingestion idempotency and trusted insert RPC for Situasi observations.
create unique index if not exists situasi_observations_rss_source_url_uidx
  on public.situasi_observations(source_url)
  where platform = 'RSS' and source_url is not null;

create table if not exists public.situasi_rss_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running','success','partial','failed')),
  feeds_checked integer not null default 0,
  articles_seen integer not null default 0,
  observations_inserted integer not null default 0,
  duplicates_skipped integer not null default 0,
  unmatched_articles integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.situasi_rss_ingestion_runs enable row level security;
drop policy if exists situasi_rss_runs_read_authenticated on public.situasi_rss_ingestion_runs;
create policy situasi_rss_runs_read_authenticated
  on public.situasi_rss_ingestion_runs for select to authenticated using (true);

create or replace function public.ingest_situasi_rss_observation(
  p_topic_slug text,
  p_actor text,
  p_content text,
  p_narrative text,
  p_observed_at timestamptz,
  p_source_url text,
  p_metadata jsonb default '{}'::jsonb
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_inserted integer;
begin
  if p_topic_slug is null or p_content is null or length(trim(p_content)) = 0
     or p_source_url is null then
    raise exception 'topic, content, and source URL are required';
  end if;

  insert into public.situasi_observations(
    topic_slug, actor, platform, content, narrative, observed_at, source_url, metadata
  ) values (
    p_topic_slug, p_actor, 'RSS', left(p_content, 12000), left(p_narrative, 1000),
    p_observed_at, p_source_url, coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('ingestion_source','rss')
  )
  on conflict (source_url) where platform = 'RSS' and source_url is not null do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted = 1;
end;
$$;

revoke all on function public.ingest_situasi_rss_observation(text,text,text,text,timestamptz,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.ingest_situasi_rss_observation(text,text,text,text,timestamptz,text,jsonb)
  to service_role;
