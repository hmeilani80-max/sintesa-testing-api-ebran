-- 0006: Relational database foundation for Menu Strategi.
-- Additive migration: preserves app_state as the current frontend source during transition.
-- Existing strategy rows are copied from app_state; source JSON remains untouched.

CREATE TABLE IF NOT EXISTS public.strategi_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  source text NOT NULL CHECK (source IN ('Situasi', 'Input Manual')),
  situation_slug text,
  situation_name text,
  status text NOT NULL DEFAULT 'Dalam Penyusunan'
    CHECK (status IN ('Draf', 'Dalam Penyusunan', 'Siap Dilaksanakan', 'Diteruskan ke Aksi', 'Arsip')),
  objective text NOT NULL DEFAULT '',
  context text,
  audience text,
  region text,
  platforms jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(platforms) = 'array'),
  approach text CHECK (approach IS NULL OR approach IN ('News-led', 'Social-led', 'Integrated')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CHECK ((source = 'Situasi' AND situation_slug IS NOT NULL) OR source = 'Input Manual')
);

CREATE INDEX IF NOT EXISTS strategi_strategies_status_updated_idx
  ON public.strategi_strategies (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS strategi_strategies_situation_slug_idx
  ON public.strategi_strategies (situation_slug) WHERE situation_slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.strategi_strategy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES public.strategi_strategies(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  change_note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (strategy_id, version_number)
);
CREATE INDEX IF NOT EXISTS strategi_strategy_versions_history_idx
  ON public.strategi_strategy_versions (strategy_id, version_number DESC);

CREATE TABLE IF NOT EXISTS public.strategi_approval_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES public.strategi_strategies(id) ON DELETE CASCADE,
  version_number integer,
  event_type text NOT NULL CHECK (event_type IN ('Diajukan', 'Disetujui', 'Ditolak', 'Perlu Perubahan', 'Dibatalkan')),
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_label text,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (version_number IS NULL OR version_number > 0)
);
CREATE INDEX IF NOT EXISTS strategi_approval_events_history_idx
  ON public.strategi_approval_events (strategy_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.strategi_evidence_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES public.strategi_strategies(id) ON DELETE CASCADE,
  statement text NOT NULL CHECK (length(btrim(statement)) > 0),
  source_name text NOT NULL,
  platform text,
  source_url text,
  source_time timestamptz,
  verification_status text NOT NULL DEFAULT 'Belum Terverifikasi'
    CHECK (verification_status IN ('Terverifikasi', 'Belum Terverifikasi', 'Ditolak', 'Perlu Ditinjau')),
  classification text NOT NULL DEFAULT 'Publik'
    CHECK (classification IN ('Publik', 'Internal', 'Terbatas', 'Rahasia')),
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS strategi_evidence_sources_strategy_idx
  ON public.strategi_evidence_sources (strategy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS strategi_evidence_sources_verification_idx
  ON public.strategi_evidence_sources (verification_status);

CREATE TABLE IF NOT EXISTS public.strategi_action_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES public.strategi_strategies(id) ON DELETE CASCADE,
  strategy_version integer,
  target_module text NOT NULL DEFAULT 'aksi',
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(tasks) = 'array'),
  handoff_status text NOT NULL DEFAULT 'Diteruskan'
    CHECK (handoff_status IN ('Diteruskan', 'Diproses', 'Selesai', 'Dibatalkan')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  CHECK (strategy_version IS NULL OR strategy_version > 0)
);
CREATE INDEX IF NOT EXISTS strategi_action_handoffs_strategy_idx
  ON public.strategi_action_handoffs (strategy_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.strategi_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES public.strategi_strategies(id) ON DELETE RESTRICT,
  version_number integer,
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  archive_reason text,
  archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  CHECK (version_number IS NULL OR version_number > 0)
);
CREATE INDEX IF NOT EXISTS strategi_archives_history_idx
  ON public.strategi_archives (strategy_id, archived_at DESC);

-- Match the authenticated-only workspace policy model currently used by app_state.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'strategi_strategies',
    'strategi_strategy_versions',
    'strategi_approval_events',
    'strategi_evidence_sources',
    'strategi_action_handoffs',
    'strategi_archives'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_team_access', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t || '_team_access', t
    );
  END LOOP;
END $$;

-- Backfill existing strategies from app_state without deleting or modifying the source JSON.
INSERT INTO public.strategi_strategies
  (slug, title, source, situation_slug, situation_name, status, objective, context, audience, region, platforms, approach, metadata, created_at, updated_at)
SELECT
  item->>'slug',
  item->>'title',
  item->>'source',
  NULLIF(item->>'situationSlug', ''),
  NULLIF(item->>'situationName', ''),
  CASE
    WHEN item->>'status' IN ('Draf', 'Dalam Penyusunan', 'Siap Dilaksanakan', 'Diteruskan ke Aksi', 'Arsip')
      THEN item->>'status'
    ELSE 'Dalam Penyusunan'
  END,
  COALESCE(item->>'objective', ''),
  NULLIF(item->>'context', ''),
  NULLIF(item->>'audience', ''),
  NULLIF(item->>'region', ''),
  COALESCE(item->'platforms', '[]'::jsonb),
  NULLIF(item->>'approach', ''),
  item,
  now(),
  now()
FROM public.app_state a
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(a.data->'strategies', '[]'::jsonb)) AS item
WHERE a.key = 'strategi'
  AND item ? 'slug'
  AND item ? 'title'
ON CONFLICT (slug) DO NOTHING;

-- Initial immutable version snapshot for each migrated strategy.
INSERT INTO public.strategi_strategy_versions (strategy_id, version_number, snapshot, change_note)
SELECT id, 1, metadata, 'Baseline awal dari app_state.strategi; snapshot sumber dipertahankan.'
FROM public.strategi_strategies
ON CONFLICT (strategy_id, version_number) DO NOTHING;
