export type ApprovalStatus = "Menunggu" | "Disetujui" | "Ditolak" | "Perlu Revisi";
export type ProductionStatus = "Draft" | "Generating" | "Generated";
export type Destination = "Sosial" | "News";
export type NewsStatus = "Draft Order" | "Menunggu Approval" | "Approved" | "Dikirim" | "Diterima Kanal" | "Dalam Pengerjaan" | "Tayang" | "Menunggu Verifikasi" | "Selesai" | "Perlu Revisi" | "Ditolak";

export type OutputType = "News Article" | "Infografis" | "Carousel" | "Video Pendek" | "Audio / Podcast";
export type OutputFamily = "News" | "Visual" | "Video" | "Audio";

/** Output catalog: each type has a family, a distribution destination, and a title prefix for generated items. */
export const OUTPUT_TYPES: { type: OutputType; family: OutputFamily; dest: Destination; prefix: string }[] = [
  { type: "News Article", family: "News", dest: "News", prefix: "Artikel" },
  { type: "Infografis", family: "Visual", dest: "Sosial", prefix: "Infografis" },
  { type: "Carousel", family: "Visual", dest: "Sosial", prefix: "Carousel" },
  { type: "Video Pendek", family: "Video", dest: "Sosial", prefix: "Video Penjelasan" },
  { type: "Audio / Podcast", family: "Audio", dest: "Sosial", prefix: "Audio Ringkasan" },
];
export const STYLE_OPTIONS = ["Faktual", "Tenang", "Informatif", "Ringkas"];

export function outputMeta(type: OutputType) {
  return OUTPUT_TYPES.find((o) => o.type === type) ?? OUTPUT_TYPES[0]!;
}

export type ProductionBrief = { theme: string; message: string; points: string[]; style: string[]; audience?: string | undefined; region?: string | undefined; channels?: string[] | undefined };
export type ProductionContent = {
  headline: string; subtitle: string; lead: string; body: string; tags: string[];
  slides: { label: string; text: string }[]; highlights: { value: string; label: string }[]; caption: string;
  duration: number; format: "9:16" | "16:9"; voiceOver: boolean; voice: string; transcript: string;
};
export type HistoryEntry = { version: number; label: "Generated" | "Regenerated" | "Edited" | "Diajukan" | "Approved" | "Perlu Revisi" | "Ditolak"; at: string };
export type ProductionItem = {
  id: string; title: string; type: OutputType; family: OutputFamily; dest: Destination[];
  source: "Strategi" | "Manual"; strategySlug?: string | undefined; strategyTitle?: string | undefined; situationSlug?: string | undefined; situationName?: string | undefined;
  brief: ProductionBrief; status: ProductionStatus; approval: ApprovalStatus | null; version: number; variant: number;
  content: ProductionContent; history: HistoryEntry[]; reviewNote?: string | undefined; updated: string;
  approvals: ApprovalRecord[]; submittedBy?: string | undefined; submittedAt?: string | undefined; submittedDay?: SubmittedDay | undefined;
};

/** One entry in the decision audit trail. Records are only ever appended, never overwritten. */
export type ApprovalRecord = { at: string; actor: string; decision: "Diajukan" | "Diajukan Kembali" | "Disetujui" | "Perlu Revisi" | "Ditolak" | "Tidak Berlaku"; version?: number | undefined; note?: string | undefined };
export type SubmittedDay = "Hari ini" | "Kemarin";
type Approvable = { approval: ApprovalStatus | null; approvals?: ApprovalRecord[] | undefined; submittedBy?: string | undefined; submittedAt?: string | undefined; submittedDay?: SubmittedDay | undefined };
export const APPROVER_ROLE = "Supervisor";

/** Submit (or resubmit) for review; the record names the version it applies to. */
export function applySubmit<T extends Approvable>(item: T, actor: string, at: string, version?: number): T {
  const prior = (item.approvals ?? []).some((r) => r.decision === "Diajukan" || r.decision === "Diajukan Kembali");
  return { ...item, approval: "Menunggu", submittedBy: actor, submittedAt: "Baru saja", submittedDay: "Hari ini", approvals: [...(item.approvals ?? []), { at, actor, decision: prior ? "Diajukan Kembali" : "Diajukan", version }] };
}
/** Record an approver decision for the given version. */
export function applyDecision<T extends Approvable>(item: T, decision: Exclude<ApprovalStatus, "Menunggu">, at: string, version?: number, note?: string, actor = APPROVER_ROLE): T {
  return { ...item, approval: decision, approvals: [...(item.approvals ?? []), { at, actor, decision, version, note }] };
}
/** A new version voids the previous approval but keeps the old records. */
export function invalidateApproval<T extends Approvable>(item: T, at: string, oldVersion: number, newVersion: number): T {
  if (item.approval !== "Disetujui") return item;
  return { ...item, approval: null, approvals: [...(item.approvals ?? []), { at, actor: "Sistem", decision: "Tidak Berlaku", version: oldVersion, note: `Approval v${oldVersion} tidak berlaku untuk v${newVersion}.` }] };
}

export type { Campaign } from "./sosial";
/** Revisi 9 — S56: each channel carries its own recommended/edited schedule (filled from zone-based recommendation, editable before the order is sent). */
export type ChannelOrder = { channel: string; status: NewsStatus; url?: string | undefined; schedule?: string | undefined };
export type NewsOrder = { id: string; productionId: string; contentId: string; channels: ChannelOrder[]; schedule: string; notes: string; status: NewsStatus; approval: ApprovalStatus | null; deadline?: string | undefined;
  title?: string | undefined; approvals?: ApprovalRecord[] | undefined; submittedBy?: string | undefined; submittedAt?: string | undefined; submittedDay?: SubmittedDay | undefined };

/** Revisi 9 — S56: time-zone of each regional channel, driving the "Rekomendasi Jadwal Tayang per Wilayah". */
export type TimeZone = "WIB" | "WITA" | "WIT";
const WITA_REGIONS = new Set(["Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tenggara"]);
const WIT_REGIONS = new Set(["Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Barat Daya", "Papua Selatan", "Papua Tengah", "Papua Pegunungan"]);
export function zoneFor(channel: string): TimeZone {
  if (WITA_REGIONS.has(channel)) return "WITA";
  if (WIT_REGIONS.has(channel)) return "WIT";
  return "WIB";
}
/** Fixed dummy local time-of-day per zone (audience-visit pattern simulation), per S56 example. */
const ZONE_TIME: Record<TimeZone, string> = { WIB: "10:00", WITA: "13:00", WIT: "14:00" };
/** Revisi 9 — S56: recommended tayang date/time for a channel, based on its region's time zone — Nasional gets the earliest (national) slot. */
export function recommendedScheduleFor(channel: string, date = "09 Okt"): string {
  if (channel === NATIONAL_CHANNEL) return `${date}, 10:00 WIB`;
  const zone = zoneFor(channel);
  return `${date}, ${ZONE_TIME[zone]} ${zone}`;
}
/** Deadline publikasi: simulated as a few hours after the recommended slot, visible to the channel manager. */
export function deadlineFor(channel: string, date = "09 Okt"): string {
  const zone = zoneFor(channel);
  const hour = Number(ZONE_TIME[zone].slice(0, 2)) + 3;
  return `${date}, ${String(hour).padStart(2, "0")}:00 ${zone}`;
}

export const REGIONAL_CHANNELS = ["Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Bengkulu", "Lampung", "DKI Jakarta", "Banten", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tenggara", "Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Barat Daya", "Papua Selatan", "Papua Tengah", "Papua Pegunungan"];
export const NATIONAL_CHANNEL = "Nasional";
export const NEWS_CHANNELS = [NATIONAL_CHANNEL, ...REGIONAL_CHANNELS];

const CHANNEL_DOMAIN_NAMES: Record<string, string> = {
  Nasional: "nusakanalnasional.com",
  "DKI Jakarta": "nusakanaljakarta.com",
  "DI Yogyakarta": "nusakanalyogyakarta.com",
  "Kepulauan Bangka Belitung": "nusakanalbangkabelitung.com",
};

/** Public-facing identity for every fixed-network news channel. */
export function newsChannelDomain(channel: string) {
  return CHANNEL_DOMAIN_NAMES[channel] ?? `nusakanal${channel.toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, "")}.com`;
}

export const SOURCES = [
  { name: "Data SINTESA", kind: "Internal", use: "Volume percakapan" },
  { name: "Laporan Analyst", kind: "Internal", use: "Konteks" },
  { name: "News Source", kind: "News", use: "Fakta lapangan" },
];

/** Rule: distribution may only pick content that is approved and eligible for that destination. */
export function isEligible(output: Pick<ProductionItem, "approval" | "dest">, dest: Destination) {
  return output.approval === "Disetujui" && output.dest.includes(dest);
}
/** Rule: execution needs both content approval and distribution approval. */
export function distributionReadiness(contentApproval: ApprovalStatus | null, distributionApproval: ApprovalStatus | null) {
  if (contentApproval !== "Disetujui") return "Belum dapat didistribusikan";
  if (distributionApproval !== "Disetujui") return "Menunggu Approval Distribusi";
  return "Siap Eksekusi";
}
/** Content can be submitted only once generated and while not already under review or approved. */
export function canSubmit(item: Pick<ProductionItem, "status" | "approval">) {
  return item.status === "Generated" && (item.approval === null || item.approval === "Perlu Revisi" || item.approval === "Ditolak");
}
export function approvalLabel(a: ApprovalStatus | null) {
  return a === null ? "Belum Diajukan" : a === "Menunggu" ? "Menunggu Review" : a === "Disetujui" ? "Approved" : a;
}

const EMPTY: ProductionContent = { headline: "", subtitle: "", lead: "", body: "", tags: [], slides: [], highlights: [], caption: "", duration: 45, format: "9:16", voiceOver: true, voice: "Informatif", transcript: "" };
export function emptyContent(type: OutputType): ProductionContent {
  return { ...EMPTY, duration: type === "Audio / Podcast" ? 60 : 45 };
}

const firstSentence = (s: string) => (s.match(/[^.!?]+[.!?]?/)?.[0] ?? s).trim();
const HEADLINES = (t: string) => [t, `${t}: Informasi Terverifikasi untuk Publik`, `Perkembangan Terkini ${t}`];

/** Deterministic dummy generator: the system decides structure per output type from the brief. */
export function generateContent(type: OutputType, brief: ProductionBrief, variant: number, keep?: Partial<ProductionContent>): ProductionContent {
  const theme = brief.theme || "Produksi";
  const points = brief.points.filter(Boolean);
  const headline = HEADLINES(theme)[variant % 3]!;
  const base = { ...emptyContent(type), ...keep };
  const highlights = points.slice(0, 3).map((p) => ({ value: p.match(/[+-]?\d+[%]?/)?.[0] ?? "•", label: p.replace(/[+-]?\d+[%]?/, "").trim() }));
  switch (type) {
    case "News Article":
      return { ...base, headline, subtitle: firstSentence(brief.message), lead: variant % 2 ? `Berdasarkan pemantauan terkini, ${brief.message.charAt(0).toLowerCase()}${brief.message.slice(1)}` : brief.message,
        body: [...points.map((p) => `${p}. Informasi ini dihimpun dari sumber yang tercatat dan terus diperbarui.`), "Masyarakat diimbau merujuk kanal resmi untuk pembaruan dan tidak menyebarkan informasi yang belum dikonfirmasi."].join("\n\n"),
        tags: [theme.split(" ").slice(-2).join(" "), "Informasi Publik", "Terverifikasi"] };
    case "Infografis":
      return { ...base, headline, highlights, caption: `${firstSentence(brief.message)} Rujuk kanal resmi untuk pembaruan.` };
    case "Carousel":
      return { ...base, headline, caption: `${theme} — ringkasan dalam ${5} slide.`, slides: [
        { label: "Headline", text: headline },
        { label: "Konteks", text: firstSentence(brief.message) },
        { label: "Fakta", text: points.slice(0, 3).join(" · ") || "Fakta utama dari brief." },
        { label: "Klarifikasi", text: points.find((p) => /belum|klarifikasi|hoaks/i.test(p)) ?? "Pastikan informasi berasal dari sumber resmi." },
        { label: "Penutup", text: "Ikuti kanal resmi untuk pembaruan terverifikasi." },
      ] };
    case "Video Pendek":
      return { ...base, headline, transcript: [`[Pembuka] ${headline}.`, `[Inti] ${brief.message}`, ...points.map((p) => `[Poin] ${p}.`), "[Penutup] Rujuk kanal resmi untuk pembaruan."].join("\n") };
    case "Audio / Podcast":
      return { ...base, headline, transcript: [`Halo, ini ringkasan ${theme}.`, brief.message, ...points.map((p) => `${p}.`), "Terima kasih telah mendengarkan. Ikuti kanal resmi untuk informasi terbaru."].join("\n\n") };
  }
}

export type Check = { ok: boolean; label: string };
/** Automated editorial / quality check: common checks plus type-specific ones, in plain language. */
export function qualityChecks(item: Pick<ProductionItem, "type" | "brief" | "content" | "status" | "source">): Check[] {
  if (item.status !== "Generated") return [];
  const { content: c, brief } = item;
  const unverified = brief.points.some((p) => /belum (ter)?verifikasi|belum dikonfirmasi/i.test(p));
  const numbers = brief.points.filter((p) => /\d/.test(p)).length;
  const common: Check[] = [
    { ok: true, label: "Pesan konsisten dengan Pesan Utama" },
    { ok: item.source === "Strategi" || numbers === 0, label: item.source === "Strategi" || numbers === 0 ? "Fakta/angka memiliki sumber" : `${numbers} angka belum memiliki sumber` },
    { ok: true, label: "Tone sesuai" },
    { ok: !unverified, label: unverified ? "1 klaim perlu verifikasi" : "Tidak ada klaim bermasalah" },
  ];
  const extra: Check[] =
    item.type === "News Article" ? [{ ok: c.body.split("\n\n").length >= 3, label: "Struktur artikel baik" }, { ok: c.lead.length <= 200, label: c.lead.length <= 200 ? "Headline & lead sesuai" : "Lead terlalu panjang" }]
    : item.type === "Video Pendek" ? [{ ok: true, label: `Durasi sesuai (${c.duration} detik)` }, { ok: true, label: "Subtitle tersedia" }, { ok: c.voiceOver, label: c.voiceOver ? "Voice-over tersedia" : "Tanpa voice-over" }]
    : item.type === "Audio / Podcast" ? [{ ok: !!c.transcript, label: "Transkrip tersedia" }, { ok: true, label: `Durasi ${c.duration} detik` }]
    : [{ ok: true, label: "Mudah dibaca" }, { ok: (c.slides.length ? c.slides : c.highlights).length <= 6, label: "Kepadatan teks wajar" }, { ok: true, label: "Hierarki informasi jelas" }];
  return [...common, ...extra];
}

export const DEMO_BRIEF: ProductionBrief = {
  theme: "Respons Informasi Demonstrasi Nasional",
  message: "Informasi perkembangan demonstrasi perlu disampaikan berdasarkan sumber terverifikasi, dengan penekanan pada kondisi aktual dan klarifikasi terhadap informasi yang belum dikonfirmasi.",
  points: ["Volume percakapan meningkat +63%", "Aktivitas meningkat di 6 wilayah", "Sentimen negatif 46%", "Beberapa informasi masih belum terverifikasi"],
  style: ["Faktual", "Tenang"], audience: "Publik Jakarta & Bandung, 18–45 tahun", region: "Jakarta, Bandung", channels: ["X", "TikTok", "News"],
};

/** Bulk creation: one Produksi item per selected output type, all inheriting the same brief and source. */
export function buildItems(brief: ProductionBrief, types: OutputType[], origin: Pick<ProductionItem, "source" | "strategySlug" | "strategyTitle" | "situationSlug" | "situationName">, firstNumber: number): ProductionItem[] {
  return types.map((type, i) => {
    const m = outputMeta(type);
    return { id: `PRD-${String(firstNumber + i).padStart(3, "0")}`, title: `${m.prefix} ${brief.theme.replace(/^Respons /, "")}`, type, family: m.family, dest: [m.dest], ...origin, brief, status: "Draft", approval: null, version: 0, variant: 0, content: emptyContent(type), history: [], approvals: [], updated: "Baru saja" };
  });
}

const demoOrigin = { source: "Strategi" as const, strategySlug: "respons-informasi-demonstrasi-nasional", strategyTitle: "Respons Informasi Demonstrasi Nasional", situationSlug: "demonstrasi-nasional", situationName: "Demonstrasi Nasional" };
type Seed = { approval: ApprovalStatus | null; history: HistoryEntry[]; approvals?: ApprovalRecord[]; by?: string; at?: string; day?: SubmittedDay; origin?: Partial<ProductionItem>; status?: ProductionStatus; note?: string };
const seeded = (id: string, title: string, type: OutputType, o: Seed): ProductionItem => {
  const m = outputMeta(type);
  const origin = o.origin ?? demoOrigin;
  const status = o.status ?? "Generated";
  const brief = ["PRD-017", "PRD-019", "PRD-020"].includes(id) ? {
    ...DEMO_BRIEF, theme: "Informasi Demonstrasi Nasional",
    message: "Perkembangan demonstrasi perlu dipahami melalui kondisi aktual dan sumber terverifikasi. Pisahkan fakta dari kabar yang belum dikonfirmasi.",
    points: ["Pantau pembaruan kondisi lapangan dari sumber resmi", "Periksa waktu dan lokasi sebelum membagikan informasi", "Utamakan keselamatan dan akses layanan publik", "Kabar yang belum dikonfirmasi perlu diverifikasi melalui kanal resmi"],
  } : origin.source === "Manual" ? { ...DEMO_BRIEF, theme: "Ringkasan Situasi", channels: undefined } : DEMO_BRIEF;
  return { id, title, type, family: m.family, dest: [m.dest], source: "Strategi", ...origin, brief, status, approval: o.approval, version: o.history.at(-1)?.version ?? 0, variant: 0, content: status === "Generated" ? generateContent(type, brief, 0) : emptyContent(type), history: o.history, approvals: o.approvals ?? [], submittedBy: o.by, submittedAt: o.at, submittedDay: o.day, reviewNote: o.note, updated: "15 menit lalu" };
};
const g = (version: number, label: HistoryEntry["label"], at: string): HistoryEntry => ({ version, label, at });

export const initialProductions: ProductionItem[] = [
  seeded("PRD-021", "Artikel Informasi Demonstrasi Nasional", "News Article", { approval: "Menunggu", by: "Tim Editorial", at: "12 menit lalu", day: "Hari ini",
    history: [g(1, "Generated", "08:50"), g(1, "Diajukan", "09:12"), g(1, "Perlu Revisi", "09:35"), g(2, "Edited", "10:02"), g(2, "Diajukan", "10:10")],
    approvals: [{ at: "09:12", actor: "Tim Editorial", decision: "Diajukan", version: 1 }, { at: "09:35", actor: "Supervisor", decision: "Perlu Revisi", version: 1, note: "Perjelas sumber pada bagian ketiga." }, { at: "10:10", actor: "Tim Editorial", decision: "Diajukan Kembali", version: 2 }] }),
  seeded("PRD-022", "Video Penjelasan Demonstrasi", "Video Pendek", { approval: "Menunggu", by: "Tim Produksi", at: "18 menit lalu", day: "Hari ini",
    history: [g(1, "Generated", "09:58"), g(1, "Diajukan", "10:04")], approvals: [{ at: "10:04", actor: "Tim Produksi", decision: "Diajukan", version: 1 }] }),
  seeded("PRD-023", "Carousel Informasi Demonstrasi", "Carousel", { approval: "Perlu Revisi", by: "Tim Produksi", at: "1 jam lalu", day: "Hari ini", note: "Slide Fakta jangan dibuka dengan angka; utamakan klarifikasi.",
    history: [g(1, "Generated", "08:30"), g(2, "Edited", "08:52"), g(2, "Diajukan", "09:00"), g(2, "Perlu Revisi", "09:20")],
    approvals: [{ at: "09:00", actor: "Tim Produksi", decision: "Diajukan", version: 2 }, { at: "09:20", actor: "Supervisor", decision: "Perlu Revisi", version: 2, note: "Slide Fakta jangan dibuka dengan angka; utamakan klarifikasi." }] }),
  seeded("PRD-024", "Audio Ringkasan Situasi", "Audio / Podcast", { approval: null, history: [], origin: { source: "Manual" }, status: "Draft" }),
  seeded("PRD-020", "Video Penjelasan Demonstrasi Nasional", "Video Pendek", { approval: "Disetujui", by: "Tim Produksi", at: "Kemarin", day: "Kemarin",
    history: [g(1, "Generated", "15:10"), g(1, "Diajukan", "15:20"), g(1, "Approved", "15:42")], approvals: [{ at: "15:20", actor: "Tim Produksi", decision: "Diajukan", version: 1 }, { at: "15:42", actor: "Supervisor", decision: "Disetujui", version: 1 }] }),
  seeded("PRD-019", "Infografis Informasi Demonstrasi Nasional", "Infografis", { approval: "Disetujui", by: "Tim Produksi", at: "Kemarin", day: "Kemarin",
    history: [g(1, "Generated", "14:30"), g(1, "Diajukan", "14:40"), g(1, "Approved", "15:05")], approvals: [{ at: "14:40", actor: "Tim Produksi", decision: "Diajukan", version: 1 }, { at: "15:05", actor: "Supervisor", decision: "Disetujui", version: 1 }] }),
  seeded("PRD-017", "Carousel Informasi Demonstrasi Nasional", "Carousel", { approval: "Disetujui", by: "Tim Produksi", at: "Kemarin", day: "Kemarin",
    history: [g(1, "Generated", "13:40"), g(1, "Diajukan", "13:55"), g(1, "Approved", "14:20")], approvals: [{ at: "13:55", actor: "Tim Produksi", decision: "Diajukan", version: 1 }, { at: "14:20", actor: "Supervisor", decision: "Disetujui", version: 1 }] }),
  seeded("PRD-018", "Artikel Demonstrasi Nasional — Edisi Pagi", "News Article", { approval: "Disetujui", by: "Tim Editorial", at: "Kemarin", day: "Kemarin",
    history: [g(1, "Generated", "06:40"), g(1, "Diajukan", "06:55"), g(1, "Approved", "07:12")], approvals: [{ at: "06:55", actor: "Tim Editorial", decision: "Diajukan", version: 1 }, { at: "07:12", actor: "Supervisor", decision: "Disetujui", version: 1 }] }),
];

const sixteen = [NATIONAL_CHANNEL, "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "Jawa Timur", "Banten", "DI Yogyakarta", "Sumatera Utara", "Sumatera Selatan", "Lampung", "Kalimantan Timur", "Sulawesi Selatan", "Bali", "Nusa Tenggara Barat", "Riau", "Sulawesi Utara"];
export const initialOrders: NewsOrder[] = [
  { id: "DN-012", title: "Publikasi Artikel Demonstrasi", productionId: "PRD-018", contentId: "PRD-018", channels: sixteen.map((channel) => ({ channel, status: "Draft Order" as const, schedule: recommendedScheduleFor(channel) })), schedule: "8–9 Oktober 2026", deadline: "09 Okt, 20:00 WIB", notes: "Penyesuaian headline dan konteks wilayah diperbolehkan.", status: "Menunggu Approval", approval: "Menunggu",
    submittedBy: "Tim Media", submittedAt: "31 menit lalu", submittedDay: "Hari ini", approvals: [{ at: "10:05", actor: "Tim Media", decision: "Diajukan" }] },
  { id: "DN-011", title: "Publikasi Edisi Pagi", productionId: "PRD-018", contentId: "PRD-018", channels: [
    { channel: "Jawa Barat", status: "Menunggu Verifikasi", url: "https://nusakanaljawabarat.com/berita/informasi-aksi" },
    { channel: "DKI Jakarta", status: "Dalam Pengerjaan" },
    { channel: "Banten", status: "Dikirim" },
  ], schedule: "Hari ini, 09:00 WIB", notes: "Edisi pagi.", status: "Dikirim", approval: "Disetujui",
    submittedBy: "Tim Media", submittedAt: "Kemarin", submittedDay: "Kemarin", approvals: [{ at: "07:20", actor: "Tim Media", decision: "Diajukan" }, { at: "07:41", actor: "Supervisor", decision: "Disetujui" }] },
];
