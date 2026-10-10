-- Situasi schema audit follow-up: enforce the known monitoring-to-finding relationship.
-- topic_slug fields across analytical tables are intentionally polymorphic because
-- current route slugs can refer to either situasi_topics or situasi_system_findings.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'situasi_topic_monitoring_finding_slug_fkey'
      AND conrelid = 'public.situasi_topic_monitoring'::regclass
  ) THEN
    ALTER TABLE public.situasi_topic_monitoring
      ADD CONSTRAINT situasi_topic_monitoring_finding_slug_fkey
      FOREIGN KEY (finding_slug)
      REFERENCES public.situasi_system_findings(slug)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_situasi_topic_monitoring_finding_slug
  ON public.situasi_topic_monitoring(finding_slug);

-- Related usernames currently include two values without matching profiles.
-- Do not add a FK to related_username until those records are reconciled.
CREATE INDEX IF NOT EXISTS idx_situasi_account_relations_related_username
  ON public.situasi_account_relations(related_username);
