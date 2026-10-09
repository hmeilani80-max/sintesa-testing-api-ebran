import { getRiskProfile, type SituationEntry } from "@/features/situasi/data";

export type StrategyStatus = "Draf" | "Dalam Penyusunan" | "Siap Dilaksanakan" | "Diteruskan ke Aksi";
export type ChannelApproach = "News-led" | "Social-led" | "Integrated";

export type Strategy = {
  slug: string;
  title: string;
  source: "Situasi" | "Input Manual";
  situationSlug?: string | undefined;
  situationName?: string | undefined;
  status: StrategyStatus;
  updated: string;
  objective: string;
  context?: string | undefined;
  audience?: string | undefined;
  region?: string | undefined;
  platforms: string[];
  approach?: ChannelApproach | undefined;
};

export type StrategyTask = { id: string; title: string; type: string; platforms: string[]; count: string; focus: string; priority: "Tinggi" | "Sedang" | "Rendah" };

export const PLATFORMS = ["X", "Instagram", "TikTok", "Facebook", "YouTube", "Threads", "News"] as const;
const SOCIAL = ["X", "Instagram", "TikTok", "Facebook", "YouTube", "Threads"];

export const initialStrategies: Strategy[] = [
  { slug: "respons-informasi-demonstrasi-nasional", title: "Respons Informasi Demonstrasi Nasional", source: "Situasi", situationSlug: "demonstrasi-nasional", situationName: "Demonstrasi Nasional", status: "Dalam Penyusunan", updated: "10 menit lalu", objective: "Meningkatkan ketersediaan informasi terverifikasi mengenai kondisi demonstrasi dan mengurangi ruang penyebaran informasi yang belum terverifikasi.", platforms: ["X", "TikTok", "News"], region: "Jakarta, Bandung" },
  { slug: "klarifikasi-isu-kebocoran-data", title: "Klarifikasi Isu Kebocoran Data", source: "Situasi", situationSlug: "dugaan-serangan-siber", situationName: "Dugaan Serangan Siber", status: "Siap Dilaksanakan", updated: "1 jam lalu", objective: "Memberikan klarifikasi resmi dan terverifikasi terkait dugaan kebocoran data.", platforms: ["X", "TikTok", "News"], region: "Nasional" },
  { slug: "penguatan-informasi-harga-pangan", title: "Penguatan Informasi Harga Pangan", source: "Input Manual", status: "Draf", updated: "2 jam lalu", objective: "Memperluas jangkauan informasi resmi mengenai ketersediaan dan harga pangan.", context: "Persepsi publik terhadap kenaikan harga beras di sejumlah daerah.", audience: "Publik umum dan pelaku pasar", region: "Nasional", platforms: ["News", "Instagram"] },
];

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Dominant channel decides the approach: News only → News-led, social only → Social-led, both → Integrated. */
export function getChannelApproach(platforms: string[]): ChannelApproach {
  const news = platforms.includes("News");
  const social = platforms.some((p) => SOCIAL.includes(p));
  if (news && social) return "Integrated";
  if (news) return "News-led";
  return "Social-led";
}

export function getActionPlan(platforms: string[]): StrategyTask[] {
  const approach = getChannelApproach(platforms);
  if (approach === "News-led") return [
    { id: "01", title: "Artikel Penjelasan", type: "News Article", platforms: ["News"], count: "2 artikel", focus: "Penjelasan faktual situasi terkini.", priority: "Tinggi" },
    { id: "02", title: "Rilis Resmi", type: "Press Release", platforms: ["News"], count: "1 rilis", focus: "Pernyataan resmi dan data pendukung.", priority: "Tinggi" },
    { id: "03", title: "FAQ Publik", type: "FAQ", platforms: ["News"], count: "1 FAQ", focus: "Jawaban atas pertanyaan yang sering muncul.", priority: "Sedang" },
    { id: "04", title: "Amplifikasi Sosial", type: "Social Post", platforms: platforms.filter((p) => p !== "News").length ? platforms.filter((p) => p !== "News") : ["X", "Instagram"], count: "3 post", focus: "Distribusi tautan sumber resmi.", priority: "Sedang" },
  ];
  if (approach === "Social-led") {
    const lead = platforms.includes("TikTok") ? "TikTok" : platforms[0] ?? "X";
    return lead === "TikTok" ? [
      { id: "01", title: "Video Pendek", type: "Vertical Video", platforms: ["TikTok"], count: "3 video", focus: "Penjelasan singkat berbasis fakta.", priority: "Tinggi" },
      { id: "02", title: "Visual Explainer", type: "Visual", platforms: ["TikTok", "Instagram"], count: "2 visual", focus: "Ringkasan fakta utama.", priority: "Sedang" },
      { id: "03", title: "Artikel Sumber", type: "Source Article", platforms: ["News"], count: "1 artikel", focus: "Rujukan lengkap untuk konten sosial.", priority: "Sedang" },
    ] : [
      { id: "01", title: "Rapid Update", type: "Social Post", platforms: [lead], count: "5 post", focus: "Update singkat dan fakta utama.", priority: "Tinggi" },
      { id: "02", title: "Thread Penjelasan", type: "Thread", platforms: [lead], count: "1 thread", focus: "Kronologi dan konteks.", priority: "Tinggi" },
      { id: "03", title: "Artikel Sumber", type: "Source Article", platforms: ["News"], count: "1 artikel", focus: "Rujukan lengkap.", priority: "Sedang" },
      { id: "04", title: "Visual Card", type: "Visual", platforms: [lead], count: "1 visual", focus: "Fakta utama dalam satu visual.", priority: "Sedang" },
    ];
  }
  return [
    { id: "01", title: "Artikel Utama", type: "News Article", platforms: ["News"], count: "1 artikel", focus: "Penjelasan faktual mengenai situasi terkini.", priority: "Tinggi" },
    { id: "02", title: "Rapid Update", type: "Social Post", platforms: ["X"], count: "3 post", focus: "Fakta utama dan update situasi.", priority: "Tinggi" },
    { id: "03", title: "Video Penjelasan", type: "Vertical Video", platforms: ["TikTok", "Instagram"], count: "1 video", focus: "Penjelasan singkat dan informasi terverifikasi.", priority: "Sedang" },
    { id: "04", title: "Visual Summary", type: "Carousel", platforms: ["Instagram"], count: "1 carousel", focus: "Ringkasan situasi dan fakta utama.", priority: "Sedang" },
  ];
}

export function getStrategyContext(strategy: Strategy, situation?: SituationEntry) {
  const isDemo = situation?.slug === "demonstrasi-nasional";
  const profile = situation ? getRiskProfile(situation) : undefined;
  const platforms = isDemo ? ["X", "TikTok", "News"] : strategy.platforms;
  return {
    source: situation?.source ?? "Input Manual",
    risk: situation?.risk ?? (situation ? situation.status : "Belum dinilai"),
    growth: situation?.growth ?? (situation ? "+12%" : "—"),
    platforms,
    regions: isDemo ? "Jakarta, Bandung" : strategy.region ?? situation?.regionScope ?? "—",
    sentiment: profile ? `${profile.negativeSentiment} Negatif` : "—",
    narrative: situation?.dominantNarrative ?? profile?.drivingNarrative ?? "—",
    newActors: profile?.newActors ?? "—",
    summary: isDemo
      ? "Percakapan mengenai Demonstrasi Nasional mengalami peningkatan 63% dalam periode pemantauan. Aktivitas terutama berkembang di X, TikTok, dan News dengan konsentrasi di Jakarta dan Bandung, disertai meningkatnya narasi belum terverifikasi terkait kericuhan."
      : situation ? `${situation.description} Aktivitas terpantau di ${platforms.join(", ")}.` : strategy.context ?? "Konteks dimasukkan secara manual oleh pengguna.",
    highlights: isDemo
      ? ["X dan TikTok menjadi kanal dengan pertumbuhan tercepat.", "News memiliki peran penting dalam pembentukan informasi rujukan.", "Narasi “aksi meluas” menjadi narasi dominan.", "Jakarta dan Bandung menjadi wilayah prioritas pemantauan."]
      : [`Kanal utama: ${platforms.join(", ")}.`, `Wilayah: ${strategy.region ?? situation?.regionScope ?? "Nasional"}.`],
  };
}

export const studyFacts = {
  verified: ["Aktivitas percakapan meningkat 63%.", "Peningkatan terpantau pada enam wilayah.", "X dan TikTok memiliki pertumbuhan volume tertinggi."],
  claims: ["Aksi akan meluas ke kota tambahan.", "Jumlah peserta diperkirakan meningkat."],
  unverified: ["Klaim mengenai kericuhan pada lokasi tertentu.", "Informasi mengenai penutupan fasilitas publik."],
};

export const sources = [
  { statement: "Volume naik 63%", source: "Data SINTESA", platform: "Multi-platform", time: "7 Okt", status: "Terverifikasi" },
  { statement: "Aksi direncanakan di Bandung", source: "News A", platform: "News", time: "7 Okt", status: "Terverifikasi" },
  { statement: "Klaim kericuhan lokasi X", source: "@akun_dummy", platform: "X", time: "7 Okt", status: "Belum Terverifikasi" },
  // Revisi 5 — kategori sumber Data Internal / Laporan Lapangan (Arsip & Pengetahuan). Penggunaan tetap memperhatikan klasifikasi dan hak akses.
  { statement: "Massa berangsur membubarkan diri menjelang sore di lokasi aksi", source: "Data Internal / Laporan Lapangan", platform: "Arsip & Pengetahuan", time: "9 Okt", status: "Belum Terverifikasi", note: "Klasifikasi: Internal — gunakan sesuai hak akses; laporan lapangan tidak otomatis dianggap terverifikasi." },
];

export const insights = [
  { title: "Social-first propagation", copy: "Percakapan berkembang lebih cepat di X dan TikTok dibanding News." },
  { title: "News as reference source", copy: "Konten News banyak digunakan kembali sebagai rujukan oleh akun sosial." },
  { title: "Regional concentration", copy: "Pertumbuhan tertinggi berada di Jakarta dan Bandung." },
  { title: "Verification gap", copy: "Informasi belum terverifikasi meningkat lebih cepat daripada klarifikasi." },
];

export const channelRoles: Record<string, { role: string; items: string[] }> = {
  News: { role: "Sumber informasi utama", items: ["Artikel situasi terkini", "Klarifikasi informasi penting", "Update perkembangan"] },
  X: { role: "Rapid information distribution", items: ["Update singkat", "Fakta utama", "Link menuju sumber lengkap"] },
  TikTok: { role: "Explanatory short-form", items: ["Video singkat", "Penjelasan berbasis fakta", "Visual situasi"] },
  Instagram: { role: "Visual summary", items: ["Carousel", "Infographic", "Short video"] },
  Threads: { role: "Percakapan lanjutan", items: ["Ringkasan update", "Tautan sumber"] },
  Facebook: { role: "Jangkauan komunitas", items: ["Post informatif", "Tautan artikel"] },
  YouTube: { role: "Penjelasan mendalam", items: ["Video penjelasan", "Shorts"] },
};

export const scenarios: Array<{ key: ChannelApproach; label: string; focus: string; strength: string; speed: string; reach: string }> = [
  { key: "News-led", label: "Skenario A — News-led", focus: "News + amplification social", strength: "Informasi lebih lengkap dan traceable", speed: "Sedang", reach: "Tinggi" },
  { key: "Social-led", label: "Skenario B — Social-led", focus: "X + TikTok + Instagram", strength: "Distribusi lebih cepat", speed: "Tinggi", reach: "Tinggi" },
  { key: "Integrated", label: "Skenario C — Integrated", focus: "News sebagai source + social amplification", strength: "Coverage dan konsistensi pesan", speed: "Sedang–Tinggi", reach: "Sangat Tinggi" },
];
