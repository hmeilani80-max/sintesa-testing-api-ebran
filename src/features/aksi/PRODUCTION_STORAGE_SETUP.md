# Penyimpanan Produksi melalui backend/RPC

File ini hanya panduan. Tidak ada migrasi atau deploy yang dijalankan otomatis.

## Isi perubahan
- `production.functions.ts` memvalidasi payload dan memerlukan sesi Supabase terautentikasi melalui `requireSupabaseAuth`.
- Fungsi memanggil RPC `production_save_item`; browser tidak menulis langsung ke tiga tabel.
- SQL RPC menulis item, versi, dan event approval dalam satu transaksi PostgreSQL.
- RPC menolak versi yang lebih lama daripada versi tersimpan dan mengabaikan duplikasi versi/event.

## Langkah manual
1. Tinjau `drizzle/migrations/0009_produksi_server_transactions.sql`.
2. Jalankan SQL itu sendiri di project Supabase yang benar setelah backup dan review.
3. Integrasikan `saveProductionItem` ke mutasi `createProductions`, `saveContent`, `submit`, dan `decide` di `context.tsx`.
4. Hapus effect yang meng-upsert seluruh daftar `productions` dari browser. Jangan aktifkan integrasi UI sebelum RPC berhasil tersedia.
5. Uji pengguna tanpa sesi, pengguna authenticated, stale version, retry event, dan kegagalan insert versi/event.

## Catatan
- Ini tahap backend/RPC; context.tsx belum dialihkan pada commit ini.
- Pastikan RLS policies pada tabel terkait tidak mengizinkan operasi yang lebih luas dari kebutuhan. RPC memakai SECURITY INVOKER, sehingga tetap tunduk pada RLS.
- Aktor audit di SQL diambil dari `auth.uid()`, bukan dipercaya dari payload.
