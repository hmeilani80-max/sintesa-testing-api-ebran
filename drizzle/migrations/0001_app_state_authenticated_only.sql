DROP POLICY "Shared workspace read" ON public.app_state;
DROP POLICY "Shared workspace insert" ON public.app_state;
DROP POLICY "Shared workspace update" ON public.app_state;
REVOKE ALL ON public.app_state FROM anon;
CREATE POLICY "Team read" ON public.app_state FOR SELECT TO authenticated USING (key IN ('situasi','strategi','aksi'));
CREATE POLICY "Team insert" ON public.app_state FOR INSERT TO authenticated WITH CHECK (key IN ('situasi','strategi','aksi'));
CREATE POLICY "Team update" ON public.app_state FOR UPDATE TO authenticated USING (key IN ('situasi','strategi','aksi')) WITH CHECK (key IN ('situasi','strategi','aksi'));