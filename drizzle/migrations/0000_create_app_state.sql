CREATE TABLE public.app_state (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.app_state TO anon, authenticated;
GRANT ALL ON public.app_state TO service_role;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared workspace read" ON public.app_state FOR SELECT TO anon, authenticated USING (key IN ('situasi','strategi','aksi'));
CREATE POLICY "Shared workspace insert" ON public.app_state FOR INSERT TO anon, authenticated WITH CHECK (key IN ('situasi','strategi','aksi'));
CREATE POLICY "Shared workspace update" ON public.app_state FOR UPDATE TO anon, authenticated USING (key IN ('situasi','strategi','aksi')) WITH CHECK (key IN ('situasi','strategi','aksi'));