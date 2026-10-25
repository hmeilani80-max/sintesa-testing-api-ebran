# Prompt Manager Sintesa (GitHub-managed)

Prompt untuk produksi disimpan sebagai kode dan dikelola melalui GitHub pull request. Tidak ada prompt yang disimpan di browser atau database; tidak diperlukan migrasi atau perubahan RLS Supabase.

## Lokasi

- `src/features/aksi/prompt-templates.ts`: katalog prompt, versi katalog, serta prompt Luma untuk Visual/Infografis.
- `src/features/aksi/ai-writer.functions.ts`: validasi brief, pemanggilan provider, dan validasi hasil; memanggil katalog prompt untuk News, Carousel, Video, dan Audio.
- `src/features/aksi/luma.functions.ts`: endpoint server Luma; memanggil prompt Visual dari katalog.
- `src/features/aksi/prompt-templates.test.ts`: tes prompt catalog.

## Cara mengubah prompt

1. Buat branch fitur dari `main`.
2. Edit prompt di `prompt-templates.ts`; pertahankan aturan bahwa brief adalah input, bukan instruksi yang dapat mengesampingkan aturan editorial.
3. Naikkan `PROMPT_CATALOG_VERSION` bila perubahan mengubah perilaku prompt secara material.
4. Jalankan `npm test -- src/features/aksi/prompt-templates.test.ts`, `npm run lint`, dan `npm run build`.
5. Buka pull request dan periksa preview/build sebelum merge.

## Batasan

- API keys tetap hanya di environment server Vercel; jangan pernah menambahkan secret ke prompt, commit, atau UI.
- Prompt di GitHub adalah konfigurasi statis saat build/deploy, bukan editor prompt live di aplikasi. Perubahan prompt memerlukan commit dan deployment baru.
- Model AI di dropdown belum otomatis dapat mengganti provider untuk setiap item; routing provider saat ini tetap mengikuti adapter backend yang tersedia.
- OpenAI, Anthropic/Claude, dan Grok belum memiliki adapter produksi pada jalur generasi konten.
- Tidak ada perubahan schema, data, atau RLS Supabase.
