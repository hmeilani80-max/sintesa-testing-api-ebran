-- Keep the Situasi Apify monitoring page current without polling.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'situasi_apify_ingestion_runs'
  ) then
    alter publication supabase_realtime add table public.situasi_apify_ingestion_runs;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'situasi_apify_items'
  ) then
    alter publication supabase_realtime add table public.situasi_apify_items;
  end if;
end
$$;
