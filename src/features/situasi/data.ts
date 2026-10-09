export type DetailRecord = {
  actor: string;
  platform: string;
  content: string;
  narrative: string;
  sentiment: "Negatif" | "Netral" | "Positif";
  emotion: string;
  region: string;
  risk: "Tinggi" | "Sedang" | "Rendah";
  time: string;
  date: string;
};

export type SituationEntry = {
  slug: string;
  name: string;
  source: "Temuan Sistem" | "Topik Pantauan";
  risk?: "Tinggi" | "Sedang" | "Rendah";
  status: string;
  volume: string;
  actors: string;
  narratives: string;
  since: string;
  description: string;
  platforms: string[];
  regionScope: string;
  keywords: string[];
  detectedReason?: string;
  triggers?: string[];
  growth?: string;
  regionsGrowing?: string;
  dominantNarrative?: string;
  warningStatus?: string;
  createdBy?: string;
};

export type RiskFactor = { factor: string; condition: string; change: string };
export type RiskDimension = { name: string; impact: "Tinggi" | "Sedang" | "Rendah"; momentum: string };
export type RiskDetail = { indicator: string; level: "Tinggi" | "Sedang" | "Rendah"; volume: string; growth: string; actors: string; region: string; status: string };

export type SituationRiskProfile = {
  activeRegions: string;
  warningCount: string;
  newActors: string;
  negativeSentiment: string;
  spreadPotential: "Tinggi" | "Sedang" | "Rendah";
  growingRegions: string;
  drivingNarrative: string;
  factors: RiskFactor[];
  dimensions: RiskDimension[];
  warnings: Array<{ level: "TINGGI" | "SEDANG"; title: string; meta: string }>;
  riskDetails: RiskDetail[];
  unusualActivity: string;
};

export const systemFindings: SituationEntry[] = [
  {
    slug: "demonstrasi-nasional", name: "Demonstrasi Nasional", source: "Temuan Sistem", risk: "Tinggi", status: "Aktif",
    volume: "186.420", actors: "31.870", narratives: "18", since: "5 Okt 2026, 09:40",
    description: "Peningkatan percakapan dan mobilisasi terkait demonstrasi di sejumlah wilayah.", platforms: ["X", "TikTok", "Threads", "News"], regionScope: "6 wilayah meningkat", keywords: ["demonstrasi", "aksi nasional", "mobilisasi"],
    detectedReason: "Lonjakan volume dan perluasan wilayah", triggers: ["Lonjakan volume +63%", "Perluasan ke 6 wilayah", "428 aktor baru dalam 24 jam"], growth: "+63%", regionsGrowing: "6 wilayah meningkat", dominantNarrative: "Aksi meluas ke sejumlah kota", warningStatus: "Early warning aktif",
  },
  {
    slug: "dugaan-serangan-siber", name: "Dugaan Serangan Siber", source: "Temuan Sistem", risk: "Tinggi", status: "Aktif",
    volume: "94.720", actors: "18.240", narratives: "11", since: "6 Okt 2026, 13:15",
    description: "Pertumbuhan narasi tidak terverifikasi terkait dugaan kebocoran data.", platforms: ["X", "TikTok", "News"], regionScope: "Nasional", keywords: ["serangan siber", "kebocoran data"],
    detectedReason: "Pertumbuhan narasi tidak terverifikasi", triggers: ["Volume meningkat +48%", "Penyebaran berskala nasional", "214 aktor baru dalam 24 jam"], growth: "+48%", regionsGrowing: "Skala nasional", dominantNarrative: "Dugaan kebocoran data", warningStatus: "Early warning aktif",
  },
  {
    slug: "gangguan-layanan-publik", name: "Gangguan Layanan Publik", source: "Temuan Sistem", risk: "Sedang", status: "Aktif",
    volume: "58.340", actors: "10.210", narratives: "8", since: "6 Okt 2026, 16:20",
    description: "Peningkatan laporan gangguan layanan di beberapa kanal publik.", platforms: ["X", "Instagram", "News"], regionScope: "Jawa Barat", keywords: ["layanan publik", "gangguan"],
    detectedReason: "Perubahan pola laporan lintas kanal", triggers: ["Volume meningkat +21%", "Tiga layanan disebut berulang", "Aktivitas terkonsentrasi di Jawa Barat"], growth: "+21%", regionsGrowing: "3 wilayah meningkat", dominantNarrative: "Layanan belum kembali normal", warningStatus: "Dalam pemantauan",
  },
  {
    slug: "informasi-bencana", name: "Informasi Tidak Terverifikasi terkait Bencana", source: "Temuan Sistem", risk: "Sedang", status: "Baru",
    volume: "41.820", actors: "7.940", narratives: "6", since: "7 Okt 2026, 07:10",
    description: "Informasi belum terverifikasi menyebar setelah kejadian bencana regional.", platforms: ["Facebook", "TikTok", "WhatsApp"], regionScope: "Sulawesi Selatan", keywords: ["bencana", "informasi darurat"],
    detectedReason: "Lonjakan konten dengan sumber tidak jelas", triggers: ["Volume meningkat +18%", "Dua narasi baru dalam 6 jam", "Sumber primer belum ditemukan"], growth: "+18%", regionsGrowing: "2 wilayah meningkat", dominantNarrative: "Informasi darurat belum terverifikasi", warningStatus: "Perlu verifikasi",
  },
];

export const monitoredTopics: SituationEntry[] = [
  { slug: "stabilitas-harga-pangan", name: "Stabilitas Harga Pangan", source: "Topik Pantauan", status: "Stabil", volume: "42.810", actors: "8.420", narratives: "7", since: "2 Oktober 2026", description: "Pemantauan dinamika harga dan persepsi publik terhadap ketersediaan pangan.", platforms: ["X", "TikTok", "Threads", "News"], regionScope: "Nasional", keywords: ["harga pangan", "beras", "stok pangan"], createdBy: "Analis A" },
  { slug: "persepsi-kebijakan-strategis", name: "Persepsi terhadap Kebijakan Strategis", source: "Topik Pantauan", status: "Meningkat", volume: "31.240", actors: "6.180", narratives: "5", since: "4 Oktober 2026", description: "Pemantauan respons publik terhadap kebijakan strategis terbaru.", platforms: ["X", "Instagram", "News"], regionScope: "Nasional", keywords: ["kebijakan strategis", "respons publik"], createdBy: "Analis A" },
  { slug: "isu-keamanan-regional", name: "Isu Keamanan Regional", source: "Topik Pantauan", status: "Perlu Perhatian", volume: "18.920", actors: "3.840", narratives: "4", since: "1 Oktober 2026", description: "Pemantauan perkembangan isu keamanan di kawasan regional.", platforms: ["X", "YouTube", "News"], regionScope: "Regional", keywords: ["keamanan regional", "stabilitas kawasan"], createdBy: "Analis B" },
];

const demonstrationRiskProfile: SituationRiskProfile = {
  activeRegions: "6",
  warningCount: "7",
  newActors: "+428 / 24 jam",
  negativeSentiment: "46%",
  spreadPotential: "Tinggi",
  growingRegions: "Bandung, Surabaya",
  drivingNarrative: "Aksi meluas ke sejumlah kota",
  factors: [
    { factor: "Kecepatan Penyebaran", condition: "Tinggi", change: "+42%" },
    { factor: "Pertumbuhan Volume", condition: "Tinggi", change: "+63%" },
    { factor: "Aktor Baru", condition: "Meningkat", change: "+428 / 24 jam" },
    { factor: "Sentimen Negatif", condition: "Tinggi", change: "46%" },
  ],
  dimensions: [
    { name: "Aksi meluas", impact: "Tinggi", momentum: "+72%" },
    { name: "Kericuhan", impact: "Tinggi", momentum: "+31%" },
    { name: "Kondisi ekonomi", impact: "Sedang", momentum: "+44%" },
    { name: "Aksi damai", impact: "Rendah", momentum: "+17%" },
  ],
  warnings: [
    { level: "TINGGI", title: "Lonjakan percakapan di Bandung", meta: "+86% dalam 3 jam" },
    { level: "TINGGI", title: "Narasi “aksi meluas” menyebar", meta: "Ke 3 platform tambahan" },
    { level: "SEDANG", title: "Peningkatan akun baru dalam Cluster A", meta: "42 menit lalu" },
    { level: "SEDANG", title: "Sentimen negatif meningkat pada narasi ekonomi", meta: "1 jam lalu" },
  ],
  riskDetails: [
    { indicator: "Aksi meluas ke sejumlah kota", level: "Tinggi", volume: "38.420", growth: "+72%", actors: "8.240", region: "Jakarta, Bandung", status: "Meningkat" },
    { indicator: "Informasi tidak terverifikasi terkait kericuhan", level: "Tinggi", volume: "12.780", growth: "+31%", actors: "2.870", region: "Jakarta", status: "Meningkat" },
    { indicator: "Tuntutan kondisi ekonomi", level: "Sedang", volume: "31.200", growth: "+44%", actors: "6.830", region: "Nasional", status: "Stabil" },
    { indicator: "Ajakan mobilisasi", level: "Sedang", volume: "24.860", growth: "+38%", actors: "5.120", region: "4 wilayah", status: "Meningkat" },
  ],
  unusualActivity: "37 akun menunjukkan waktu unggah yang berdekatan dan menggunakan narasi serupa dalam periode dua jam.",
};

export function getRiskProfile(situation: SituationEntry): SituationRiskProfile {
  if (situation.slug === "demonstrasi-nasional") return demonstrationRiskProfile;
  const growth = situation.growth ?? "+12%";
  const narrative = situation.dominantNarrative ?? situation.keywords[0] ?? situation.name;
  const activeRegions = situation.regionScope.match(/\d+/)?.[0] ?? "3";
  return {
    activeRegions,
    warningCount: situation.risk === "Tinggi" ? "4" : "2",
    newActors: situation.risk === "Tinggi" ? "+214 / 24 jam" : "+86 / 24 jam",
    negativeSentiment: situation.risk === "Tinggi" ? "43%" : "31%",
    spreadPotential: situation.risk ?? "Sedang",
    growingRegions: situation.regionsGrowing ?? situation.regionScope,
    drivingNarrative: narrative,
    factors: [
      { factor: "Kecepatan Penyebaran", condition: situation.risk ?? "Sedang", change: growth },
      { factor: "Pertumbuhan Volume", condition: growth.startsWith("+") ? "Meningkat" : "Stabil", change: growth },
      { factor: "Aktor Baru", condition: "Meningkat", change: situation.risk === "Tinggi" ? "+214 / 24 jam" : "+86 / 24 jam" },
      { factor: "Sentimen Negatif", condition: situation.risk === "Tinggi" ? "Tinggi" : "Sedang", change: situation.risk === "Tinggi" ? "43%" : "31%" },
    ],
    dimensions: [
      { name: narrative, impact: situation.risk ?? "Sedang", momentum: growth },
      { name: situation.keywords[1] ?? "Respons publik", impact: "Sedang", momentum: "+24%" },
      { name: "Informasi belum terverifikasi", impact: "Tinggi", momentum: "+18%" },
      { name: "Klarifikasi resmi", impact: "Rendah", momentum: "+11%" },
    ],
    warnings: [
      { level: situation.risk === "Tinggi" ? "TINGGI" : "SEDANG", title: `Pertumbuhan ${narrative.toLowerCase()}`, meta: `${growth} dalam periode aktif` },
      { level: "SEDANG", title: `Perluasan aktivitas di ${situation.regionScope}`, meta: "Terdeteksi lintas platform" },
    ],
    riskDetails: [
      { indicator: narrative, level: situation.risk ?? "Sedang", volume: situation.volume, growth, actors: situation.actors, region: situation.regionScope, status: "Meningkat" },
      { indicator: situation.keywords[1] ?? "Respons publik", level: "Sedang", volume: "12.640", growth: "+24%", actors: "2.180", region: situation.regionScope, status: "Stabil" },
      { indicator: "Informasi belum terverifikasi", level: "Sedang", volume: "8.920", growth: "+18%", actors: "1.460", region: situation.regionScope, status: "Dipantau" },
    ],
    unusualActivity: "Sejumlah akun menunjukkan waktu unggah yang berdekatan dan menggunakan narasi serupa dalam periode pemantauan.",
  };
}

export function getSituation(slug: string) {
  return [...systemFindings, ...monitoredTopics].find((item) => item.slug === slug);
}

export const issues = [
  { name: "Demonstrasi Nasional", risk: "Tinggi", volume: "186.420", growth: "+63%", region: "Jakarta, Bandung", status: "Meningkat" },
  { name: "Dugaan Serangan Siber", risk: "Tinggi", volume: "94.720", growth: "+48%", region: "Nasional", status: "Meningkat" },
  { name: "Gangguan Layanan Publik", risk: "Sedang", volume: "58.340", growth: "+21%", region: "Jawa Barat", status: "Stabil" },
  { name: "Informasi Tidak Terverifikasi terkait Bencana", risk: "Sedang", volume: "41.820", growth: "+18%", region: "Sulawesi Selatan", status: "Dipantau" },
] as const;

export const trend = [
  { date: "1 Okt", fullDate: "1 Oktober", volume: 14200, actual: 14200, forecast: null },
  { date: "2 Okt", fullDate: "2 Oktober", volume: 16800, actual: 16800, forecast: null },
  { date: "3 Okt", fullDate: "3 Oktober", volume: 19100, actual: 19100, forecast: null },
  { date: "4 Okt", fullDate: "4 Oktober", volume: 27600, actual: 27600, forecast: null },
  { date: "5 Okt", fullDate: "5 Oktober", volume: 42300, actual: 42300, forecast: null },
  { date: "6 Okt", fullDate: "6 Oktober", volume: 36900, actual: 36900, forecast: null },
  { date: "7 Okt", fullDate: "7 Oktober", volume: 29520, actual: 29520, forecast: 29520 },
  { date: "8 Okt", fullDate: "8 Oktober", volume: 31800, actual: null, forecast: 31800 },
  { date: "9 Okt", fullDate: "9 Oktober", volume: 34600, actual: null, forecast: 34600 },
  { date: "10 Okt", fullDate: "10 Oktober", volume: 33200, actual: null, forecast: 33200 },
  { date: "11 Okt", fullDate: "11 Oktober", volume: 35800, actual: null, forecast: 35800 },
] as const;

export const actors = [
  { name: "@forum_mahasiswa", category: "Komunitas", platform: "X", interactions: 22430, reach: "1,8M", influence: "Tinggi", cluster: "Cluster A", narrative: "Aksi meluas" },
  { name: "@media_nusantara", category: "Media", platform: "Media Online", interactions: 18920, reach: "2,4M", influence: "Tinggi", cluster: "Cluster B", narrative: "Update lapangan" },
  { name: "@pantau_kota", category: "Pengamat", platform: "X", interactions: 14360, reach: "980K", influence: "Tinggi", cluster: "Cluster C", narrative: "Kondisi ekonomi" },
  { name: "@suara_warga", category: "Publik", platform: "Instagram", interactions: 11280, reach: "740K", influence: "Sedang", cluster: "Cluster C", narrative: "Aksi damai" },
  { name: "@info_aksi", category: "Akun Informasi", platform: "TikTok", interactions: 9740, reach: "610K", influence: "Sedang", cluster: "Cluster A", narrative: "Ajakan mobilisasi" },
] as const;

export const narratives = [
  { name: "Aksi meluas ke sejumlah kota", volume: 38420, actors: 8240, growth: "+72%" },
  { name: "Tuntutan terkait kondisi ekonomi", volume: 31200, actors: 6830, growth: "+44%" },
  { name: "Ajakan mobilisasi di media sosial", volume: 24860, actors: 5120, growth: "+38%" },
  { name: "Aksi berlangsung damai", volume: 18340, actors: 3980, growth: "+17%" },
  { name: "Informasi tidak terverifikasi terkait kericuhan", volume: 12780, actors: 2870, growth: "+31%" },
] as const;

export const regions = [
  { name: "Jakarta", volume: 52430, growth: "+71%" },
  { name: "Bandung", volume: 31280, growth: "+58%" },
  { name: "Surabaya", volume: 22410, growth: "+37%" },
  { name: "Makassar", volume: 14320, growth: "+29%" },
  { name: "Medan", volume: 11780, growth: "+23%" },
] as const;

export const sentiment = [
  { name: "Negatif", value: 46, fill: "var(--color-chart-4)" },
  { name: "Netral", value: 35, fill: "var(--color-chart-1)" },
  { name: "Positif", value: 19, fill: "var(--color-chart-2)" },
];

export const records: DetailRecord[] = [
  { actor: "@forum_mahasiswa", platform: "X", content: "Aksi lanjutan direncanakan di sejumlah kota setelah agenda konsolidasi hari ini.", narrative: "Aksi meluas", sentiment: "Negatif", emotion: "Khawatir", region: "Jakarta", risk: "Tinggi", time: "5 Okt 14:32", date: "5 Oktober" },
  { actor: "@media_nusantara", platform: "Media Online", content: "Sejumlah kota bersiap menghadapi agenda penyampaian aspirasi pekan ini.", narrative: "Aksi meluas", sentiment: "Netral", emotion: "Netral", region: "Bandung", risk: "Sedang", time: "5 Okt 13:10", date: "5 Oktober" },
  { actor: "@pantau_kota", platform: "X", content: "Perhatian publik meningkat pada tuntutan terkait kondisi ekonomi.", narrative: "Kondisi ekonomi", sentiment: "Negatif", emotion: "Marah", region: "Surabaya", risk: "Tinggi", time: "6 Okt 09:18", date: "6 Oktober" },
  { actor: "@suara_warga", platform: "Instagram", content: "Situasi lapangan terpantau tertib dan penyampaian aspirasi berlangsung damai.", narrative: "Aksi damai", sentiment: "Positif", emotion: "Optimis", region: "Makassar", risk: "Rendah", time: "7 Okt 11:04", date: "7 Oktober" },
  { actor: "@info_aksi", platform: "TikTok", content: "Ajakan mobilisasi kembali beredar dan memperoleh interaksi tinggi dalam tiga jam.", narrative: "Ajakan mobilisasi", sentiment: "Negatif", emotion: "Khawatir", region: "Bandung", risk: "Tinggi", time: "7 Okt 16:45", date: "7 Oktober" },
];

export const clusters = [
  { name: "Cluster A", count: 318, focus: "Mobilisasi & Agenda Aksi" },
  { name: "Cluster B", count: 184, focus: "Pemberitaan & Update Lapangan" },
  { name: "Cluster C", count: 126, focus: "Kritik Kebijakan" },
  { name: "Cluster D", count: 92, focus: "Klarifikasi & Respons Resmi" },
] as const;

export const sentimentByPlatform = [
  { platform: "X", positive: 14, neutral: 26, negative: 60 },
  { platform: "TikTok", positive: 17, neutral: 31, negative: 52 },
  { platform: "Instagram", positive: 22, neutral: 38, negative: 40 },
  { platform: "YouTube", positive: 19, neutral: 40, negative: 41 },
  { platform: "Media Online", positive: 21, neutral: 54, negative: 25 },
];
/* ===================== REVISI 1 — Analisis Pola Manipulasi Informasi ===================== */
export type ManipulationPattern = {
  id: string;
  name: string;
  description: string;
  count: number;
  trend: "Meningkat" | "Stabil" | "Menurun";
  dominantPlatform: string;
  relatedNarrative: string;
  example: string;
};

export const manipulationPatterns: ManipulationPattern[] = [
  { id: "framing", name: "Pembingkaian (Framing)", description: "Penekanan sudut pandang tertentu pada pemberitaan dan percakapan.", count: 186, trend: "Meningkat", dominantPlatform: "X", relatedNarrative: "Aksi meluas ke sejumlah kota", example: "\u201cPemerintah dituding abaikan aspirasi\u201d \u2014 disajikan tanpa konteks tanggapan resmi." },
  { id: "fear", name: "Pembangkitan Ketakutan", description: "Penggunaan pesan yang membangkitkan kekhawatiran berlebih.", count: 94, trend: "Stabil", dominantPlatform: "TikTok", relatedNarrative: "Informasi tidak terverifikasi terkait kericuhan", example: "Video lama disertakan ulang dengan narasi \u201ckericuhan besar akan terjadi malam ini\u201d." },
  { id: "repetition", name: "Pengulangan Klaim", description: "Klaim serupa yang muncul berulang pada akun dan platform berbeda.", count: 312, trend: "Meningkat", dominantPlatform: "X", relatedNarrative: "Ajakan mobilisasi di media sosial", example: "Kalimat ajakan yang nyaris identik diunggah ulang oleh puluhan akun dalam rentang waktu berdekatan." },
  { id: "decontext", name: "Pemelintiran Konteks", description: "Informasi disajikan dengan konteks yang tidak lengkap atau berubah dari sumber asli.", count: 57, trend: "Menurun", dominantPlatform: "Facebook", relatedNarrative: "Tuntutan terkait kondisi ekonomi", example: "Potongan pernyataan pejabat ditampilkan tanpa kalimat sebelumnya yang mengubah maksud asli." },
];

export type ManipulationContentRow = {
  patternId: string;
  content: string;
  actor: string;
  platform: string;
  time: string;
  reason: string;
  sourceUrl: string;
};

export const manipulationContents: ManipulationContentRow[] = [
  { patternId: "framing", content: "\u201cPemerintah dituding abaikan aspirasi\u201d tanpa menyertakan tanggapan resmi.", actor: "@pantau_kota", platform: "X", time: "5 Okt 10:12", reason: "Sudut pandang tunggal tanpa konfirmasi pihak terkait", sourceUrl: "https://x.com/pantau_kota/status/demo1" },
  { patternId: "framing", content: "Artikel menonjolkan kata \u201cdesakan\u201d berulang pada judul dan isi.", actor: "@media_nusantara", platform: "Media Online", time: "5 Okt 11:40", reason: "Pemilihan judul menekankan satu kerangka isu", sourceUrl: "https://media-nusantara.example/berita/demo2" },
  { patternId: "fear", content: "Video lama disebut \u201ckericuhan besar akan terjadi malam ini\u201d.", actor: "@info_aksi", platform: "TikTok", time: "6 Okt 19:05", reason: "Penyandingan visual lama dengan klaim waktu baru", sourceUrl: "https://tiktok.com/@info_aksi/video/demo3" },
  { patternId: "fear", content: "Unggahan menyebut \u201cjangan keluar rumah, situasi darurat\u201d tanpa sumber resmi.", actor: "@suara_warga", platform: "Instagram", time: "6 Okt 20:22", reason: "Pesan menimbulkan kekhawatiran tanpa rujukan resmi", sourceUrl: "https://instagram.com/p/demo4" },
  { patternId: "repetition", content: "\u201cAyo turun ke jalan, saatnya bersuara!\u201d diunggah ulang oleh puluhan akun.", actor: "@forum_mahasiswa", platform: "X", time: "5 Okt 08:50", reason: "Kalimat nyaris identik muncul dari banyak akun berbeda dalam waktu berdekatan", sourceUrl: "https://x.com/forum_mahasiswa/status/demo5" },
  { patternId: "repetition", content: "Tagar yang sama disertai narasi identik pada lebih dari 40 unggahan.", actor: "@info_aksi", platform: "X", time: "5 Okt 09:30", reason: "Pola pengulangan klaim lintas akun dalam waktu singkat", sourceUrl: "https://x.com/info_aksi/status/demo6" },
  { patternId: "decontext", content: "Potongan pernyataan pejabat ditampilkan tanpa kalimat sebelumnya.", actor: "@pantau_kota", platform: "Facebook", time: "7 Okt 07:15", reason: "Konteks pernyataan asli tidak disertakan secara utuh", sourceUrl: "https://facebook.com/pantau.kota/posts/demo7" },
];

export function patternContents(patternId: string) {
  return manipulationContents.filter((row) => row.patternId === patternId);
}

export const narrativeTimeline = [
  { date: "1 Okt", rising: 4200, falling: 1800 },
  { date: "2 Okt", rising: 5600, falling: 1700 },
  { date: "3 Okt", rising: 8300, falling: 1500 },
  { date: "4 Okt", rising: 13400, falling: 1200 },
  { date: "5 Okt", rising: 21800, falling: 980 },
  { date: "6 Okt", rising: 18600, falling: 1100 },
  { date: "7 Okt", rising: 15200, falling: 1650 },
] as const;

/* ===================== REVISI 2 — Account Deep Dive ===================== */
export type AccountUpload = { date: string; content: string; topic: string; interactions: number; source: string };
export type AccountRelation = { name: string; interactions: number; relation: string };

export type AccountProfile = {
  username: string;
  platform: "X" | "Instagram" | "TikTok" | "Facebook";
  status: string;
  periodAnalysis: string;
  firstDetected: string;
  profileUrl: string;
  postsMonitored: number;
  interactionsMonitored: number;
  mentions: number;
  dominantTopic: string;
  activityChange: string;
  uploads: AccountUpload[];
  relations: AccountRelation[];
  behaviorChange: {
    postsBefore: number; postsNow: number;
    frequencyBefore: string; frequencyNow: string;
    interactionsBefore: number; interactionsNow: number;
    mentionsBefore: number; mentionsNow: number;
    topicBefore: string; topicNow: string;
  };
  aiInsight: string;
};

export const accountProfiles: Record<string, AccountProfile> = {
  "@forum_mahasiswa": {
    username: "@forum_mahasiswa", platform: "X", status: "Aktif", periodAnalysis: "1\u201310 Oktober 2026", firstDetected: "1 Oktober 2026", profileUrl: "https://x.com/forum_mahasiswa",
    postsMonitored: 76, interactionsMonitored: 3240, mentions: 260, dominantTopic: "Aksi meluas ke sejumlah kota", activityChange: "Posting naik 81% dibanding periode sebelumnya",
    uploads: [
      { date: "7 Okt", content: "Ajakan konsolidasi menjelang aksi lanjutan.", topic: "Ajakan mobilisasi", interactions: 4120, source: "https://x.com/forum_mahasiswa/status/u1" },
      { date: "6 Okt", content: "Pembaruan titik kumpul di beberapa kota.", topic: "Aksi meluas", interactions: 3680, source: "https://x.com/forum_mahasiswa/status/u2" },
      { date: "5 Okt", content: "Aksi lanjutan direncanakan setelah agenda konsolidasi hari ini.", topic: "Aksi meluas", interactions: 5210, source: "https://x.com/forum_mahasiswa/status/u3" },
    ],
    relations: [
      { name: "@info_aksi", interactions: 820, relation: "Saling mention & repost" },
      { name: "@pantau_kota", interactions: 540, relation: "Reply berulang" },
      { name: "@suara_warga", interactions: 310, relation: "Mention" },
    ],
    behaviorChange: { postsBefore: 42, postsNow: 76, frequencyBefore: "4/hari", frequencyNow: "9/hari", interactionsBefore: 1850, interactionsNow: 3240, mentionsBefore: 420, mentionsNow: 260, topicBefore: "Kritik kebijakan", topicNow: "Ajakan mobilisasi" },
    aiInsight: "Teramati peningkatan frekuensi unggahan dan pergeseran topik menuju ajakan mobilisasi pada periode terbaru. Pola ini menggambarkan perubahan aktivitas akun, bukan penilaian atas motif pemilik akun.",
  },
  "@suara_warga": {
    username: "@suara_warga", platform: "Instagram", status: "Aktif", periodAnalysis: "1\u201310 Oktober 2026", firstDetected: "2 Oktober 2026", profileUrl: "https://instagram.com/suara_warga",
    postsMonitored: 38, interactionsMonitored: 11280, mentions: 142, dominantTopic: "Aksi damai", activityChange: "Interaksi naik 26% dibanding periode sebelumnya",
    uploads: [
      { date: "7 Okt", content: "Situasi lapangan terpantau tertib dan berlangsung damai.", topic: "Aksi damai", interactions: 2980, source: "https://instagram.com/p/u4" },
      { date: "6 Okt", content: "Dokumentasi penyampaian aspirasi di titik kumpul utama.", topic: "Aksi damai", interactions: 2140, source: "https://instagram.com/p/u5" },
    ],
    relations: [
      { name: "@forum_mahasiswa", interactions: 310, relation: "Mention" },
      { name: "@media_nusantara", interactions: 180, relation: "Reply" },
    ],
    behaviorChange: { postsBefore: 24, postsNow: 38, frequencyBefore: "2/hari", frequencyNow: "4/hari", interactionsBefore: 8950, interactionsNow: 11280, mentionsBefore: 96, mentionsNow: 142, topicBefore: "Kondisi lapangan", topicNow: "Aksi damai" },
    aiInsight: "Teramati peningkatan intensitas unggahan dokumentasi lapangan. Topik yang dibahas bergeser ke narasi aksi damai dibanding periode sebelumnya.",
  },
  "@info_aksi": {
    username: "@info_aksi", platform: "TikTok", status: "Aktif", periodAnalysis: "1\u201310 Oktober 2026", firstDetected: "3 Oktober 2026", profileUrl: "https://tiktok.com/@info_aksi",
    postsMonitored: 54, interactionsMonitored: 9740, mentions: 188, dominantTopic: "Ajakan mobilisasi", activityChange: "Posting naik 64% dibanding periode sebelumnya",
    uploads: [
      { date: "7 Okt", content: "Ajakan mobilisasi kembali beredar dan memperoleh interaksi tinggi.", topic: "Ajakan mobilisasi", interactions: 3350, source: "https://tiktok.com/@info_aksi/video/u6" },
      { date: "5 Okt", content: "Ringkasan video agenda aksi hari sebelumnya.", topic: "Ajakan mobilisasi", interactions: 2210, source: "https://tiktok.com/@info_aksi/video/u7" },
    ],
    relations: [
      { name: "@forum_mahasiswa", interactions: 820, relation: "Repost" },
      { name: "@pantau_kota", interactions: 260, relation: "Mention" },
    ],
    behaviorChange: { postsBefore: 33, postsNow: 54, frequencyBefore: "3/hari", frequencyNow: "6/hari", interactionsBefore: 6120, interactionsNow: 9740, mentionsBefore: 110, mentionsNow: 188, topicBefore: "Update umum", topicNow: "Ajakan mobilisasi" },
    aiInsight: "Teramati kenaikan frekuensi unggahan video pendek bertema ajakan, sejalan dengan meningkatnya volume percakapan terkait isu ini.",
  },
  "@pantau_kota": {
    username: "@pantau_kota", platform: "Facebook", status: "Aktif", periodAnalysis: "1\u201310 Oktober 2026", firstDetected: "2 Oktober 2026", profileUrl: "https://facebook.com/pantau.kota",
    postsMonitored: 29, interactionsMonitored: 14360, mentions: 203, dominantTopic: "Kondisi ekonomi", activityChange: "Interaksi naik 18% dibanding periode sebelumnya",
    uploads: [
      { date: "6 Okt", content: "Perhatian publik meningkat pada tuntutan terkait kondisi ekonomi.", topic: "Kondisi ekonomi", interactions: 4210, source: "https://facebook.com/pantau.kota/posts/u8" },
      { date: "4 Okt", content: "Ringkasan pemberitaan lintas media terkait dinamika harga.", topic: "Kondisi ekonomi", interactions: 2870, source: "https://facebook.com/pantau.kota/posts/u9" },
    ],
    relations: [
      { name: "@media_nusantara", interactions: 410, relation: "Reply" },
      { name: "@forum_mahasiswa", interactions: 540, relation: "Mention" },
    ],
    behaviorChange: { postsBefore: 21, postsNow: 29, frequencyBefore: "2/hari", frequencyNow: "3/hari", interactionsBefore: 12140, interactionsNow: 14360, mentionsBefore: 164, mentionsNow: 203, topicBefore: "Pemberitaan umum", topicNow: "Kondisi ekonomi" },
    aiInsight: "Teramati pergeseran topik dominan ke isu kondisi ekonomi, dengan kenaikan interaksi yang moderat dibanding periode sebelumnya.",
  },
};

export function getAccountProfile(username: string) {
  return accountProfiles[username];
}

/* ===================== REVISI 3 — Analisis Komentar ===================== */
export type CommentRow = {
  content: string; actor: string; platform: string;
  sentiment: "Positif" | "Netral" | "Negatif"; emotion: string; time: string; parentPost: string;
};

export const commentStats = {
  total: 8420,
  positive: 18,
  neutral: 29,
  negative: 53,
};

export const commentTrend = [
  { date: "1 Okt", positive: 20, neutral: 33, negative: 47 },
  { date: "2 Okt", positive: 19, neutral: 32, negative: 49 },
  { date: "3 Okt", positive: 19, neutral: 30, negative: 51 },
  { date: "4 Okt", positive: 18, neutral: 29, negative: 53 },
  { date: "5 Okt", positive: 17, neutral: 28, negative: 55 },
  { date: "6 Okt", positive: 18, neutral: 29, negative: 53 },
  { date: "7 Okt", positive: 18, neutral: 29, negative: 53 },
] as const;

export const commentEmotions = [
  { name: "Marah", value: 31 },
  { name: "Khawatir", value: 28 },
  { name: "Tidak Percaya", value: 21 },
  { name: "Optimis", value: 12 },
  { name: "Lainnya", value: 8 },
] as const;

export const commentPlatforms = [
  { platform: "X", share: 42 },
  { platform: "TikTok", share: 27 },
  { platform: "Instagram", share: 18 },
  { platform: "Facebook", share: 9 },
  { platform: "YouTube", share: 4 },
] as const;

export const comments: CommentRow[] = [
  { content: "Semoga aksinya tetap damai dan tertib ya.", actor: "@warga_jkt21", platform: "X", sentiment: "Netral", emotion: "Harap", time: "5 Okt 14:40", parentPost: "Aksi lanjutan direncanakan di sejumlah kota setelah agenda konsolidasi hari ini." },
  { content: "Kenapa harga malah makin naik, pemerintah dengar nggak sih?", actor: "@ekonomi_rakyat", platform: "TikTok", sentiment: "Negatif", emotion: "Marah", time: "6 Okt 09:30", parentPost: "Perhatian publik meningkat pada tuntutan terkait kondisi ekonomi." },
  { content: "Takut terjadi kericuhan kalau makin ramai begini.", actor: "@citra_s", platform: "Instagram", sentiment: "Negatif", emotion: "Khawatir", time: "7 Okt 11:20", parentPost: "Situasi lapangan terpantau tertib dan penyampaian aspirasi berlangsung damai." },
  { content: "Informasinya belum jelas sumbernya, jangan mudah percaya.", actor: "@verifikasi_id", platform: "X", sentiment: "Netral", emotion: "Tidak Percaya", time: "7 Okt 17:05", parentPost: "Ajakan mobilisasi kembali beredar dan memperoleh interaksi tinggi dalam tiga jam." },
  { content: "Dukung penuh langkah damai seperti ini.", actor: "@anak_kampus", platform: "Facebook", sentiment: "Positif", emotion: "Optimis", time: "7 Okt 11:50", parentPost: "Situasi lapangan terpantau tertib dan penyampaian aspirasi berlangsung damai." },
];

/* ===================== REVISI 4 — EWS Bertingkat & Notifikasi ===================== */
export type EwsLevel = "Rendah" | "Sedang" | "Tinggi" | "Kritis";
export type EwsEntry = {
  slug: string; name: string; level: EwsLevel; firstDetected: string;
  triggers: string[]; handlingStatus: string; pic?: string | undefined; reason: string;
};

export const ewsEntries: EwsEntry[] = [
  { slug: "demonstrasi-nasional", name: "Demonstrasi Nasional", level: "Tinggi", firstDetected: "3 Oktober 2026", triggers: ["Lonjakan volume +63%", "Meluasnya wilayah percakapan ke 6 wilayah"], handlingStatus: "Dalam Pemantauan", pic: "Analis Siaga 1", reason: "Lonjakan volume dan meluasnya wilayah percakapan" },
  { slug: "dugaan-serangan-siber", name: "Dugaan Serangan Siber", level: "Tinggi", firstDetected: "6 Oktober 2026", triggers: ["Volume meningkat +48%", "Penyebaran berskala nasional"], handlingStatus: "Dalam Penanganan", pic: "Analis Siaga 2", reason: "Pertumbuhan narasi tidak terverifikasi berskala nasional" },
  { slug: "gangguan-layanan-publik", name: "Gangguan Layanan Publik", level: "Sedang", firstDetected: "6 Oktober 2026", triggers: ["Volume meningkat +21%"], handlingStatus: "Dalam Pemantauan", pic: undefined, reason: "Perubahan pola laporan lintas kanal" },
  { slug: "informasi-bencana", name: "Informasi Tidak Terverifikasi terkait Bencana", level: "Sedang", firstDetected: "7 Oktober 2026", triggers: ["Volume meningkat +18%"], handlingStatus: "Baru", pic: undefined, reason: "Lonjakan konten dengan sumber tidak jelas" },
];

export function getEws(slug: string) {
  return ewsEntries.find((item) => item.slug === slug);
}

export const highEwsNotifications = ewsEntries.filter((item) => item.level === "Tinggi" || item.level === "Kritis").map((item) => ({
  name: item.name, level: item.level, time: item.firstDetected, reason: item.reason, slug: item.slug,
}));

export type WarningHistoryItem = { time: string; event: string; status: "Baru" | "Diterima" | "Dalam Penanganan" | "Dalam Pemantauan" | "Selesai" };

export const warningHistory: WarningHistoryItem[] = [
  { time: "3 Okt 08:00", event: "Peringatan Sedang terdeteksi.", status: "Baru" },
  { time: "3 Okt 14:30", event: "Level meningkat menjadi Tinggi.", status: "Diterima" },
  { time: "3 Okt 15:00", event: "Peringatan diterima analis.", status: "Diterima" },
  { time: "4 Okt 09:00", event: "Kajian dan rekomendasi respons dibuat.", status: "Dalam Penanganan" },
  { time: "4 Okt 13:00", event: "Strategi respons disusun.", status: "Dalam Penanganan" },
  { time: "8 Okt 17:00", event: "Indikator risiko mulai menurun.", status: "Dalam Pemantauan" },
  { time: "9 Okt 08:00", event: "Level menjadi Sedang.", status: "Selesai" },
];
