create table if not exists public.production_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  output_type text not null unique check (output_type in ('News Article', 'Infografis', 'Carousel', 'Video Pendek', 'Audio / Podcast')),
  output_family text not null check (output_family in ('News', 'Visual', 'Video', 'Audio')),
  prompt_text text not null check (char_length(prompt_text) between 20 and 20000),
  version integer not null default 1 check (version > 0),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.production_prompt_templates enable row level security;

drop policy if exists production_prompt_templates_select_authenticated on public.production_prompt_templates;
create policy production_prompt_templates_select_authenticated
  on public.production_prompt_templates for select to authenticated
  using (true);

drop policy if exists production_prompt_templates_insert_authenticated on public.production_prompt_templates;
create policy production_prompt_templates_insert_authenticated
  on public.production_prompt_templates for insert to authenticated
  with check ((select auth.uid()) is not null and (updated_by is null or updated_by = (select auth.uid())));

drop policy if exists production_prompt_templates_update_authenticated on public.production_prompt_templates;
create policy production_prompt_templates_update_authenticated
  on public.production_prompt_templates for update to authenticated
  using (true)
  with check ((updated_by is null or updated_by = (select auth.uid())));

grant select, insert, update on public.production_prompt_templates to authenticated;
revoke all on public.production_prompt_templates from anon;

insert into public.production_prompt_templates (output_type, output_family, prompt_text)
values
('News Article', 'News', E'Anda adalah editor berita Indonesia yang faktual dan netral. Gunakan hanya fakta dari brief; jangan mengarang angka, kutipan, narasumber, pernyataan, tanggal, atau sumber. Jika informasi belum tersedia, nyatakan sebagai hal yang perlu diverifikasi. Tulis berita lengkap dalam bahasa Indonesia, judul informatif, lead yang menjawab unsur berita yang tersedia, minimal 3 paragraf isi, dan minimal 3 tag. Keluarkan JSON valid dengan field headline, subtitle, lead, body, tags, slides, highlights, caption, duration (0), format ("16:9"), voiceOver (false), voice, transcript. Untuk field yang tidak relevan gunakan nilai kosong atau array kosong.\n\nBRIEF:\nTema: {{theme}}\nPesan utama: {{message}}\nFakta/poin: {{points}}\nGaya: {{style}}\nAudiens: {{audience}}\nWilayah: {{region}}\nKanal: {{channels}}'),
('Infografis', 'Visual', E'Buat arahan visual infografis editorial berbahasa Indonesia dengan komposisi portrait 9:16, hierarki visual jelas, grid bersih, kontras aksesibel, palet navy-putih-teal, dan ruang kosong untuk tipografi yang akan ditambahkan aplikasi. Jangan render teks acak, angka, logo, watermark, atau chart dengan nilai rekaan. Gunakan fakta yang diberikan saja; bila tidak ada fakta, buat ilustrasi konseptual tanpa angka.\n\nTema: {{theme}}\nPesan utama: {{message}}\nFakta: {{points}}\nGaya visual: {{style}}\nAudiens: {{audience}}\nWilayah: {{region}}'),
('Carousel', 'Visual', E'Anda adalah editor visual newsroom Indonesia. Buat carousel informatif, faktual, ringkas, minimal 5 slide. Jangan mengarang angka atau fakta di luar brief. Keluarkan JSON valid dengan field headline, subtitle, lead, body, tags, slides (array label dan text minimal 5), highlights, caption, duration (0), format ("9:16"), voiceOver (false), voice, transcript.\n\nTema: {{theme}}\nPesan utama: {{message}}\nFakta/poin: {{points}}\nGaya: {{style}}\nAudiens: {{audience}}\nWilayah: {{region}}\nKanal: {{channels}}'),
('Video Pendek', 'Video', E'Anda adalah penulis naskah video pendek profesional dalam bahasa Indonesia. Buat struktur hook, konteks, fakta yang tersedia, penjelasan, dan penutup. Jangan mengarang fakta atau sumber. Keluarkan JSON valid dengan field headline, subtitle, lead, body, tags, slides, highlights, caption, duration (60-180 detik), format ("9:16"), voiceOver (true), voice, transcript yang lengkap dan siap dibacakan.\n\nTema: {{theme}}\nPesan utama: {{message}}\nFakta/poin: {{points}}\nGaya: {{style}}\nAudiens: {{audience}}\nWilayah: {{region}}\nKanal: {{channels}}'),
('Audio / Podcast', 'Audio', E'Anda adalah penulis naskah audio/podcast bahasa Indonesia. Buat pembukaan, konteks, uraian berdasarkan fakta yang diberikan, transisi, dan penutup. Jangan mengarang fakta, kutipan, atau sumber. Keluarkan JSON valid dengan field headline, subtitle, lead, body, tags, slides, highlights, caption, duration (60-180 detik), format ("9:16"), voiceOver (true), voice, transcript lengkap yang siap dibacakan.\n\nTema: {{theme}}\nPesan utama: {{message}}\nFakta/poin: {{points}}\nGaya: {{style}}\nAudiens: {{audience}}\nWilayah: {{region}}\nKanal: {{channels}}')
on conflict (output_type) do nothing;
