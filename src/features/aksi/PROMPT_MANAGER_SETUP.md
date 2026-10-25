# Prompt Manager Sintesa (Supabase)

Prompt produksi disimpan di `public.production_prompt_templates` dan dapat diedit langsung di aplikasi melalui **Aksi → Produksi → Buat Produksi → Langkah 3 → Kelola Prompt AI**.

## Lokasi kode

- `src/features/aksi/PromptManagerDialog.tsx`: editor aplikasi untuk memilih tipe output, mengedit prompt, dan menyimpan ke Supabase.
- `src/features/aksi/prompt-store.server.ts`: membaca prompt aktif menggunakan sesi pengguna yang terautentikasi dan mengisi placeholder brief.
- `src/features/aksi/ai-writer.functions.ts`: menggunakan prompt database untuk News Article, Carousel, Video Pendek, dan Audio / Podcast.
- `src/features/aksi/luma.functions.ts`: menggunakan prompt database untuk Infografis Luma.
- `supabase/migrations/20261026000100_create_production_prompt_templates.sql`: tabel, RLS, grant, dan prompt awal.

## Placeholder

`{{theme}}`, `{{message}}`, `{{points}}`, `{{style}}`, `{{audience}}`, `{{region}}`, `{{channels}}`.

## Akses dan keamanan

- Hanya pengguna terautentikasi yang dapat membaca atau mengedit prompt.
- Prompt adalah konfigurasi workspace bersama bagi pengguna yang sudah login.
- API keys tetap di environment server Vercel dan tidak disimpan di database.
- Jika lookup database gagal, backend memakai prompt statis fallback agar generasi tidak langsung berhenti.
- Kolom `version` naik setiap kali prompt disimpan; tabel saat ini menyimpan versi terkini per output type, bukan arsip seluruh versi.
