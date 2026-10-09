export type Direction = "Meningkat" | "Menurun" | "Stabil";
export type Row = { name: string; before: number; now: number };

export const PERIODS = [
  { id: "default", label: "Baseline 1–3 Okt · Respons 4–8 Okt · Current 9 Okt", baseline: "1–3 Oktober 2026", response: "4–8 Oktober 2026", current: "9 Oktober 2026" },
  { id: "short", label: "Baseline 3 Okt · Respons 4–8 Okt · Current 9 Okt", baseline: "3 Oktober 2026", response: "4–8 Oktober 2026", current: "9 Oktober 2026" },
] as const;

export function delta(before: number, now: number) {
  return now - before;
}
export function direction(before: number, now: number, tolerance = 0.05): Direction {
  if (before === 0) return now > 0 ? "Meningkat" : "Stabil";
  const r = (now - before) / before;
  return Math.abs(r) <= tolerance ? "Stabil" : r > 0 ? "Meningkat" : "Menurun";
}
export function pctChange(before: number, now: number) {
  return Math.round(((now - before) / before) * 100);
}
export function costPer(cost: number, outputs: number) {
  return outputs > 0 ? Math.round(cost / outputs) : 0;
}
export const fmt = (n: number) => n.toLocaleString("id-ID");
export function fmtDelta(d: number, unit = "") {
  if (d === 0) return `= 0${unit}`;
  return `${d > 0 ? "↑" : "↓"} ${fmt(Math.abs(d))}${unit}`;
}

export const summary = [
  { label: "Volume Mention", before: "24.300", now: "18.900", delta: `↓ ${Math.abs(pctChange(24300, 18900))}%`, down: true },
  { label: "Sentimen Negatif", before: "46%", now: "34%", delta: "↓ 12 poin", down: true },
  { label: "Wilayah Aktif", before: "6", now: "4", delta: "↓ 2 wilayah", down: true },
  { label: "Aktor Terdeteksi", before: "142", now: "97", delta: "↓ 45 aktor", down: true },
  { label: "Early Warning", before: "3", now: "1", delta: "↓ 2 peringatan", down: true },
  { label: "Risk Level", before: "Tinggi", now: "Sedang", delta: "Turun satu tingkat", down: true },
];

export type NarrativeRow = Row & { mentionsBefore: number; mentionsNow: number };
// PoC counts align with the existing share and total mention volume (24,300 → 18,900).
export const narratives: NarrativeRow[] = [
  { name: "Aksi meluas ke banyak kota", before: 38, now: 22, mentionsBefore: 9234, mentionsNow: 4158 },
  { name: "Klarifikasi kondisi", before: 8, now: 21, mentionsBefore: 1944, mentionsNow: 3969 },
  { name: "Kericuhan", before: 17, now: 14, mentionsBefore: 4131, mentionsNow: 2646 },
  { name: "Gangguan layanan publik", before: 12, now: 6, mentionsBefore: 2916, mentionsNow: 1134 },
  { name: "Aksi damai", before: 9, now: 15, mentionsBefore: 2187, mentionsNow: 2835 },
];

export const actors: (Row & { shareBefore: number; shareNow: number })[] = [
  { name: "@forum_mahasiswa", before: 420, now: 260, shareBefore: 18, shareNow: 11 },
  { name: "@suara_warga", before: 180, now: 310, shareBefore: 8, shareNow: 13 },
  { name: "@pantau_kota", before: 225, now: 218, shareBefore: 10, shareNow: 9 },
  { name: "@kabar_daerah", before: 95, now: 174, shareBefore: 4, shareNow: 7 },
  { name: "@media_nusantara", before: 160, now: 118, shareBefore: 7, shareNow: 5 },
];

export const regions: Row[] = [
  { name: "Jakarta", before: 4200, now: 2900 },
  { name: "Jawa Barat", before: 2800, now: 3400 },
  { name: "Jawa Tengah", before: 2100, now: 1500 },
  { name: "Jawa Timur", before: 1900, now: 1200 },
  { name: "Yogyakarta", before: 1150, now: 980 },
];

export const platforms: Row[] = [
  { name: "X", before: 9200, now: 6800 },
  { name: "TikTok", before: 5100, now: 6000 },
  { name: "Instagram", before: 3400, now: 2900 },
  { name: "Facebook", before: 1900, now: 1450 },
  { name: "YouTube", before: 1200, now: 1050 },
  { name: "Threads", before: 700, now: 600 },
  { name: "News", before: 2800, now: 2100 },
];

export const volumeSeries = [
  { date: "1 Okt", phase: "Baseline", volume: 24600 },
  { date: "2 Okt", phase: "Baseline", volume: 24100 },
  { date: "3 Okt", phase: "Baseline", volume: 24300 },
  { date: "4 Okt", phase: "Respons", volume: 23400 },
  { date: "5 Okt", phase: "Respons", volume: 22100 },
  { date: "6 Okt", phase: "Respons", volume: 21200 },
  { date: "7 Okt", phase: "Respons", volume: 20300 },
  { date: "8 Okt", phase: "Respons", volume: 19600 },
  { date: "9 Okt", phase: "Current", volume: 18900 },
];

export const sentimentCompare = [
  { name: "Negatif", before: 46, now: 34 },
  { name: "Netral", before: 35, now: 41 },
  { name: "Positif", before: 19, now: 25 },
];

export const timeline = [
  { date: "4 Oktober", kind: "Respons", text: "Distribusi Sosial dimulai — 12 akun aktif di X, Instagram, dan TikTok." },
  { date: "5 Oktober", kind: "Perubahan Metrik", text: "Pada periode yang sama, volume mention turun dari 24.300 (baseline) menjadi 22.100." },
  { date: "6 Oktober", kind: "Respons", text: "Publikasi News mulai tayang di 16 kanal." },
  { date: "7 Oktober", kind: "Perubahan Metrik", text: "Share narasi “Klarifikasi kondisi” meningkat dari 8% menjadi 16%." },
  { date: "8 Oktober", kind: "Perubahan Metrik", text: "Sentimen negatif turun menjadi 36%." },
  { date: "9 Oktober", kind: "Situasi", text: "Risk Level berubah dari Tinggi menjadi Sedang." },
];

export const social = { planned: 24, published: 23, failed: 1, views: 486000, interactions: 31400, shares: 5200, cost: 18000000 };

// Revisi 10 — S62: metrik per platform. Watch Time hanya berlaku untuk platform/konten video.
// Nilai yang tidak tersedia dibiarkan undefined (bukan 0) dan ditampilkan sebagai "Data Tidak Tersedia".
export const NOT_AVAILABLE = "Data Tidak Tersedia";
export type SocialPlatformMetric = { platform: string; published: number; views?: number | undefined; interactions?: number | undefined; shares?: number | undefined; watchTimeSec?: number; isVideoPlatform: boolean };
export const socialBreakdown: SocialPlatformMetric[] = [
  { platform: "X", published: 8, views: 148000, interactions: 9800, shares: 2100, isVideoPlatform: false },
  { platform: "Instagram", published: 8, views: 126000, interactions: 8600, shares: 1400, isVideoPlatform: false },
  { platform: "TikTok", published: 7, views: 212000, interactions: 13000, shares: 3200, watchTimeSec: 184000, isVideoPlatform: true },
];

export type SocialContentMetric = { id: string; title: string; platform: string; type: "Video" | "Post" | "Carousel"; published: string; views?: number | undefined; interactions?: number | undefined; shares?: number | undefined; watchTimeSec?: number };
export const socialContentBreakdown: SocialContentMetric[] = [
  { id: "SC-1", title: "Video Penjelasan Demonstrasi Nasional", platform: "TikTok", type: "Video", published: "8 Okt", views: 92000, interactions: 6100, shares: 1500, watchTimeSec: 184000 },
  { id: "SC-2", title: "Carousel Informasi Demonstrasi Nasional", platform: "Instagram", type: "Carousel", published: "7 Okt", views: 54000, interactions: 3900, shares: 620 },
  { id: "SC-3", title: "Thread Klarifikasi Demonstrasi Nasional", platform: "X", type: "Post", published: "8 Okt", views: undefined, interactions: 2600, shares: 410 },
];

export const news = { target: 16, live: 14, inProgress: 2, verified: 14, cost: 32000000 };
// Revisi 10 — S62: Website Visits & Page Views ditampilkan jika tersedia; belum terintegrasi pada PoC ini → undefined.
export type NewsMetrics = { publishedArticles: number; verifiedUrls: number; websiteVisits?: number | undefined; pageViews?: number | undefined };
export const newsMetrics: NewsMetrics = { publishedArticles: 14, verifiedUrls: 14, websiteVisits: undefined, pageViews: undefined };
export const newsChannels = [
  { channel: "NusaKanal Nasional", status: "Tayang", time: "6 Okt 10:15" },
  { channel: "NusaKanal Jawa Barat", status: "Tayang", time: "6 Okt 11:20" },
  { channel: "NusaKanal Jawa Tengah", status: "Tayang", time: "6 Okt 13:05" },
  { channel: "NusaKanal Jawa Timur", status: "Tayang", time: "6 Okt 14:30" },
  { channel: "NusaKanal Bali", status: "Dalam Pengerjaan", time: "—" },
];
export const completionRate = (live: number, target: number) => Math.round((live / target) * 1000) / 10;

export const sampleRecords: Record<string, { post: string; platform: string; time: string }[]> = {
  "Aksi meluas ke banyak kota": [
    { post: "@forum_mahasiswa: Aksi lanjutan direncanakan di sejumlah kota.", platform: "X", time: "2 Okt 14:32" },
    { post: "@pantau_kota: Agenda aksi lanjutan masih menunggu konfirmasi panitia daerah.", platform: "X", time: "9 Okt 08:40" },
  ],
  "Klarifikasi kondisi": [
    { post: "@suara_warga: Informasi kondisi lapangan perlu dikonfirmasi melalui kanal resmi.", platform: "Instagram", time: "2 Okt 11:05" },
    { post: "@media_nusantara: Klarifikasi terbaru menyebut layanan utama tetap beroperasi.", platform: "News", time: "9 Okt 09:20" },
  ],
  "Kericuhan": [
    { post: "@pantau_kota: Laporan kericuhan di satu titik masih menunggu verifikasi.", platform: "X", time: "2 Okt 15:10" },
    { post: "@kabar_daerah: Situasi di titik yang dipantau kembali tertib.", platform: "News", time: "9 Okt 08:30" },
  ],
  "Gangguan layanan publik": [
    { post: "@suara_warga: Rute layanan dialihkan sementara di sekitar lokasi aksi.", platform: "X", time: "2 Okt 12:15" },
    { post: "@pantau_kota: Layanan transportasi kembali mengikuti rute normal.", platform: "Instagram", time: "9 Okt 07:45" },
  ],
  "Aksi damai": [
    { post: "@forum_mahasiswa: Peserta diminta menjaga ketertiban selama aksi.", platform: "X", time: "2 Okt 09:10" },
    { post: "@kabar_daerah: Peserta menyampaikan aspirasi secara tertib dan damai.", platform: "News", time: "9 Okt 10:05" },
  ],
  "@forum_mahasiswa": [
    { post: "Agenda konsolidasi lanjutan akan diumumkan setelah evaluasi hari ini.", platform: "X", time: "9 Okt 08:10" },
    { post: "Aksi lanjutan direncanakan di sejumlah kota.", platform: "X", time: "2 Okt 14:32" },
  ],
};
// Revisi 11 — S66: Jadwalkan Laporan Otomatis & daftar Laporan Terjadwal.
export type ScheduledReport = { id: string; name: string; jenis: string; frekuensi: "Harian" | "Mingguan" | "Bulanan" | "Per Situasi"; penerima?: string };
export const SCHEDULED_REPORTS: ScheduledReport[] = [
  { id: "SCH-1", name: "Daily Situation Brief", jenis: "Ringkasan Pimpinan", frekuensi: "Harian" },
  { id: "SCH-2", name: "Weekly Impact Report", jenis: "Laporan Analitik", frekuensi: "Mingguan" },
  { id: "SCH-3", name: "Monthly Evaluation", jenis: "Laporan Lengkap", frekuensi: "Bulanan" },
];

export function recordsFor(name: string) {
  return sampleRecords[name] ?? [
    { post: `Percakapan terkait “${name}” pada periode current.`, platform: "X", time: "9 Okt 09:20" },
    { post: `Percakapan terkait “${name}” pada periode baseline.`, platform: "Instagram", time: "2 Okt 11:05" },
  ];
}
