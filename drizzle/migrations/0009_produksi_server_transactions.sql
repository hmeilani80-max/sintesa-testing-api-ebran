-- Produksi persistence v1. Review and run manually; this file is not executed by the app.
-- Atomic write of the current item, immutable version snapshot, and append-only approval events.
create or replace function public.production_save_item(p_item jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_id text;
  v_version integer;
  v_existing_version integer;
  v_snapshot jsonb;
  v_history jsonb;
  v_event jsonb;
  v_event_key text;
  v_actor text;
  v_created boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized' using errcode = '28000';
  end if;

  if jsonb_typeof(p_item) <> 'object'
     or coalesce(p_item->>'id', '') = ''
     or coalesce(p_item->>'title', '') = ''
     or coalesce(p_item->>'type', '') = ''
     or coalesce(p_item->>'family', '') = ''
     or jsonb_typeof(p_item->'brief') <> 'object'
     or jsonb_typeof(p_item->'content') <> 'object' then
    raise exception 'Invalid production payload' using errcode = '22023';
  end if;

  v_id := p_item->>'id';
  v_version := greatest(coalesce((p_item->>'version')::integer, 0), 0);
  v_snapshot := p_item;
  v_history := case when jsonb_typeof(p_item->'approvals') = 'array' then p_item->'approvals' else '[]'::jsonb end;
  v_actor := auth.uid()::text;

  -- Lock existing item so concurrent writes cannot silently overwrite a newer version.
  select active_version into v_existing_version
    from public.production_items where id = v_id for update;

  if found then
    if v_version < coalesce(v_existing_version, 0) then
      raise exception 'Stale production version: incoming %, current %', v_version, v_existing_version
        using errcode = '40001';
    end if;
  else
    v_created := true;
  end if;

  insert into public.production_items (
    id, title, output_type, output_family, destinations, source,
    strategy_slug, strategy_title, situation_slug, situation_name,
    production_status, approval_status, active_version, variant, brief, content,
    review_note, submitted_by, submitted_at, submitted_day, snapshot, updated_at
  ) values (
    v_id, p_item->>'title', p_item->>'type', p_item->>'family',
    coalesce(p_item->'dest', '[]'::jsonb), coalesce(p_item->>'source', 'Manual'),
    p_item->>'strategySlug', p_item->>'strategyTitle', p_item->>'situationSlug', p_item->>'situationName',
    coalesce(p_item->>'status', 'Draft'), p_item->>'approval', v_version,
    coalesce((p_item->>'variant')::integer, 0), p_item->'brief', p_item->'content',
    p_item->>'reviewNote', v_actor, p_item->>'submittedAt', p_item->>'submittedDay',
    v_snapshot, now()
  )
  on conflict (id) do update set
    title = excluded.title, output_type = excluded.output_type, output_family = excluded.output_family,
    destinations = excluded.destinations, source = excluded.source,
    strategy_slug = excluded.strategy_slug, strategy_title = excluded.strategy_title,
    situation_slug = excluded.situation_slug, situation_name = excluded.situation_name,
    production_status = excluded.production_status, approval_status = excluded.approval_status,
    active_version = excluded.active_version, variant = excluded.variant, brief = excluded.brief,
    content = excluded.content, review_note = excluded.review_note,
    submitted_by = excluded.submitted_by, submitted_at = excluded.submitted_at,
    submitted_day = excluded.submitted_day, snapshot = excluded.snapshot, updated_at = now();

  if v_version > 0 then
    insert into public.production_item_versions
      (production_id, version_number, snapshot, change_label, created_by)
    values (
      v_id, v_version, v_snapshot,
      coalesce(p_item#>>'{history,-1,label}', 'Snapshot'),
      v_actor
    )
    on conflict (production_id, version_number) do nothing;
  end if;

  for v_event in select value from jsonb_array_elements(v_history)
  loop
    if coalesce(v_event->>'decision', '') <> '' then
      v_event_key := v_id || ':' || coalesce(v_event->>'version', '0') || ':' ||
        coalesce(v_event->>'decision', '') || ':' || coalesce(v_event->>'at', '') || ':' ||
        md5(coalesce(v_event->>'actor', '') || ':' || coalesce(v_event->>'note', ''));
      insert into public.production_approval_events
        (production_id, version_number, decision, actor, note, occurred_at, event_key)
      values (
        v_id, nullif(v_event->>'version', '')::integer, v_event->>'decision',
        v_actor, v_event->>'note', v_event->>'at', v_event_key
      )
      on conflict (event_key) do nothing;
    end if;
  end loop;

  return jsonb_build_object('id', v_id, 'version', v_version, 'created', v_created);
end;
$$;

revoke all on function public.production_save_item(jsonb) from public, anon;
grant execute on function public.production_save_item(jsonb) to authenticated;
