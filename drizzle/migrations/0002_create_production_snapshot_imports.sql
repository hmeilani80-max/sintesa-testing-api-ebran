-- Preserve the current /aksi/Produksi frontend seed as an auditable snapshot.
-- The live database migration was applied before this file was added to GitHub.
CREATE TABLE IF NOT EXISTS public.production_snapshot_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source = 'frontend_snapshot'),
  snapshot_key text NOT NULL,
  item_count integer NOT NULL CHECK (item_count >= 0),
  payload jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  notes text NOT NULL DEFAULT 'Imported from current frontend seed data; statuses preserved as-is.'
);

CREATE INDEX IF NOT EXISTS production_snapshot_imports_key_imported_at_idx
  ON public.production_snapshot_imports (snapshot_key, imported_at DESC);

ALTER TABLE public.production_snapshot_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Production snapshots read authenticated" ON public.production_snapshot_imports;
CREATE POLICY "Production snapshots read authenticated"
  ON public.production_snapshot_imports FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Production snapshots insert authenticated" ON public.production_snapshot_imports;
CREATE POLICY "Production snapshots insert authenticated"
  ON public.production_snapshot_imports FOR INSERT TO authenticated WITH CHECK (true);
