create or replace function public.refresh_situasi_ews_for_topic(p_topic_slug text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_name text; v_recent integer:=0; v_previous integer:=0; v_actors integer:=0;
  v_regions integer:=0; v_negative numeric:=0; v_growth numeric:=0;
  v_narrative text; v_regions_label text;
  v_score integer; v_level text; v_previous_level text; v_last timestamptz;
  v_quality text:='insufficient'; v_triggers text[]:='{}';
begin
  select name into v_name from public.situasi_system_findings where slug=p_topic_slug;
  if v_name is null then return; end if;

  select count(*) filter(where observed_at>=now()-interval '7 days')::integer,
         count(*) filter(where observed_at>=now()-interval '14 days' and observed_at<now()-interval '7 days')::integer,
         count(distinct actor) filter(where observed_at>=now()-interval '7 days')::integer,
         count(distinct region) filter(where observed_at>=now()-interval '7 days')::integer,
         coalesce(100.0*count(*) filter(where observed_at>=now()-interval '7 days' and sentiment='Negatif')
           / nullif(count(*) filter(where observed_at>=now()-interval '7 days'),0),0),
         max(observed_at)
    into v_recent,v_previous,v_actors,v_regions,v_negative,v_last
    from public.situasi_observations
   where topic_slug=p_topic_slug;

  if v_last>=now()-interval '7 days' and v_recent>=5 then v_quality:='sufficient'; end if;

  select narrative into v_narrative from public.situasi_observations
   where topic_slug=p_topic_slug and observed_at>=now()-interval '7 days' and narrative is not null
   group by narrative order by count(*) desc limit 1;
  select string_agg(region, ', ' order by n desc) into v_regions_label from (
    select region,count(*) as n from public.situasi_observations
    where topic_slug=p_topic_slug and observed_at>=now()-interval '7 days' and region is not null
    group by region order by n desc limit 5
  ) region_summary;

  if v_quality='insufficient' then
    update public.situasi_system_findings set risk=null,warning_status='Data belum cukup',risk_score=null,data_quality='insufficient',
      evidence_count=v_recent,last_observed_at=v_last,updated_at=now() where slug=p_topic_slug;
    update public.situasi_ews set risk_score=null,data_quality='insufficient',evidence_count=v_recent,
      last_observed_at=v_last,last_calculated_at=now(),updated_at=now(),
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('calculation_status','insufficient_data','minimum_evidence',5,'window_days',7)
      where topic_slug=p_topic_slug;
    insert into public.situasi_risk_profiles(topic_slug,active_regions,warning_count,new_actors,
      negative_sentiment,spread_potential,growing_regions,driving_narrative,factors,dimensions,
      warnings,risk_details,unusual_activity,risk_score,data_quality,evidence_count,last_observed_at,updated_at)
    values(p_topic_slug,v_regions,0,null,null,null,null,null,'[]','[]','[]','[]',
      'Belum cukup observasi aktual terbaru untuk menghitung risiko. Diperlukan minimal 5 observasi dalam 7 hari terakhir.',
      null,'insufficient',v_recent,v_last,now())
    on conflict(topic_slug) do update set active_regions=excluded.active_regions,warning_count=0,
      new_actors=null,negative_sentiment=null,spread_potential=null,growing_regions=null,
      driving_narrative=null,factors='[]',dimensions='[]',warnings='[]',risk_details='[]',
      unusual_activity=excluded.unusual_activity,risk_score=null,data_quality='insufficient',
      evidence_count=excluded.evidence_count,last_observed_at=excluded.last_observed_at,updated_at=now();
    return;
  end if;

  v_growth:=case when v_previous>0 then 100.0*(v_recent-v_previous)::numeric/v_previous
                 when v_recent>0 then 100 else 0 end;
  v_score:=round(least(100,greatest(0,v_growth))*0.35
      + least(100,v_actors*10)*0.20 + least(100,v_regions*20)*0.20 + v_negative*0.25)::integer;
  v_level:=case when v_score>=75 then 'Kritis' when v_score>=55 then 'Tinggi'
                when v_score>=30 then 'Sedang' else 'Rendah' end;
  if v_growth>=25 then v_triggers:=array_append(v_triggers,format('Pertumbuhan observasi %.1f%% dalam 7 hari',v_growth)); end if;
  if v_actors>=5 then v_triggers:=array_append(v_triggers,format('%s aktor teramati dalam 7 hari',v_actors)); end if;
  if v_regions>=2 then v_triggers:=array_append(v_triggers,format('Aktivitas teramati di %s wilayah',v_regions)); end if;
  if v_negative>=40 then v_triggers:=array_append(v_triggers,format('Sentimen negatif %.1f%%',v_negative)); end if;
  if cardinality(v_triggers)=0 then v_triggers:=array['Indikator berada dalam pemantauan rutin']; end if;
  select level into v_previous_level from public.situasi_ews where slug=p_topic_slug;

  update public.situasi_system_findings set risk=v_level,risk_score=v_score,data_quality='sufficient',
    evidence_count=v_recent,last_observed_at=v_last,
    warning_status=case when v_score>=55 then 'Early warning aktif' else 'Dalam pemantauan' end,
    updated_at=now() where slug=p_topic_slug;

  insert into public.situasi_ews(slug,topic_slug,name,level,first_detected_at,triggers,
    handling_status,reason,metadata,risk_score,data_quality,evidence_count,last_observed_at,last_calculated_at,updated_at)
  values(p_topic_slug,p_topic_slug,v_name,v_level,now(),v_triggers,'Baru',
    'Dihitung dari observasi aktual 7 hari terakhir.',
    jsonb_build_object('calculation_status','calculated','window_days',7,
      'volume_growth_percent',round(v_growth,2),'negative_sentiment_percent',round(v_negative,2)),
    v_score,'sufficient',v_recent,v_last,now(),now())
  on conflict(slug) do update set topic_slug=excluded.topic_slug,name=excluded.name,level=excluded.level,
    triggers=excluded.triggers,reason=excluded.reason,metadata=excluded.metadata,
    risk_score=excluded.risk_score,data_quality='sufficient',evidence_count=excluded.evidence_count,
    last_observed_at=excluded.last_observed_at,last_calculated_at=now(),updated_at=now();

  insert into public.situasi_risk_profiles(topic_slug,active_regions,warning_count,new_actors,
    negative_sentiment,spread_potential,growing_regions,driving_narrative,factors,dimensions,
    warnings,risk_details,unusual_activity,risk_score,data_quality,evidence_count,last_observed_at,updated_at)
  values(p_topic_slug,v_regions,case when v_score>=55 then 1 else 0 end,v_actors::text,
    round(v_negative,1)::text||'%',v_level,coalesce(v_regions_label,v_regions::text||' wilayah'),v_narrative,
    jsonb_build_array(
      jsonb_build_object('factor','Pertumbuhan observasi','condition',round(v_growth,1)::text||'%','change',round(v_growth,1)::text||'%'),
      jsonb_build_object('factor','Aktor teramati','condition',v_actors::text,'change',v_actors::text),
      jsonb_build_object('factor','Cakupan wilayah','condition',v_regions::text,'change',v_regions::text),
      jsonb_build_object('factor','Sentimen negatif','condition',round(v_negative,1)::text||'%','change',round(v_negative,1)::text||'%')
    ),
    jsonb_build_array(
      jsonb_build_object('name','Pertumbuhan volume','impact',case when v_growth>=50 then 'Tinggi' when v_growth>=25 then 'Sedang' else 'Rendah' end,'momentum',round(v_growth,1)::text||'%'),
      jsonb_build_object('name','Aktor teramati','impact',case when v_actors>=10 then 'Tinggi' when v_actors>=5 then 'Sedang' else 'Rendah' end,'momentum',v_actors::text),
      jsonb_build_object('name','Cakupan wilayah','impact',case when v_regions>=4 then 'Tinggi' when v_regions>=2 then 'Sedang' else 'Rendah' end,'momentum',v_regions::text),
      jsonb_build_object('name','Sentimen negatif','impact',case when v_negative>=60 then 'Tinggi' when v_negative>=40 then 'Sedang' else 'Rendah' end,'momentum',round(v_negative,1)::text||'%')
    ),
    case when v_score>=55 then jsonb_build_array(jsonb_build_object('level',v_level,'title','Early warning berdasarkan observasi','meta',v_recent||' observasi / 7 hari')) else '[]' end,
    jsonb_build_array(jsonb_build_object('indicator','Observasi aktual 7 hari','level',v_level,'volume',v_recent::text,'growth',round(v_growth,1)::text||'%','actors',v_actors::text,'region',coalesce(v_regions_label,v_regions::text||' wilayah'),'status',case when v_score>=55 then 'Meningkat' else 'Dipantau' end)),
    'Skor: pertumbuhan 35%, aktor 20%, cakupan wilayah 20%, sentimen negatif 25%.',
    v_score,'sufficient',v_recent,v_last,now())
  on conflict(topic_slug) do update set active_regions=excluded.active_regions,
    warning_count=excluded.warning_count,new_actors=excluded.new_actors,
    negative_sentiment=excluded.negative_sentiment,spread_potential=excluded.spread_potential,
    growing_regions=excluded.growing_regions,factors=excluded.factors,dimensions=excluded.dimensions,
    warnings=excluded.warnings,risk_details=excluded.risk_details,unusual_activity=excluded.unusual_activity,
    risk_score=excluded.risk_score,data_quality='sufficient',evidence_count=excluded.evidence_count,
    last_observed_at=excluded.last_observed_at,updated_at=now();

  if v_previous_level is distinct from v_level then
    insert into public.situasi_ews_history(ews_slug,event_at,event,status,actor,notes)
    values(p_topic_slug,now(),
      case when v_previous_level is null then 'Early warning dibuat oleh mesin deteksi'
           else 'Level risiko berubah dari '||v_previous_level||' menjadi '||v_level end,
      'Baru','Mesin EWS',format('Skor %s/100 dari %s observasi aktual dalam 7 hari.',v_score,v_recent));
  end if;
end $$;
