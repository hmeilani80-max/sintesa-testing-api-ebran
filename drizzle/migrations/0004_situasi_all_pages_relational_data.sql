-- Relational backend for Situasi summary, exploration, and risk/prediction pages.
-- Existing tables are preserved; seed rows are labelled as frontend demo data.
create index if not exists idx_situasi_trend_topic_date on public.situasi_trend_points(topic_slug, period_date);
create index if not exists idx_situasi_actors_topic on public.situasi_actors(topic_slug);
create index if not exists idx_situasi_narratives_topic on public.situasi_narratives(topic_slug);
create index if not exists idx_situasi_regions_topic_date on public.situasi_region_metrics(topic_slug, period_date);
create index if not exists idx_situasi_sentiment_topic_date on public.situasi_sentiment_metrics(topic_slug, period_date);
create index if not exists idx_situasi_clusters_topic on public.situasi_clusters(topic_slug);
create index if not exists idx_situasi_observations_topic_time on public.situasi_observations(topic_slug, observed_at desc);
create index if not exists idx_situasi_comments_topic_time on public.situasi_comments(topic_slug, observed_at desc);
create index if not exists idx_situasi_ews_topic on public.situasi_ews(topic_slug);
create index if not exists idx_situasi_ews_history_slug_time on public.situasi_ews_history(ews_slug, event_at);
create index if not exists idx_situasi_manipulation_patterns_topic on public.situasi_manipulation_patterns(topic_slug);
create index if not exists idx_situasi_account_profiles_updated on public.situasi_account_profiles(updated_at desc);

do $$
declare t text;
begin
  foreach t in array array[
    'situasi_trend_points','situasi_actors','situasi_narratives','situasi_region_metrics',
    'situasi_sentiment_metrics','situasi_clusters','situasi_observations','situasi_comments',
    'situasi_manipulation_patterns','situasi_manipulation_contents','situasi_account_profiles',
    'situasi_account_uploads','situasi_account_relations','situasi_ews','situasi_ews_history',
    'situasi_risk_profiles'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_authenticated_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', t || '_authenticated_all', t);
  end loop;
end $$;

-- Demo rows are illustrative only; replace them with verified ingestion data.
insert into public.situasi_risk_profiles(topic_slug,active_regions,warning_count,new_actors,negative_sentiment,spread_potential,growing_regions,driving_narrative,factors,dimensions,warnings,risk_details,unusual_activity)
values ('demonstrasi-nasional',6,7,'+428 / 24 jam','46%','Tinggi','Bandung, Surabaya','Aksi meluas ke sejumlah kota',
'[{"factor":"Kecepatan Penyebaran","condition":"Tinggi","change":"+42%"},{"factor":"Pertumbuhan Volume","condition":"Tinggi","change":"+63%"},{"factor":"Aktor Baru","condition":"Meningkat","change":"+428 / 24 jam"},{"factor":"Sentimen Negatif","condition":"Tinggi","change":"46%"}]'::jsonb,
'[{"name":"Aksi meluas","impact":"Tinggi","momentum":"+72%"},{"name":"Kericuhan","impact":"Tinggi","momentum":"+31%"},{"name":"Kondisi ekonomi","impact":"Sedang","momentum":"+44%"},{"name":"Aksi damai","impact":"Rendah","momentum":"+17%"}]'::jsonb,
'[{"level":"TINGGI","title":"Lonjakan percakapan di Bandung","meta":"+86% dalam 3 jam"},{"level":"TINGGI","title":"Narasi aksi meluas menyebar","meta":"Ke 3 platform tambahan"},{"level":"SEDANG","title":"Peningkatan akun baru dalam Cluster A","meta":"42 menit lalu"}]'::jsonb,
'[{"indicator":"Aksi meluas ke sejumlah kota","level":"Tinggi","volume":"38420","growth":"+72%","actors":"8240","region":"Jakarta, Bandung","status":"Meningkat"},{"indicator":"Informasi tidak terverifikasi terkait kericuhan","level":"Tinggi","volume":"12780","growth":"+31%","actors":"2870","region":"Jakarta","status":"Meningkat"}]'::jsonb,
'37 akun menunjukkan waktu unggah yang berdekatan dan menggunakan narasi serupa dalam periode dua jam.')
on conflict (topic_slug) do nothing;

insert into public.situasi_ews(slug,topic_slug,name,level,first_detected_at,triggers,handling_status,pic,reason,metadata)
values ('demonstrasi-nasional','demonstrasi-nasional','Demonstrasi Nasional','Tinggi','2026-10-03 08:00+07',
array['Lonjakan volume +63%','Meluasnya wilayah percakapan ke 6 wilayah'],'Dalam Pemantauan','Analis Siaga 1',
'Lonjakan volume dan meluasnya wilayah percakapan',jsonb_build_object('source','frontend_demo_seed'))
on conflict (slug) do nothing;
