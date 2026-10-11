-- 0007: Relational database foundation for Menu Aksi > Produksi.
-- Additive only: keeps public.app_state and production_snapshot_imports unchanged.
-- Imports the existing Produksi JSON as-is; frontend integration is a separate verified step.

CREATE TABLE IF NOT EXISTS public.production_items (
  id text PRIMARY KEY CHECK (length(btrim(id)) > 0),
  title text NOT NULL DEFAULT '',
  output_type text NOT NULL DEFAULT '',
  output_family text NOT NULL DEFAULT '',
  destinations jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(destinations) = 'array'),
  source text NOT NULL DEFAULT 'Manual' CHECK (source IN ('Strategi', 'Manual')),
  strategy_slug text,
  strategy_title text,
  situation_slug text,
  situation_name text,
  production_status text NOT NULL DEFAULT 'Draft'
    CHECK (production_status IN ('Draft', 'Generating', 'Generated')),
  approval_status text
    CHECK (approval_status IS NULL OR approval_status IN ('Menunggu', 'Disetujui', 'Ditolak', 'Perlu Revisi')),
  active_version integer NOT NULL DEFAULT 0 CHECK (active_version >= 0),
  variant integer NOT NULL DEFAULT 0 CHECK (variant >= 0),
  brief jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(brief) = 'object'),
  content jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(content) = 'object'),
  review_note text,
  submitted_by text,
  submitted_at text,
  submitted_day text,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(snapshot) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS production_items_status_idx
  ON public.production_items (production_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS production_items_approval_idx
  ON public.production_items (approval_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS production_items_strategy_idx
  ON public.production_items (strategy_slug) WHERE strategy_slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.production_item_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id text NOT NULL REFERENCES public.production_items(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  change_label text NOT NULL DEFAULT 'Imported Snapshot',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (production_id, version_number)
);
CREATE INDEX IF NOT EXISTS production_item_versions_history_idx
  ON public.production_item_versions (production_id, version_number DESC);

CREATE TABLE IF NOT EXISTS public.production_approval_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id text NOT NULL REFERENCES public.production_items(id) ON DELETE CASCADE,
  version_number integer CHECK (version_number IS NULL OR version_number > 0),
  decision text NOT NULL
    CHECK (decision IN ('Diajukan', 'Diajukan Kembali', 'Disetujui', 'Perlu Revisi', 'Ditolak', 'Tidak Berlaku')),
  actor text NOT NULL DEFAULT 'Tidak diketahui',
  note text,
  occurred_at text,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_key text UNIQUE
);
CREATE INDEX IF NOT EXISTS production_approval_events_history_idx
  ON public.production_approval_events (production_id, created_at DESC);

ALTER TABLE public.production_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_item_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_approval_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS production_items_authenticated_all ON public.production_items;
CREATE POLICY production_items_authenticated_all ON public.production_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS production_item_versions_authenticated_all ON public.production_item_versions;
CREATE POLICY production_item_versions_authenticated_all ON public.production_item_versions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS production_approval_events_authenticated_all ON public.production_approval_events;
CREATE POLICY production_approval_events_authenticated_all ON public.production_approval_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

REVOKE ALL ON public.production_items FROM anon;
REVOKE ALL ON public.production_item_versions FROM anon;
REVOKE ALL ON public.production_approval_events FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_item_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_approval_events TO authenticated;
GRANT ALL ON public.production_items TO service_role;
GRANT ALL ON public.production_item_versions TO service_role;
GRANT ALL ON public.production_approval_events TO service_role;

-- Import the complete current frontend snapshot from app_state without modifying its source JSON.
INSERT INTO public.production_items (
  id, title, output_type, output_family, destinations, source, strategy_slug, strategy_title,
  situation_slug, situation_name, production_status, approval_status, active_version, variant,
  brief, content, review_note, submitted_by, submitted_at, submitted_day, snapshot, updated_at
)
SELECT
  item->>'id',
  coalesce(item->>'title', ''),
  coalesce(item->>'type', ''),
  coalesce(item->>'family', ''),
  coalesce(item->'dest', '[]'::jsonb),
  coalesce(item->>'source', 'Manual'),
  item->>'strategySlug',
  item->>'strategyTitle',
  item->>'situationSlug',
  item->>'situationName',
  coalesce(item->>'status', 'Draft'),
  item->>'approval',
  greatest(coalesce((item->>'version')::integer, 0), 0),
  greatest(coalesce((item->>'variant')::integer, 0), 0),
  coalesce(item->'brief', '{}'::jsonb),
  coalesce(item->'content', '{}'::jsonb),
  item->>'reviewNote',
  item->>'submittedBy',
  item->>'submittedAt',
  item->>'submittedDay',
  item,
  now()
FROM public.app_state s
CROSS JOIN LATERAL jsonb_array_elements(coalesce(s.data->'productions', '[]'::jsonb)) AS item
WHERE s.key = 'aksi'
  AND nullif(item->>'id', '') IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Create a baseline version per imported item; original history is retained in snapshot JSON.
INSERT INTO public.production_item_versions (production_id, version_number, snapshot, change_label, created_by)
SELECT id, active_version, snapshot, 'Imported Snapshot', submitted_by
FROM public.production_items
WHERE active_version > 0
ON CONFLICT (production_id, version_number) DO NOTHING;

-- Import each approval decision as an append-only event, preserving source timestamps and notes.
INSERT INTO public.production_approval_events (
  production_id, version_number, decision, actor, note, occurred_at, event_key
)
SELECT
  p.id,
  nullif(event->>'version', '')::integer,
  event->>'decision',
  coalesce(event->>'actor', 'Tidak diketahui'),
  event->>'note',
  event->>'at',
  p.id || ':' || ordinality::text || ':' || md5(event::text)
FROM public.production_items p
CROSS JOIN LATERAL jsonb_array_elements(coalesce(p.snapshot->'approvals', '[]'::jsonb))
  WITH ORDINALITY AS events(event, ordinality)
WHERE event->>'decision' IN ('Diajukan', 'Diajukan Kembali', 'Disetujui', 'Perlu Revisi', 'Ditolak', 'Tidak Berlaku')
ON CONFLICT (event_key) DO NOTHING;
