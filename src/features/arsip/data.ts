export type Klasifikasi = "Internal" | "Terbatas" | "Rahasia";
export type Modul = "Situasi" | "Strategi" | "Produksi" | "Persetujuan" | "Distribusi Sosial" | "Distribusi News" | "Dampak" | "Upload Manual" | "Laporan Lapangan";
export type Jenis = "Dokumen" | "Situasi" | "Strategi" | "Produksi" | "Persetujuan" | "Distribusi" | "Laporan" | "Dataset" | "Laporan Lapangan";
export type Preview = "dokumen" | "situasi" | "strategi" | "artikel" | "video" | "visual" | "keputusan" | "distribusi" | "laporan";

export const JENIS: Jenis[] = ["Dokumen", "Situasi", "Strategi", "Produksi", "Persetujuan", "Distribusi", "Laporan", "Dataset", "Laporan Lapangan"];
export const MODUL: Modul[] = ["Situasi", "Strategi", "Produksi", "Persetujuan", "Distribusi Sosial", "Distribusi News", "Dampak", "Upload Manual", "Laporan Lapangan"];
export const KLASIFIKASI: Klasifikasi[] = ["Internal", "Terbatas", "Rahasia"];

export type Version = { v: string; label: string; at: string; note: string };
export type Activity = { at: string; who: string; what: string; v: string };

// Revisi 5 — verifikasi silang data internal (S27). Laporan internal TIDAK PERNAH dianggap otomatis terverifikasi.
export type VerificationFinding = { text: string; sourceId?: string };
export type Verification = { situationRef?: string | undefined; supported: VerificationFinding[]; conflicting: VerificationFinding[]; unverified: VerificationFinding[] };

/** Simulasi user yang sedang login — dipakai untuk mengisi owner/unit otomatis pada Input Laporan Lapangan. */
export const CURRENT_USER = { name: "Anda (Petugas Lapangan)", unit: "Direktorat Analisis" } as const;

export type ArsipItem = {
  id: string;
  title: string;
  jenis: Jenis;
  label: string; // tampilan jenis spesifik, mis. "News Article", "Campaign"
  modul: Modul;
  ref?: string; // id/slug artifact asal
  owner: string;
  unit: string;
  created: string;
  updated: string;
  version: string;
  klasifikasi: Klasifikasi;
  retention: string;
  access: string[];
  canAccess: boolean;
  downloadable: boolean;
  tags: string[];
  snippet: string;
  content: string; // isi teks untuk pencarian full-text
  preview: Preview;
  related: string[];
  versions: Version[];
  activity: Activity[];
  verification?: Verification;
};

const AUD = (who: string, what: string, at: string, v: string): Activity => ({ who, what, at, v });

export const ITEMS: ArsipItem[] = [
  {
    id: "ARS-001", title: "Demonstrasi Nasional", jenis: "Situasi", label: "Situasi", modul: "Situasi", ref: "demonstrasi-nasional",
    owner: "Tim Analisis", unit: "Direktorat Analisis", created: "3 Okt 2026", updated: "9 Okt 2026", version: "v4", klasifikasi: "Internal",
    retention: "Simpan 5 tahun", access: ["Deputi", "Direktorat terkait", "Analyst"], canAccess: true, downloadable: true,
    tags: ["demonstrasi", "oktober", "nasional", "risiko tinggi"],
    snippet: "Eskalasi percakapan demonstrasi nasional di 12 provinsi dengan risiko Tinggi; klaim kericuhan belum terverifikasi mendominasi awal periode.",
    content: "situasi demonstrasi nasional oktober 2026 eskalasi percakapan 12 provinsi risiko tinggi aktor terdeteksi narasi aksi meluas kericuhan gangguan layanan",
    preview: "situasi", related: ["ARS-002", "ARS-003", "ARS-009", "ARS-010"],
    versions: [
      { v: "v1", label: "Terdeteksi EWS", at: "3 Okt · 07:40", note: "Temuan sistem awal" },
      { v: "v2", label: "Diperbarui", at: "4 Okt · 09:00", note: "Penambahan aktor dan wilayah" },
      { v: "v3", label: "Diperbarui", at: "6 Okt · 15:20", note: "Risiko dinaikkan ke Tinggi" },
      { v: "v4", label: "Diperbarui", at: "9 Okt · 08:00", note: "Kondisi terkini untuk evaluasi Dampak" },
    ],
    activity: [AUD("Sistem EWS", "Situasi terdeteksi", "3 Okt · 07:40", "v1"), AUD("Tim Analisis", "Memperbarui profil risiko", "6 Okt · 15:20", "v3"), AUD("Tim Strategi", "Digunakan pada Strategi", "4 Okt · 10:00", "v2"), AUD("Tim Analisis", "v4 dibuat", "9 Okt · 08:00", "v4")],
  },
  {
    id: "ARS-002", title: "Respons Informasi Demonstrasi Nasional", jenis: "Strategi", label: "Strategi", modul: "Strategi", ref: "respons-informasi-demonstrasi-nasional",
    owner: "Tim Strategi", unit: "Direktorat Strategi Komunikasi", created: "4 Okt 2026", updated: "8 Okt 2026", version: "v2", klasifikasi: "Terbatas",
    retention: "Review retention: 31 Desember 2031", access: ["Deputi", "Direktorat terkait"], canAccess: true, downloadable: false,
    tags: ["strategi", "klarifikasi", "demonstrasi"],
    snippet: "Fokus respons pada penyediaan informasi terverifikasi dan klarifikasi melalui kanal resmi, sosial, dan jaringan news.",
    content: "strategi respons informasi demonstrasi nasional oktober penyediaan informasi terverifikasi klarifikasi kanal resmi sosial news",
    preview: "strategi", related: ["ARS-001", "ARS-003", "ARS-008", "ARS-011"],
    versions: [
      { v: "v1", label: "Draft", at: "4 Okt · 10:00", note: "Disusun dari Situasi v2" },
      { v: "v2", label: "Final", at: "8 Okt · 09:30", note: "Rencana aksi dikunci" },
    ],
    activity: [AUD("Tim Strategi", "Strategi dibuat dari Situasi", "4 Okt · 10:00", "v1"), AUD("Tim Strategi", "v2 dibuat", "8 Okt · 09:30", "v2"), AUD("Tim Editorial", "Digunakan pada Produksi", "7 Okt · 09:15", "v1")],
  },
  {
    id: "ARS-003", title: "Artikel Informasi Demonstrasi Nasional", jenis: "Produksi", label: "News Article", modul: "Produksi", ref: "PRD-021",
    owner: "Tim Editorial", unit: "Direktorat Produksi Konten", created: "7 Okt 2026", updated: "8 Okt 2026", version: "v3", klasifikasi: "Internal",
    retention: "Simpan 5 tahun", access: ["Direktorat terkait", "Editor"], canAccess: true, downloadable: true,
    tags: ["artikel", "klarifikasi", "demonstrasi"],
    snippet: "Artikel klarifikasi: titik aksi, layanan yang tetap berjalan, dan kanal resmi untuk memverifikasi informasi.",
    content: "artikel informasi demonstrasi nasional titik aksi layanan publik tetap berjalan kanal resmi verifikasi informasi klarifikasi",
    preview: "artikel", related: ["ARS-002", "ARS-006", "ARS-007", "ARS-008"],
    versions: [
      { v: "v1", label: "Generated", at: "7 Okt · 09:15", note: "Dibuat dari brief Strategi" },
      { v: "v2", label: "Edited", at: "7 Okt · 10:10", note: "Penyesuaian headline dan klarifikasi" },
      { v: "v3", label: "Approved", at: "7 Okt · 11:05", note: "Disetujui Supervisor" },
    ],
    activity: [AUD("Tim Editorial", "Dokumen dibuat", "7 Okt · 09:10", "v1"), AUD("Tim Editorial", "v2 dibuat", "7 Okt · 10:15", "v2"), AUD("Supervisor", "v3 disetujui", "7 Okt · 11:05", "v3"), AUD("Tim Distribusi", "Digunakan pada Distribusi News", "7 Okt · 13:40", "v3"), AUD("Tim Analisis", "Digunakan pada Laporan Dampak", "9 Okt · 08:30", "v3")],
  },
  {
    id: "ARS-004", title: "Carousel Informasi Demonstrasi Nasional", jenis: "Produksi", label: "Carousel", modul: "Produksi", ref: "PRD-017",
    owner: "Tim Kreatif", unit: "Direktorat Produksi Konten", created: "7 Okt 2026", updated: "8 Okt 2026", version: "v2", klasifikasi: "Internal",
    retention: "Simpan 5 tahun", access: ["Direktorat terkait"], canAccess: true, downloadable: true,
    tags: ["carousel", "visual", "demonstrasi"],
    snippet: "Carousel 5 slide: apa yang terjadi, apa yang belum terverifikasi, layanan publik, dan kanal resmi.",
    content: "carousel informasi demonstrasi nasional 5 slide belum terverifikasi layanan publik kanal resmi",
    preview: "visual", related: ["ARS-003", "ARS-007"],
    versions: [{ v: "v1", label: "Generated", at: "7 Okt · 13:00", note: "Draft awal" }, { v: "v2", label: "Approved", at: "8 Okt · 09:10", note: "Disetujui" }],
    activity: [AUD("Tim Kreatif", "Dokumen dibuat", "7 Okt · 13:00", "v1"), AUD("Supervisor", "v2 disetujui", "8 Okt · 09:10", "v2"), AUD("Tim Digital", "Digunakan pada Distribusi Sosial", "8 Okt · 10:00", "v2")],
  },
  {
    id: "ARS-005", title: "Video Penjelasan Demonstrasi Nasional", jenis: "Produksi", label: "Video", modul: "Produksi", ref: "PRD-021",
    owner: "Tim Kreatif", unit: "Direktorat Produksi Konten", created: "8 Okt 2026", updated: "8 Okt 2026", version: "v1", klasifikasi: "Internal",
    retention: "Simpan 5 tahun", access: ["Direktorat terkait"], canAccess: true, downloadable: true,
    tags: ["video", "penjelasan"],
    snippet: "Video pendek 9:16 berdurasi 45 detik menjelaskan informasi resmi dan jalur verifikasi.",
    content: "video penjelasan demonstrasi nasional pendek 45 detik informasi resmi verifikasi",
    preview: "video", related: ["ARS-003", "ARS-004"],
    versions: [{ v: "v1", label: "Generated", at: "8 Okt · 11:00", note: "Render pertama" }],
    activity: [AUD("Tim Kreatif", "Dokumen dibuat", "8 Okt · 11:00", "v1")],
  },
  {
    id: "ARS-006", title: "Approval Artikel Demonstrasi", jenis: "Persetujuan", label: "Keputusan", modul: "Persetujuan", ref: "PRD-021",
    owner: "Supervisor", unit: "Deputi Komunikasi", created: "7 Okt 2026", updated: "8 Okt 2026", version: "v3", klasifikasi: "Terbatas",
    retention: "Arsip permanen", access: ["Deputi", "Supervisor"], canAccess: true, downloadable: false,
    tags: ["keputusan", "approval"],
    snippet: "Keputusan: Approved untuk Artikel v3. Catatan: klarifikasi sudah merujuk sumber resmi.",
    content: "approval keputusan artikel demonstrasi approved v3 supervisor klarifikasi sumber resmi",
    preview: "keputusan", related: ["ARS-003"],
    versions: [{ v: "v1", label: "Revisi diminta", at: "7 Okt · 09:40", note: "Headline terlalu umum" }, { v: "v2", label: "Dibatalkan", at: "7 Okt · 10:15", note: "Versi baru diajukan" }, { v: "v3", label: "Approved", at: "7 Okt · 11:05", note: "Disetujui" }],
    activity: [AUD("Tim Editorial", "Mengajukan v1", "7 Okt · 09:20", "v1"), AUD("Supervisor", "Meminta revisi", "7 Okt · 09:40", "v1"), AUD("Supervisor", "Menyetujui v3", "7 Okt · 11:05", "v3")],
  },
  {
    id: "ARS-007", title: "Distribusi Sosial Demonstrasi", jenis: "Distribusi", label: "Campaign", modul: "Distribusi Sosial", ref: "CMP-015",
    owner: "Tim Digital", unit: "Direktorat Media Digital", created: "8 Okt 2026", updated: "8 Okt 2026", version: "v1", klasifikasi: "Internal",
    retention: "Simpan 5 tahun", access: ["Direktorat terkait"], canAccess: true, downloadable: true,
    tags: ["campaign", "sosial", "24 posting"],
    snippet: "Campaign Respons Informasi Demonstrasi Nasional: 24 posting di 12 akun dan 3 platform.",
    content: "distribusi sosial campaign respons informasi demonstrasi nasional 24 posting 12 akun 3 platform",
    preview: "distribusi", related: ["ARS-004", "ARS-003", "ARS-009"],
    versions: [{ v: "v1", label: "Approved", at: "8 Okt · 10:00", note: "Paket publikasi disetujui" }],
    activity: [AUD("Tim Digital", "Campaign dibuat", "8 Okt · 09:30", "v1"), AUD("Supervisor", "v1 disetujui", "8 Okt · 10:00", "v1"), AUD("Sistem", "Eksekusi otomatis selesai 23/24", "8 Okt · 18:00", "v1")],
  },
  {
    id: "ARS-008", title: "Distribusi Artikel Demonstrasi Nasional", jenis: "Distribusi", label: "Order", modul: "Distribusi News", ref: "DN-012",
    owner: "Tim Distribusi", unit: "Direktorat Media Digital", created: "7 Okt 2026", updated: "8 Okt 2026", version: "v1", klasifikasi: "Internal",
    retention: "Simpan 5 tahun", access: ["Direktorat terkait"], canAccess: true, downloadable: true,
    tags: ["order", "news", "16 kanal"],
    snippet: "Order distribusi artikel ke 16 kanal NusaKanal; 14 publikasi terverifikasi.",
    content: "distribusi news order artikel demonstrasi nasional 16 kanal nusakanal 14 publikasi terverifikasi url",
    preview: "distribusi", related: ["ARS-003", "ARS-009"],
    versions: [{ v: "v1", label: "Dikirim", at: "7 Okt · 13:40", note: "Order dikirim ke pengelola kanal" }],
    activity: [AUD("Tim Distribusi", "Order dibuat", "7 Okt · 13:20", "v1"), AUD("Supervisor", "Order disetujui", "7 Okt · 13:40", "v1"), AUD("Pengelola Kanal", "14 URL diverifikasi", "8 Okt · 16:00", "v1")],
  },
  {
    id: "ARS-009", title: "Laporan Dampak Demonstrasi Nasional", jenis: "Laporan", label: "Laporan", modul: "Dampak",
    owner: "Tim Analisis", unit: "Direktorat Analisis", created: "9 Okt 2026", updated: "9 Okt 2026", version: "v1", klasifikasi: "Terbatas",
    retention: "Arsip permanen", access: ["Deputi", "Direktorat terkait", "Analyst tertentu"], canAccess: true, downloadable: true,
    tags: ["laporan", "dampak", "oktober"],
    snippet: "Volume mention menurun dari 24.300 menjadi 18.900 selama periode evaluasi; sentimen negatif turun 12 poin pada periode yang sama.",
    content: "laporan dampak demonstrasi nasional oktober volume mention menurun 24.300 18.900 periode evaluasi sentimen negatif turun 12 poin narasi klarifikasi meningkat",
    preview: "laporan", related: ["ARS-001", "ARS-007", "ARS-008", "ARS-010"],
    versions: [{ v: "v1", label: "Generated", at: "9 Okt · 08:30", note: "Ringkasan Pimpinan" }],
    activity: [AUD("Tim Analisis", "Laporan dibuat", "9 Okt · 08:30", "v1")],
  },
  {
    id: "ARS-010", title: "Kajian Stabilitas Sosial Oktober 2026", jenis: "Dokumen", label: "Dokumen", modul: "Upload Manual",
    owner: "Direktorat 71", unit: "Direktorat 71", created: "2 Okt 2026", updated: "2 Okt 2026", version: "v1", klasifikasi: "Rahasia",
    retention: "Review retention: 31 Desember 2031", access: ["Deputi"], canAccess: false, downloadable: false,
    tags: ["kajian", "stabilitas", "oktober"],
    snippet: "Kajian berkala stabilitas sosial bulan Oktober 2026.",
    content: "kajian stabilitas sosial oktober 2026 demonstrasi",
    preview: "dokumen", related: ["ARS-001", "ARS-009"],
    versions: [{ v: "v1", label: "Diunggah", at: "2 Okt · 14:00", note: "Upload manual" }],
    activity: [AUD("Direktorat 71", "Dokumen diunggah", "2 Okt · 14:00", "v1")],
  },
  {
    id: "ARS-011", title: "Kajian & Sumber — Respons Demonstrasi", jenis: "Dokumen", label: "Kajian", modul: "Strategi", ref: "respons-informasi-demonstrasi-nasional",
    owner: "Tim Strategi", unit: "Direktorat Strategi Komunikasi", created: "4 Okt 2026", updated: "5 Okt 2026", version: "v2", klasifikasi: "Internal",
    retention: "Simpan 5 tahun", access: ["Direktorat terkait"], canAccess: true, downloadable: true,
    tags: ["kajian", "sumber", "verifikasi"],
    snippet: "Klaim kericuhan belum terverifikasi; sumber resmi kepolisian dan pemda dijadikan rujukan klarifikasi.",
    content: "kajian sumber respons demonstrasi klaim kericuhan belum terverifikasi sumber resmi kepolisian pemda rujukan klarifikasi",
    preview: "dokumen", related: ["ARS-002", "ARS-003"],
    versions: [{ v: "v1", label: "Draft", at: "4 Okt · 11:00", note: "" }, { v: "v2", label: "Diperbarui", at: "5 Okt · 09:00", note: "Penambahan sumber" }],
    activity: [AUD("Tim Strategi", "Dokumen dibuat", "4 Okt · 11:00", "v1"), AUD("Tim Strategi", "v2 dibuat", "5 Okt · 09:00", "v2")],
  },
  {
    id: "ARS-012", title: "Dataset Mention Demonstrasi 1–9 Okt", jenis: "Dataset", label: "Dataset", modul: "Situasi", ref: "demonstrasi-nasional",
    owner: "Tim Data", unit: "Direktorat Analisis", created: "9 Okt 2026", updated: "9 Okt 2026", version: "v1", klasifikasi: "Terbatas",
    retention: "Simpan 5 tahun", access: ["Analyst tertentu"], canAccess: true, downloadable: false,
    tags: ["dataset", "mention"],
    snippet: "Ekspor mention harian, sentimen, aktor, dan wilayah untuk periode baseline dan current.",
    content: "dataset mention demonstrasi harian sentimen aktor wilayah baseline current",
    preview: "dokumen", related: ["ARS-001", "ARS-009"],
    versions: [{ v: "v1", label: "Diekspor", at: "9 Okt · 07:50", note: "" }],
    activity: [AUD("Tim Data", "Dataset diekspor", "9 Okt · 07:50", "v1")],
  },
    {
    id: "ARS-013", title: "Laporan Lapangan — Demonstrasi Jakarta", jenis: "Laporan Lapangan", label: "Laporan Lapangan", modul: "Laporan Lapangan", ref: "demonstrasi-nasional",
    owner: CURRENT_USER.name, unit: CURRENT_USER.unit, created: "9 Okt 2026", updated: "9 Okt 2026", version: "v1", klasifikasi: "Internal",
    retention: "Simpan 5 tahun", access: ["Direktorat terkait"], canAccess: true, downloadable: true,
    tags: ["lapangan", "demonstrasi", "jakarta", "verifikasi"],
    snippet: "Pengamatan langsung di lokasi demonstrasi Jakarta: massa berangsur membubarkan diri menjelang sore, layanan transportasi umum berangsur normal.",
    content: "laporan lapangan demonstrasi jakarta massa membubarkan diri sore hari layanan transportasi umum normal pengamatan langsung petugas",
    preview: "dokumen", related: ["ARS-001", "ARS-003", "ARS-009", "ARS-010"],
    versions: [{ v: "v1", label: "Dibuat", at: "9 Okt · 16:00", note: "Input laporan lapangan" }],
    activity: [AUD(CURRENT_USER.name, "Laporan lapangan dibuat", "9 Okt · 16:00", "v1"), AUD("Sistem AI", "Verifikasi silang otomatis dijalankan", "9 Okt · 16:05", "v1")],
    verification: {
      situationRef: "demonstrasi-nasional",
      supported: [
        { text: "Volume mention menurun pada periode yang sama, sejalan dengan Laporan Dampak.", sourceId: "ARS-009" },
        { text: "Artikel klarifikasi menyebut layanan publik tetap berjalan di titik yang sama.", sourceId: "ARS-003" },
        { text: "Situasi mencatat penurunan Risk Level dari Tinggi ke Sedang pada periode ini.", sourceId: "ARS-001" },
      ],
      conflicting: [
        { text: "Kajian Stabilitas Sosial menyebut potensi eskalasi lanjutan di lokasi yang sama.", sourceId: "ARS-010" },
      ],
      unverified: [
        { text: "Estimasi jumlah massa yang membubarkan diri belum dapat dikonfirmasi silang dengan sumber lain." },
      ],
    },
  },
];

export const PROVENANCE: { modul: Modul; id: string }[] = [
  { modul: "Situasi", id: "ARS-001" },
  { modul: "Strategi", id: "ARS-002" },
  { modul: "Produksi", id: "ARS-003" },
  { modul: "Persetujuan", id: "ARS-006" },
  { modul: "Distribusi Sosial", id: "ARS-007" },
  { modul: "Distribusi News", id: "ARS-008" },
  { modul: "Dampak", id: "ARS-009" },
];

export const COMPLIANCE = [
  { name: "Laporan Dampak September", status: "Submitted" },
  { name: "Laporan Weekly Direktorat 71", status: "Submitted" },
  { name: "Laporan Distribusi Oktober", status: "Belum Dikirim" },
  { name: "Kajian Mingguan", status: "Due 11 Oktober" },
] as const;

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.\s]/g, " ");
const STOP = new Set(["dan", "di", "yang", "ke", "dari", "pada", "untuk"]);

/** Skor pencarian: judul > tag > isi/snippet. Semua kata kunci harus ditemukan di salah satu bidang. */
export function score(item: ArsipItem, query: string): number {
  const terms = norm(query).split(/\s+/).filter((t) => t && !STOP.has(t));
  if (!terms.length) return 1;
  const title = norm(item.title), tags = norm(item.tags.join(" ") + " " + item.label + " " + item.modul), body = norm(item.content + " " + item.snippet);
  let s = 0;
  for (const t of terms) {
    const hit = (title.includes(t) ? 3 : 0) + (tags.includes(t) ? 2 : 0) + (body.includes(t) ? 1 : 0);
    if (!hit) return 0;
    s += hit;
  }
  return s;
}

export type Filters = { jenis: string; modul: string; klasifikasi: string; owner: string };
export function search(items: ArsipItem[], query: string, f: Filters): ArsipItem[] {
  return items
    .filter((i) => (f.jenis === "Semua" || i.jenis === f.jenis) && (f.modul === "Semua" || i.modul === f.modul) && (f.klasifikasi === "Semua" || i.klasifikasi === f.klasifikasi) && (f.owner === "Semua" || i.owner === f.owner))
    .map((i) => ({ i, s: score(i, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.i);
}

/** Bantuan upload: saran tag & keterkaitan berdasarkan kata pada judul/deskripsi. */
export function suggestForUpload(text: string) {
  const t = norm(text);
  const tags = ["demonstrasi", "kajian", "laporan", "klarifikasi", "oktober", "siber", "bencana", "layanan"].filter((k) => t.includes(k));
  const related = t.includes("demonstrasi") || t.includes("demo") ? ["Situasi: Demonstrasi Nasional", "Strategi: Respons Informasi Demonstrasi Nasional"] : t.includes("siber") ? ["Situasi: Dugaan Serangan Siber"] : [];
  return { tags: tags.length ? tags : ["umum"], related, summary: text.trim() ? `Ringkasan otomatis: dokumen membahas ${tags.length ? tags.join(", ") : "topik umum"}.` : "" };
}

// ---------- Revisi 5 — Input Laporan Lapangan: bantuan AI (simulasi) ----------

export type AiFieldAnalysis = {
  summary: string;
  actors: string[];
  location: string;
  time: string;
  issues: string[];
  tags: string[];
  relatedSituation: string;
  comparison: { label: string; result: string }[];
};

/** Simulasi ekstraksi & perbandingan AI untuk laporan lapangan. Tidak ada klaim integrasi real-time. */
export function analyzeFieldReport(input: { title: string; content: string; location: string; date: string }): AiFieldAnalysis {
  const t = norm(`${input.title} ${input.content}`);
  const issuesPool = ["demonstrasi", "kericuhan", "layanan publik", "lalu lintas", "keamanan"];
  const issues = issuesPool.filter((k) => t.includes(norm(k).split(" ")[0] ?? ""));
  const tags = ["demonstrasi", "lapangan", "verifikasi", "oktober"].filter((k) => t.includes(k) || k === "lapangan" || k === "verifikasi");
  const relatedSituation = t.includes("demonstrasi") || t.includes("demo") || t.includes("jakarta") ? "Demonstrasi Nasional" : "Belum ditemukan situasi yang relevan";
  return {
    summary: input.content.trim()
      ? `Ringkasan otomatis: laporan menyebutkan ${issues.length ? issues.join(", ") : "kondisi umum"} di ${input.location || "lokasi tidak disebutkan"} pada ${input.date || "tanggal tidak disebutkan"}.`
      : "Isi laporan masih kosong — ringkasan otomatis belum dapat dibuat.",
    actors: ["Petugas lapangan", "Warga sekitar lokasi"],
    location: input.location || "Tidak disebutkan",
    time: input.date || "Tidak disebutkan",
    issues: issues.length ? issues : ["umum"],
    tags: tags.length ? tags : ["umum"],
    relatedSituation,
    comparison: [
      { label: "News", result: relatedSituation !== "Belum ditemukan situasi yang relevan" ? "Ditemukan artikel klarifikasi terkait topik yang sama." : "Tidak ditemukan artikel yang relevan." },
      { label: "Social", result: relatedSituation !== "Belum ditemukan situasi yang relevan" ? "Pola percakapan sosial menunjukkan topik serupa pada periode yang sama." : "Tidak ditemukan percakapan yang relevan." },
      { label: "Dokumen internal lain", result: "1 laporan/kajian internal lain membahas topik yang berdekatan — lihat Verifikasi & Keterkaitan Sumber." },
    ],
  };
}

export type FieldReportInput = { title: string; content: string; fileName: string; date: string; location: string; klasifikasi: Klasifikasi };

/** Membangun ArsipItem dari form Input Laporan Lapangan. Owner/unit otomatis dari CURRENT_USER.
 *  Status verifikasi SELALU dimulai sebagai "belum terverifikasi" — tidak pernah otomatis dianggap fakta. */
export function buildFieldReportItem(input: FieldReportInput, ai: AiFieldAnalysis): ArsipItem {
  const id = `ARS-${Date.now()}`;
  return {
    id, title: input.title, jenis: "Laporan Lapangan", label: "Laporan Lapangan", modul: "Laporan Lapangan",
    owner: CURRENT_USER.name, unit: CURRENT_USER.unit, created: "Baru saja", updated: "Baru saja", version: "v1",
    klasifikasi: input.klasifikasi, retention: "Simpan 5 tahun", access: ["Direktorat terkait"], canAccess: true, downloadable: true,
    tags: ai.tags, snippet: ai.summary, content: `${input.title} ${input.content} ${ai.tags.join(" ")} ${input.location} ${input.date}`,
    preview: "dokumen", related: ai.relatedSituation !== "Belum ditemukan situasi yang relevan" ? ["ARS-001"] : [],
    versions: [{ v: "v1", label: "Dibuat", at: "Baru saja", note: input.fileName || "Input manual" }],
    activity: [AUD(CURRENT_USER.name, "Laporan lapangan dibuat", "Baru saja", "v1"), AUD("Sistem AI", "Ringkasan & ekstraksi otomatis dijalankan", "Baru saja", "v1")],
    verification: {
      situationRef: ai.relatedSituation !== "Belum ditemukan situasi yang relevan" ? "demonstrasi-nasional" : undefined,
      supported: [],
      conflicting: [],
      unverified: [{ text: "Laporan baru dibuat — belum melalui proses verifikasi silang manual." }],
    },
  };
}
