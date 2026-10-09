import { initialProductions, type ApprovalRecord, type ApprovalStatus, type NewsOrder, type OutputType, type ProductionItem, type SubmittedDay } from "./data";

export const SOCIAL_PLATFORMS = ["X", "Instagram", "TikTok", "Facebook", "Threads", "YouTube"] as const;
export const PURPOSES = ["Diseminasi Informasi", "Klarifikasi", "Penguatan Informasi Resmi", "Counter Narrative", "Edukasi Publik"];

/** Which platforms each social asset type is suited to. */
export const PLATFORM_FIT: Partial<Record<OutputType, string[]>> = {
  "Video Pendek": ["TikTok", "Instagram", "YouTube", "Facebook"],
  Carousel: ["Instagram", "Facebook", "X"],
  Infografis: ["X", "Instagram", "Facebook"],
};
export const recommendedPlatforms = (types: OutputType[]) => [...new Set(types.flatMap((type) => PLATFORM_FIT[type] ?? []))];
export const fits = (type: OutputType, platform: string) => (PLATFORM_FIT[type]?.includes(platform) ?? false) || (platform === "Threads" && ["Carousel", "Infografis", "Video Pendek"].includes(type)) || (type === "Audio / Podcast" && ["YouTube", "Facebook"].includes(platform));

/** Revisi 7 — S48: per-platform recommended posting window, derived from (simulated) audience activity, account history, and content type. */
export const PLATFORM_WINDOWS: { platform: string; from: string; to: string }[] = [
  { platform: "X", from: "09:00", to: "11:00" },
  { platform: "Instagram", from: "11:00", to: "13:00" },
  { platform: "TikTok", from: "17:00", to: "20:00" },
  { platform: "Facebook", from: "10:00", to: "12:00" },
  { platform: "YouTube", from: "18:00", to: "21:00" },
  { platform: "Threads", from: "12:00", to: "14:00" },
];
export const windowFor = (platform: string) => PLATFORM_WINDOWS.find((w) => w.platform === platform);
/** Build the recommended windows for whichever platforms are in play; falls back to the X window when unknown. */
export function recommendedWindowsFor(platforms: string[]): { from: string; to: string }[] {
  const unique = [...new Set(platforms)];
  const windows = unique.map((p) => windowFor(p)).filter((w): w is { platform: string; from: string; to: string } => !!w).map(({ from, to }) => ({ from, to }));
  return windows.length ? windows : [{ from: "09:00", to: "11:00" }];
}

export type AccountStatus = "Ready" | "Busy" | "Unavailable";
/** Connection-status label shown in Pengelolaan Akun Sosial; keeps the targeting-oriented AccountStatus untouched elsewhere. */
export const CONN_LABEL: Record<AccountStatus, string> = { Ready: "Terhubung", Busy: "Perlu Autentikasi Ulang", Unavailable: "Terputus" };

export const ACCOUNT_ROLES = ["Viewer", "Operator", "Pengelola Akun", "Administrator"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];
export type Permission = "melihat" | "menyusunDistribusi" | "mengelolaKoneksi" | "mengeksekusiPublikasi";
export const PERMISSION_LABELS: Record<Permission, string> = {
  melihat: "Melihat",
  menyusunDistribusi: "Menyusun Distribusi",
  mengelolaKoneksi: "Mengelola Koneksi",
  mengeksekusiPublikasi: "Mengeksekusi Publikasi (setelah approval)",
};
/** Revisi 6 — S46: fixed role → permission matrix; account-level "Hak Akses" is which roles have been granted on that account. */
export const ROLE_PERMISSIONS: Record<AccountRole, Record<Permission, boolean>> = {
  Viewer: { melihat: true, menyusunDistribusi: false, mengelolaKoneksi: false, mengeksekusiPublikasi: false },
  Operator: { melihat: true, menyusunDistribusi: true, mengelolaKoneksi: false, mengeksekusiPublikasi: false },
  "Pengelola Akun": { melihat: true, menyusunDistribusi: true, mengelolaKoneksi: true, mengeksekusiPublikasi: false },
  Administrator: { melihat: true, menyusunDistribusi: true, mengelolaKoneksi: true, mengeksekusiPublikasi: true },
};

export type SocialAccount = { id: string; handle: string; platform: string; group: string; label: string; status: AccountStatus; pic: string; roles: AccountRole[]; updatedAt: string };
const A = (handle: string, platform: string, group: string, label: string, status: AccountStatus = "Ready", pic = "Tim Digital", roles: AccountRole[] = ["Operator", "Pengelola Akun"], updatedAt = "Hari ini"): SocialAccount => ({ id: `${platform}:${handle}`, handle, platform, group, label, status, pic, roles, updatedAt });
/** Revisi 6 — S46: canonical account list. This is the single source used by Pengelolaan Akun Sosial AND Distribusi Sosial → Target. */
export const SOCIAL_ACCOUNTS: SocialAccount[] = [
  A("@pantau_kota", "X", "Jaringan Nasional", "Informasi Resmi", "Ready", "Tim Digital", ["Operator", "Pengelola Akun", "Administrator"]),
  A("@info_aksi", "X", "Jaringan Nasional", "Informasi Resmi", "Ready", "Tim Digital", ["Operator", "Pengelola Akun"]),
  A("@analisis_media", "X", "Jaringan Nasional", "Analisis", "Ready", "Tim Analis", ["Viewer", "Operator"]),
  A("@forum_mahasiswa", "X", "Komunitas", "Komunitas", "Ready", "Tim Komunitas", ["Operator"]),
  A("@kabar_daerah", "X", "Jaringan Daerah", "Informasi Resmi", "Busy", "Tim Daerah", ["Operator"], "2 hari lalu"),
  A("@suara_warga", "Instagram", "Komunitas", "Komunitas", "Ready", "Tim Komunitas", ["Operator", "Pengelola Akun"]),
  A("@media_nusantara", "Instagram", "Jaringan Nasional", "Informasi Resmi", "Ready", "Tim Digital", ["Operator", "Pengelola Akun", "Administrator"]),
  A("@ruangpublik", "Instagram", "Komunitas", "Komunitas", "Ready", "Tim Komunitas", ["Viewer", "Operator"]),
  A("@kabar_daerah", "Instagram", "Jaringan Daerah", "Informasi Resmi", "Ready", "Tim Daerah", ["Operator"]),
  A("@info_aksi", "Instagram", "Jaringan Nasional", "Informasi Resmi", "Unavailable", "Tim Digital", ["Viewer"], "5 hari lalu"),
  A("@ruangpublik", "TikTok", "Komunitas", "Komunitas", "Ready", "Tim Komunitas", ["Operator", "Pengelola Akun"]),
  A("@forum_mahasiswa", "TikTok", "Komunitas", "Komunitas", "Ready", "Tim Komunitas", ["Operator"]),
  A("@suara_warga", "TikTok", "Komunitas", "Komunitas", "Ready", "Tim Komunitas", ["Operator"]),
  A("@info_aksi", "TikTok", "Jaringan Nasional", "Informasi Resmi", "Ready", "Tim Digital", ["Operator", "Pengelola Akun"]),
  A("@pantau_kota", "TikTok", "Jaringan Nasional", "Informasi Resmi", "Busy", "Tim Digital", ["Operator"], "3 hari lalu"),
  A("@media_nusantara", "Facebook", "Jaringan Nasional", "Informasi Resmi", "Ready", "Tim Digital", ["Operator", "Pengelola Akun"]),
  A("@kabar_daerah", "Facebook", "Jaringan Daerah", "Informasi Resmi", "Ready", "Tim Daerah", ["Operator"]),
  A("@suara_warga", "Threads", "Komunitas", "Komunitas", "Ready", "Tim Komunitas", ["Operator"]),
  A("@analisis_media", "YouTube", "Jaringan Nasional", "Analisis", "Ready", "Tim Analis", ["Viewer", "Operator", "Pengelola Akun"]),
];
export const accountById = (id: string) => SOCIAL_ACCOUNTS.find((a) => a.id === id);
export const GROUPS = [...new Set(SOCIAL_ACCOUNTS.map((a) => a.group))];
export const LABELS = [...new Set(SOCIAL_ACCOUNTS.map((a) => a.label))];
/** Dynamic variants for a live (possibly edited) account list, e.g. from AksiProvider. */
export const groupsOf = (accounts: SocialAccount[]) => [...new Set(accounts.map((a) => a.group))];
export const labelsOf = (accounts: SocialAccount[]) => [...new Set(accounts.map((a) => a.label))];
/** Only Ready accounts may be targeted. */
export const selectable = (a: Pick<SocialAccount, "status">) => a.status === "Ready";

export type Timing = { mode: "Segera" | "Jadwal"; start: string; end: string; from: string; to: string; windows?: { from: string; to: string }[] | undefined };
export type PrepStatus = "Belum Disiapkan" | "Siap" | "Diedit";
export type PostStatus = "Ready" | "Scheduled" | "Publishing" | "Published" | "Failed" | "Cancelled";
export type Post = { id: string; accountId: string; handle: string; platform: string; assetId: string; assetType: OutputType; assetTitle: string; date: string; time: string; caption: string; hashtags: string[]; variant: number; prep: PrepStatus; exec: PostStatus; actual?: string | undefined; reason?: string | undefined };
export type DistStatus = "Draft" | "Menunggu Persetujuan" | "Perlu Perubahan" | "Disetujui" | "Dijadwalkan" | "Sedang Berjalan" | "Selesai" | "Ditolak" | "Dibatalkan";
export type DistLog = { at: string; text: string };
export type Campaign = {
  id: string; name: string; productionId: string; contentIds: string[]; purpose: string[]; direction: string; platforms: string[]; accounts: string[];
  timing: Timing; staggered: boolean; posts: Post[]; status: DistStatus; approval: ApprovalStatus | null; history: DistLog[];
  approvals?: ApprovalRecord[] | undefined; submittedBy?: string | undefined; submittedAt?: string | undefined; submittedDay?: SubmittedDay | undefined;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const parse = (d: string) => new Date(`${d}T00:00:00Z`);
export function dayList(t: Pick<Timing, "start" | "end">): string[] {
  const out: string[] = [];
  const end = parse(t.end).getTime();
  for (let d = parse(t.start); d.getTime() <= end && out.length < 31; d = new Date(d.getTime() + 86400000)) out.push(d.toISOString().slice(0, 10));
  return out.length ? out : [t.start];
}
export const dateLabel = (d: string) => { const x = parse(d); return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}`; };
export function periodLabel(t: Pick<Timing, "start" | "end">) {
  const a = parse(t.start), b = parse(t.end);
  if (t.start === t.end || b < a) return dateLabel(t.start);
  return a.getUTCMonth() === b.getUTCMonth() ? `${a.getUTCDate()}–${b.getUTCDate()} ${MONTHS[a.getUTCMonth()]}` : `${dateLabel(t.start)} – ${dateLabel(t.end)}`;
}
const toMin = (hm: string) => { const [h, m] = hm.split(":").map(Number); return (h ?? 0) * 60 + (m ?? 0); };
const toHm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

type Asset = Pick<ProductionItem, "id" | "type" | "title" | "brief">;
const OPENERS = ["", "Perlu diketahui: ", "Update resmi: ", "Info penting: ", "Sebelum membagikan, simak: "];
const CLOSERS = ["Cek sumber resmi sebelum membagikan.", "Rujuk kanal resmi untuk info terbaru.", "Bantu sebarkan informasi yang terverifikasi.", "Pastikan informasi dari sumber terpercaya."];

/** Platform-specific caption, varied per account but anchored on the same Pesan Utama. */
export function captionFor(platform: string, asset: Asset, purpose: string[], variant: number, account?: SocialAccount) {
  const msg = asset.brief.message.trim();
  const open = OPENERS[variant % OPENERS.length] ?? "";
  const close = CLOSERS[variant % CLOSERS.length] ?? "";
  const aim = purpose[0] ?? "Diseminasi Informasi";
  const context = asset.brief.points.filter((p) => !/belum/i.test(p));
  const fact = context[variant % Math.max(1, context.length)] ?? asset.brief.theme;
  const action = asset.type === "Carousel" ? "Geser slide untuk konteks, fakta, dan klarifikasi." : asset.type === "Video Pendek" ? "Simak video penjelasan berikut." : asset.type === "Infografis" ? "Baca tiga poin utama pada infografis." : "Simak ringkasan berikut.";
  const goal = aim === "Klarifikasi" || aim === "Counter Narrative" ? "Pisahkan fakta dari kabar yang belum dikonfirmasi." : aim === "Edukasi Publik" ? "Kenali konteksnya sebelum mengambil kesimpulan." : "Rujuk pembaruan dari sumber terverifikasi.";
  switch (platform) {
    case "X": return (account?.label === "Analisis" ? `Konteks ${asset.brief.theme}: ${fact}. ${goal} ${action}` : `${fact}. ${goal} ${action}`).slice(0, 280);
    case "Instagram": return `${msg}\n\n${account?.label === "Komunitas" ? "Untuk teman-teman di ruang publik" : "Informasi untuk publik"}: ${fact}.\n${action}\n\n${goal} ${close}`;
    case "TikTok": return `Sudah cek informasi terbaru? ${fact}. ${action} ${goal}`;
    case "Threads": return `Kita sering menerima potongan informasi tentang ${asset.brief.theme}. ${fact}. ${goal} ${action}`;
    default: return `${open}${msg}\n\n${fact}. ${action} ${goal} ${close}`;
  }
}
export const hashtagsFor = (platform: string) => ["#InfoResmi", "#CekFakta", ...(platform === "TikTok" ? ["#FYPInfo"] : platform === "Instagram" ? ["#RuangInformasi"] : [])];

/** Curate one or two compatible assets per account, rotated to cover the selected content. */
export function buildPosts(assets: Asset[], accounts: SocialAccount[], purpose: string[], timing: Timing, staggered: boolean): Post[] {
  const units = accounts.filter(selectable).flatMap((a, i) => {
    const eligible = assets.filter((x) => fits(x.type, a.platform));
    const rotated = [...eligible.slice(i % Math.max(1, eligible.length)), ...eligible.slice(0, i % Math.max(1, eligible.length))];
    const limit = a.platform === "Instagram" || a.platform === "Facebook" || (a.platform === "X" && i % 2 === 1) ? 2 : 1;
    return rotated.slice(0, limit).map((x) => ({ a, x }));
  });
  const days = dayList(timing.mode === "Segera" ? { start: timing.start, end: timing.start } : timing);
  const perDay = Math.max(1, Math.ceil(units.length / days.length));
  const from = toMin(timing.from), span = Math.max(0, toMin(timing.to) - from);
  return units.map(({ a, x }, i) => {
    const k = i % perDay;
    const window = timing.windows?.[k % timing.windows.length];
    const minute = window && staggered ? toMin(window.from) + Math.round((Math.floor(k / Math.max(1, timing.windows?.length ?? 1)) * (toMin(window.to) - toMin(window.from))) / Math.max(1, Math.ceil(perDay / Math.max(1, timing.windows?.length ?? 1))) / 5) * 5 : staggered ? from + Math.round((k * span) / perDay / 5) * 5 : from;
    return { id: `P${String(i + 1).padStart(2, "0")}`, accountId: a.id, handle: a.handle, platform: a.platform, assetId: x.id, assetType: x.type, assetTitle: x.title, date: days[Math.min(days.length - 1, Math.floor(i / perDay))] ?? timing.start, time: toHm(minute), caption: captionFor(a.platform, x, purpose, i, a), hashtags: hashtagsFor(a.platform), variant: i, prep: "Siap", exec: "Ready" };
  });
}
export function regeneratePost(p: Post, asset: Asset, purpose: string[]): Post {
  const variant = p.variant + 1;
  return { ...p, variant, caption: captionFor(p.platform, asset, purpose, variant, accountById(p.accountId)), prep: "Siap" };
}

export type ReadyCheck = { ok: boolean; label: string };
export function readinessChecks(c: Pick<Campaign, "contentIds" | "accounts" | "posts" | "timing">, productions: Pick<ProductionItem, "id" | "approval" | "type">[]): ReadyCheck[] {
  const notApproved = c.contentIds.filter((id) => productions.find((p) => p.id === id)?.approval !== "Disetujui").length;
  const unavailable = c.accounts.filter((id) => accountById(id)?.status !== "Ready").length;
  const noCaption = c.posts.filter((p) => !p.caption.trim()).length;
  const validHM = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  const validTime = Number.isFinite(parse(c.timing.start).getTime()) && Number.isFinite(parse(c.timing.end).getTime()) && c.timing.start <= c.timing.end && validHM(c.timing.from) && validHM(c.timing.to) && toMin(c.timing.from) < toMin(c.timing.to) && (c.timing.windows ?? []).every((w) => validHM(w.from) && validHM(w.to) && toMin(w.from) < toMin(w.to));
  const uncovered = c.contentIds.map((id) => productions.find((p) => p.id === id)).filter((p) => p && !c.accounts.some((id) => fits(p.type, accountById(id)?.platform ?? "")));
  const wrongPost = c.posts.some((p) => !c.contentIds.includes(p.assetId) || !c.accounts.includes(p.accountId) || accountById(p.accountId)?.platform !== p.platform || !fits(p.assetType, p.platform));
  return [
    { ok: c.contentIds.length > 0 && !notApproved, label: !c.contentIds.length ? "Belum ada konten dipilih" : notApproved ? `${notApproved} konten belum Approved` : "Semua konten sudah Approved" },
    { ok: c.accounts.length > 0 && !unavailable, label: !c.accounts.length ? "Belum ada akun dipilih" : unavailable ? `${unavailable} akun tidak tersedia` : "Semua akun tersedia" },
    { ok: c.posts.length > 0 && c.posts.every((p) => p.prep !== "Belum Disiapkan") && c.contentIds.every((id) => c.posts.some((p) => p.assetId === id)), label: c.posts.length ? "Semua paket publikasi siap" : "Paket publikasi belum disiapkan" },
    { ok: c.posts.length > 0 && !noCaption, label: noCaption ? `${noCaption} posting belum memiliki caption` : "Copy tersedia untuk semua posting" },
    { ok: validTime, label: validTime ? "Jadwal valid" : "Jadwal tidak valid" },
    { ok: !uncovered.length && !wrongPost, label: uncovered.length ? `${uncovered.map((p) => p?.type).join(", ")} belum memiliki target platform yang sesuai` : wrongPost ? "Ada paket dengan platform atau asset yang tidak sesuai" : "Platform sesuai dengan asset" },
  ];
}
export const canSubmitDistribution = (checks: ReadyCheck[]) => checks.every((c) => c.ok);

/** Distribution Approval decides what happens next; nothing runs before Disetujui. */
export function statusAfterDecision(decision: Exclude<ApprovalStatus, "Menunggu">, mode: Timing["mode"]): DistStatus {
  if (decision === "Disetujui") return mode === "Segera" ? "Sedang Berjalan" : "Dijadwalkan";
  return decision === "Perlu Revisi" ? "Perlu Perubahan" : "Ditolak";
}
export const canExecute = (c: Pick<Campaign, "approval" | "status">) => c.approval === "Disetujui" && (c.status === "Dijadwalkan" || c.status === "Sedang Berjalan");
export const isEditable = (c: Pick<Campaign, "status">) => c.status === "Draft" || c.status === "Perlu Perubahan";

const plusMin = (hm: string, n: number) => toHm(toMin(hm) + n);
/** Simulate the next execution wave: publish half of what is still queued; the very first wave has one failure. */
export function advanceExecution(posts: Post[]): Post[] {
  const queued = posts.filter((p) => p.exec === "Scheduled" || p.exec === "Ready");
  const first = !posts.some((p) => p.exec === "Published" || p.exec === "Failed");
  const batch = new Set(queued.slice(0, Math.max(1, Math.ceil(queued.length / 2))).map((p) => p.id));
  const failId = first && queued.length > 2 ? queued[1]?.id : undefined;
  return posts.map((p) => !batch.has(p.id) ? p : p.id === failId ? { ...p, exec: "Failed", reason: "Token akses akun kedaluwarsa" } : { ...p, exec: "Published", actual: plusMin(p.time, p.id.charCodeAt(2) % 2) });
}
export const retry = (p: Post): Post => ({ ...p, exec: "Published", actual: plusMin(p.time, 6), reason: undefined });
export const executionDone = (posts: Post[]) => posts.length > 0 && posts.every((p) => p.exec === "Published" || p.exec === "Cancelled");

export function scale(c: Pick<Campaign, "contentIds" | "accounts" | "platforms" | "timing" | "posts">, plannedPosts = c.posts.length) {
  return { assets: c.contentIds.length, accounts: c.accounts.length, platforms: new Set(c.accounts.map((id) => accountById(id)?.platform)).size || c.platforms.length, days: dayList(c.timing).length, posts: plannedPosts };
}
export function spreadPotential(c: Pick<Campaign, "contentIds" | "accounts" | "posts" | "timing">): "Rendah" | "Sedang" | "Tinggi" {
  const platforms = new Set(c.posts.map((p) => p.platform)).size;
  return c.contentIds.length >= 3 && c.accounts.length >= 8 && platforms >= 3 ? "Tinggi" : c.accounts.length >= 3 && platforms >= 2 ? "Sedang" : "Rendah";
}

// ---------- Revisi 14 — S69: Rencana Publikasi (pure derivation, no new form for the user) ----------
export type RencanaPublikasiRow = { distribusi: string; target: string; jadwal: string; pic: string; status: string };
/** Derives "who is going to publish this content, where, when" purely from existing Distribusi Sosial / Distribusi News records. */
export function rencanaPublikasi(productionId: string, campaigns: Campaign[], orders: NewsOrder[]): RencanaPublikasiRow[] {
  const rows: RencanaPublikasiRow[] = [];
  for (const c of campaigns) {
    const posts = c.posts.filter((p) => p.assetId === productionId);
    for (const platform of [...new Set(posts.map((p) => p.platform))]) {
      const post = posts.find((p) => p.platform === platform);
      if (!post) continue;
      const status = post.exec === "Published" ? "Dipublikasikan" : post.exec === "Failed" ? "Gagal — perlu ditinjau" : c.approval === "Disetujui" ? "Dijadwalkan" : c.status === "Perlu Perubahan" ? "Perlu Perubahan" : "Menunggu Persetujuan";
      rows.push({ distribusi: c.name, target: platform, jadwal: `${dateLabel(post.date)}, ${post.time}`, pic: c.submittedBy ?? "Tim Digital", status });
    }
  }
  for (const o of orders) {
    if (o.contentId !== productionId) continue;
    for (const ch of o.channels) {
      rows.push({ distribusi: o.title ?? `Order ${o.id}`, target: `Kanal ${ch.channel}`, jadwal: ch.schedule ?? o.schedule, pic: o.submittedBy ?? "Tim Media", status: ch.status });
    }
  }
  return rows;
}

// ---------- Seeds ----------
const prod = (id: string) => initialProductions.find((p) => p.id === id) as ProductionItem;
const ids = (platform: string, handles: string[]) => handles.map((h) => `${platform}:${h}`);
const pickAccounts = (list: string[]) => list.map((id) => accountById(id)).filter((a): a is SocialAccount => !!a);

const demoAccounts = [
  ...ids("X", ["@pantau_kota", "@info_aksi", "@analisis_media", "@forum_mahasiswa"]),
  ...ids("Instagram", ["@suara_warga", "@media_nusantara", "@ruangpublik", "@kabar_daerah"]),
  ...ids("TikTok", ["@ruangpublik", "@forum_mahasiswa", "@suara_warga", "@info_aksi"]),
];
const demoTiming: Timing = { mode: "Jadwal", start: "2026-10-09", end: "2026-10-10", from: "09:00", to: "18:00" };
const demoPurpose = ["Klarifikasi", "Diseminasi Informasi"];
const demoContent = ["PRD-017", "PRD-020", "PRD-019"];

const clarAccounts = [...ids("Instagram", ["@suara_warga", "@media_nusantara", "@ruangpublik"]), ...ids("TikTok", ["@ruangpublik", "@forum_mahasiswa", "@suara_warga"])];
const clarTiming: Timing = { mode: "Segera", start: "2026-10-08", end: "2026-10-08", from: "09:00", to: "18:00" };
const clarPosts = advanceExecution(buildPosts([prod("PRD-020")], pickAccounts(clarAccounts), ["Klarifikasi"], clarTiming, true).map((p) => ({ ...p, exec: "Scheduled" as const })));

export const initialCampaigns: Campaign[] = [
  { id: "CMP-015", name: "Respons Informasi Demonstrasi Nasional", productionId: "PRD-017", contentIds: demoContent, purpose: demoPurpose, direction: "Gunakan bahasa ringkas, faktual, dan arahkan audiens ke sumber informasi terverifikasi.",
    platforms: ["X", "Instagram", "TikTok"], accounts: demoAccounts, timing: demoTiming, staggered: true,
    posts: buildPosts(demoContent.map(prod), pickAccounts(demoAccounts), demoPurpose, demoTiming, true),
    status: "Menunggu Persetujuan", approval: "Menunggu", submittedBy: "Tim Digital", submittedAt: "10 menit lalu", submittedDay: "Hari ini",
    approvals: [{ at: "09:15", actor: "Tim Digital", decision: "Diajukan" }, { at: "09:35", actor: "Supervisor", decision: "Perlu Revisi", note: "Kurangi distribusi TikTok menjadi 3 akun." }, { at: "09:52", actor: "Tim Digital", decision: "Diajukan Kembali" }],
    history: [{ at: "09:52", text: "Diajukan kembali" }, { at: "09:48", text: "Rencana diperbarui" }, { at: "09:35", text: "Perlu Perubahan — “Kurangi distribusi TikTok menjadi 3 akun.”" }, { at: "09:15", text: "Diajukan untuk Persetujuan Distribusi" }, { at: "09:08", text: "18 Paket Publikasi disiapkan oleh sistem" }, { at: "09:02", text: "12 akun target dipilih" }, { at: "08:51", text: "3 approved asset dipilih" }, { at: "08:40", text: "Distribusi dibuat" }] },
  { id: "CMP-014", name: "Klarifikasi Informasi Publik", productionId: "PRD-020", contentIds: ["PRD-020"], purpose: ["Klarifikasi"], direction: "",
    platforms: ["Instagram", "TikTok"], accounts: clarAccounts, timing: clarTiming, staggered: true, posts: clarPosts,
    status: "Sedang Berjalan", approval: "Disetujui", submittedBy: "Tim Digital", submittedAt: "Kemarin", submittedDay: "Kemarin",
    approvals: [{ at: "08:30", actor: "Tim Digital", decision: "Diajukan" }, { at: "09:10", actor: "Supervisor", decision: "Disetujui" }],
    history: [{ at: "09:20", text: "Eksekusi dimulai" }, { at: "09:10", text: "Distribusi Disetujui oleh Supervisor" }, { at: "08:30", text: "Diajukan untuk Persetujuan Distribusi" }, { at: "08:22", text: "6 Paket Publikasi disiapkan oleh sistem" }, { at: "08:10", text: "Distribusi dibuat" }] },
];
