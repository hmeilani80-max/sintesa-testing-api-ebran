-- Dedicated relational storage for Temuan Sistem in Situasi.
CREATE TABLE IF NOT EXISTS public.situasi_system_findings (
  slug text PRIMARY KEY,
  name text NOT NULL,
  risk text CHECK (risk IS NULL OR risk IN ('Tinggi', 'Sedang', 'Rendah')),
  status text NOT NULL DEFAULT 'Baru',
  volume bigint NOT NULL DEFAULT 0 CHECK (volume >= 0),
  actor_count bigint NOT NULL DEFAULT 0 CHECK (actor_count >= 0),
  narrative_count bigint NOT NULL DEFAULT 0 CHECK (narrative_count >= 0),
  since_label text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  platforms text[] NOT NULL DEFAULT '{}',
  region_scope text NOT NULL DEFAULT 'Nasional',
  keywords text[] NOT NULL DEFAULT '{}',
  detected_reason text,
  triggers text[] NOT NULL DEFAULT '{}',
  growth text,
  regions_growing text,
  dominant_narrative text,
  warning_status text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS situasi_system_findings_status_idx ON public.situasi_system_findings (status);
CREATE INDEX IF NOT EXISTS situasi_system_findings_risk_idx ON public.situasi_system_findings (risk);

ALTER TABLE public.situasi_system_findings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.situasi_system_findings FROM anon;

DROP POLICY IF EXISTS "System findings read authenticated" ON public.situasi_system_findings;
CREATE POLICY "System findings read authenticated" ON public.situasi_system_findings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "System findings insert authenticated" ON public.situasi_system_findings;
CREATE POLICY "System findings insert authenticated" ON public.situasi_system_findings FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "System findings update authenticated" ON public.situasi_system_findings;
CREATE POLICY "System findings update authenticated" ON public.situasi_system_findings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "System findings delete authenticated" ON public.situasi_system_findings;
CREATE POLICY "System findings delete authenticated" ON public.situasi_system_findings FOR DELETE TO authenticated USING (true);

INSERT INTO public.situasi_system_findings
  (slug, name, risk, status, volume, actor_count, narrative_count, since_label, description, platforms, region_scope, keywords, detected_reason, triggers, growth, regions_growing, dominant_narrative, warning_status, metadata)
VALUES
  ('demonstrasi-nasional', 'Demonstrasi Nasional', 'Tinggi', 'Aktif', 186420, 31870, 18, '5 Okt 2026, 09:40', 'Peningkatan percakapan dan mobilisasi terkait demonstrasi di sejumlah wilayah.', ARRAY['X','TikTok','Threads','News'], '6 wilayah meningkat', ARRAY['demonstrasi','aksi nasional','mobilisasi'], 'Lonjakan volume dan perluasan wilayah', ARRAY['Lonjakan volume +63%','Perluasan ke 6 wilayah','428 aktor baru dalam 24 jam'], '+63%', '6 wilayah meningkat', 'Aksi meluas ke sejumlah kota', 'Early warning aktif', '{"source":"Temuan Sistem"}'::jsonb),
  ('dugaan-serangan-siber', 'Dugaan Serangan Siber', 'Tinggi', 'Aktif', 94720, 18240, 11, '6 Okt 2026, 13:15', 'Pertumbuhan narasi tidak terverifikasi terkait dugaan kebocoran data.', ARRAY['X','TikTok','News'], 'Nasional', ARRAY['serangan siber','kebocoran data'], 'Pertumbuhan narasi tidak terverifikasi', ARRAY['Volume meningkat +48%','Penyebaran berskala nasional','214 aktor baru dalam 24 jam'], '+48%', 'Skala nasional', 'Dugaan kebocoran data', 'Early warning aktif', '{"source":"Temuan Sistem"}'::jsonb),
  ('gangguan-layanan-publik', 'Gangguan Layanan Publik', 'Sedang', 'Aktif', 58340, 10210, 8, '6 Okt 2026, 16:20', 'Peningkatan laporan gangguan layanan di beberapa kanal publik.', ARRAY['X','Instagram','News'], 'Jawa Barat', ARRAY['layanan publik','gangguan'], 'Perubahan pola laporan lintas kanal', ARRAY['Volume meningkat +21%','Tiga layanan disebut berulang','Aktivitas terkonsentrasi di Jawa Barat'], '+21%', '3 wilayah meningkat', 'Layanan belum kembali normal', 'Dalam pemantauan', '{"source":"Temuan Sistem"}'::jsonb),
  ('informasi-bencana', 'Informasi Tidak Terverifikasi terkait Bencana', 'Sedang', 'Baru', 41820, 7940, 6, '7 Okt 2026, 07:10', 'Informasi belum terverifikasi menyebar setelah kejadian bencana regional.', ARRAY['Facebook','TikTok','WhatsApp'], 'Sulawesi Selatan', ARRAY['bencana','informasi darurat'], 'Lonjakan konten dengan sumber tidak jelas', ARRAY['Volume meningkat +18%','Dua narasi baru dalam 6 jam','Sumber primer belum ditemukan'], '+18%', '2 wilayah meningkat', 'Informasi darurat belum terverifikasi', 'Perlu verifikasi', '{"source":"Temuan Sistem"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, risk=EXCLUDED.risk, status=EXCLUDED.status, volume=EXCLUDED.volume,
  actor_count=EXCLUDED.actor_count, narrative_count=EXCLUDED.narrative_count,
  since_label=EXCLUDED.since_label, description=EXCLUDED.description, platforms=EXCLUDED.platforms,
  region_scope=EXCLUDED.region_scope, keywords=EXCLUDED.keywords, detected_reason=EXCLUDED.detected_reason,
  triggers=EXCLUDED.triggers, growth=EXCLUDED.growth, regions_growing=EXCLUDED.regions_growing,
  dominant_narrative=EXCLUDED.dominant_narrative, warning_status=EXCLUDED.warning_status,
  metadata=EXCLUDED.metadata, updated_at=now();