# Setup Luma AI untuk Produksi Infografis

Integrasi ini memakai Luma Dream Machine Image API dari server. API key tidak boleh diletakkan di variabel `VITE_*`, source code, atau dikirim ke browser.

## Environment variable

Tambahkan secret `LUMA_API_KEY` pada environment server yang menjalankan aplikasi (Vercel Preview untuk pengujian, lalu Production setelah diterima). Nilainya adalah API key dari Luma API Platform. Jangan commit nilai key ke GitHub.

Endpoint server memeriksa sesi Supabase sebelum meneruskan permintaan ke Luma:
- `POST /api/luma-infografis`: memulai pembuatan gambar dan mengembalikan ID generasi.
- `GET /api/luma-infografis?id=<generation-id>`: membaca status generasi dan URL gambar saat selesai.

## Cara uji

1. Pastikan environment Preview memiliki `LUMA_API_KEY` yang valid dan variabel Supabase server yang diperlukan.
2. Login ke aplikasi, buka **Aksi → Produksi → Buat Produksi**, isi brief, lalu pilih **Infografis**.
3. Klik **Generate Produksi** dan tunggu sampai gambar Luma tampil.
4. Pastikan gambar tetap tampil setelah refresh; state produksi disimpan melalui `app_state` pada key `aksi`.
5. Uji key yang tidak valid dan sesi login kedaluwarsa; aplikasi harus menampilkan pesan error tanpa menampilkan key.

## Batasan

- Perubahan kode saja tidak menambahkan secret ke Vercel dan tidak menguji panggilan Luma secara nyata.
- URL asset yang dikembalikan Luma disimpan dalam snapshot produksi. Jika URL asset yang disediakan Luma kedaluwarsa, diperlukan penyimpanan salinan ke object storage yang dikelola aplikasi.
- Endpoint ini hanya mengaktifkan integrasi gambar untuk tipe **Infografis**. Generator tipe lain belum diubah.
