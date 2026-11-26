-- Persist one campaign and all of its relational children atomically.
-- SECURITY INVOKER is intentional: table grants and RLS remain in force.
create or replace function public.persist_social_campaign_atomic(
  p_campaign jsonb,
  p_targets jsonb default '[]'::jsonb,
  p_posts jsonb default '[]'::jsonb,
  p_approvals jsonb default '[]'::jsonb,
  p_history jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_campaign_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_campaign is null or jsonb_typeof(p_campaign) <> 'object'
     or nullif(p_campaign->>'id', '') is null
     or nullif(p_campaign->>'name', '') is null then
    raise exception 'Invalid campaign payload' using errcode = '22023';
  end if;

  insert into public.social_campaigns (
    user_id, legacy_id, name, status, approval_status, production_id,
    content_ids, purpose, direction, platforms, timing, staggered,
    submitted_by, submitted_at, submitted_day, snapshot, updated_at
  ) values (
    v_user_id, p_campaign->>'id', p_campaign->>'name',
    coalesce(p_campaign->>'status', 'Draft'), p_campaign->>'approval',
    coalesce(p_campaign->>'productionId', ''),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_campaign->'contentIds','[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_campaign->'purpose','[]'::jsonb))), '{}'),
    coalesce(p_campaign->>'direction', ''),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_campaign->'platforms','[]'::jsonb))), '{}'),
    coalesce(p_campaign->'timing', '{}'::jsonb),
    coalesce((p_campaign->>'staggered')::boolean, true),
    p_campaign->>'submittedBy', p_campaign->>'submittedAt', p_campaign->>'submittedDay',
    p_campaign, now()
  )
  on conflict (user_id, legacy_id) do update set
    name=excluded.name, status=excluded.status, approval_status=excluded.approval_status,
    production_id=excluded.production_id, content_ids=excluded.content_ids,
    purpose=excluded.purpose, direction=excluded.direction, platforms=excluded.platforms,
    timing=excluded.timing, staggered=excluded.staggered,
    submitted_by=excluded.submitted_by, submitted_at=excluded.submitted_at,
    submitted_day=excluded.submitted_day, snapshot=excluded.snapshot, updated_at=now()
  returning id into v_campaign_id;

  delete from public.social_campaign_targets where campaign_id=v_campaign_id;
  delete from public.social_campaign_posts where campaign_id=v_campaign_id;
  delete from public.social_campaign_approvals where campaign_id=v_campaign_id;
  delete from public.social_campaign_history where campaign_id=v_campaign_id;

  if jsonb_typeof(coalesce(p_targets,'[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_posts,'[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_approvals,'[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_history,'[]'::jsonb)) <> 'array' then
    raise exception 'Child payloads must be JSON arrays' using errcode = '22023';
  end if;

  insert into public.social_campaign_targets
    (user_id,campaign_id,account_key,platform,handle,snapshot)
  select v_user_id,v_campaign_id,x->>'account_key',
    coalesce(x->>'platform',''),coalesce(x->>'handle',''),coalesce(x->'snapshot','{}'::jsonb)
  from jsonb_array_elements(coalesce(p_targets,'[]'::jsonb)) x;

  insert into public.social_campaign_posts
    (user_id,campaign_id,legacy_post_id,account_key,asset_id,platform,
     scheduled_date,scheduled_time,caption,prep_status,execution_status,
     published_url,error_message,snapshot,updated_at)
  select v_user_id,v_campaign_id,x->>'legacy_post_id',coalesce(x->>'account_key',''),
    coalesce(x->>'asset_id',''),coalesce(x->>'platform',''),
    nullif(x->>'scheduled_date','')::date,nullif(x->>'scheduled_time','')::time,
    coalesce(x->>'caption',''),coalesce(x->>'prep_status','Belum Disiapkan'),
    coalesce(x->>'execution_status','Ready'),x->>'published_url',x->>'error_message',
    coalesce(x->'snapshot','{}'::jsonb),now()
  from jsonb_array_elements(coalesce(p_posts,'[]'::jsonb)) x;

  insert into public.social_campaign_approvals
    (user_id,campaign_id,decision,actor,note,snapshot)
  select v_user_id,v_campaign_id,coalesce(x->>'decision',''),
    coalesce(x->>'actor',''),x->>'note',coalesce(x->'snapshot','{}'::jsonb)
  from jsonb_array_elements(coalesce(p_approvals,'[]'::jsonb)) x;

  insert into public.social_campaign_history
    (user_id,campaign_id,event_text,snapshot)
  select v_user_id,v_campaign_id,coalesce(x->>'event_text',''),
    coalesce(x->'snapshot','{}'::jsonb)
  from jsonb_array_elements(coalesce(p_history,'[]'::jsonb)) x;

  return v_campaign_id;
end;
$$;

revoke all on function public.persist_social_campaign_atomic(jsonb,jsonb,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.persist_social_campaign_atomic(jsonb,jsonb,jsonb,jsonb,jsonb) to authenticated;
