-- Align imported approval event keys with the frontend's id:index:decision:time format.
-- Match against each item's persisted snapshot; this is idempotent for the imported baseline.
with desired as (
  select
    p.id as production_id,
    (a.ordinality - 1)::text as event_index,
    a.event->>'decision' as decision,
    a.event->>'at' as occurred_at,
    a.event->>'actor' as actor,
    a.event->>'note' as note,
    p.id || ':' || (a.ordinality - 1)::text || ':' || (a.event->>'decision') || ':' || (a.event->>'at') as new_key
  from public.production_items p
  cross join lateral jsonb_array_elements(coalesce(p.snapshot->'approvals', '[]'::jsonb)) with ordinality as a(event, ordinality)
)
update public.production_approval_events e
set event_key = d.new_key
from desired d
where e.production_id = d.production_id
  and e.decision = d.decision
  and e.occurred_at = d.occurred_at
  and e.actor = d.actor
  and coalesce(e.note, '') = coalesce(d.note, '')
  and e.event_key <> d.new_key
  and not exists (
    select 1 from public.production_approval_events other
    where other.event_key = d.new_key and other.id <> e.id
  );