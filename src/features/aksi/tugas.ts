// Kalender & Tugas: pure rules. Tasks are DERIVED from Produksi, Persetujuan,
// Distribusi Sosial and Distribusi News objects so their status always follows the
// source object (one status per job). Only manual tasks own their status.
import type { NewsOrder, NewsStatus, ProductionItem } from "./data";
import type { Campaign } from "./sosial";

export type TaskSource = "Produksi" | "Persetujuan" | "Distribusi Sosial" | "Distribusi News" | "Manual";
export type BaseStatus = "Belum Dimulai" | "Dalam Proses" | "Menunggu" | "Perlu Tindakan" | "Selesai";
export type TaskStatus = BaseStatus | "Terlambat";
export type Priority = "Normal" | "Tinggi" | "Mendesak";
export type Team = "Pimpinan" | "Tim Editorial" | "Tim Kreatif" | "Tim Digital" | "Tim Distribusi" | "Supervisor";
export type TaskLink =
  | { to: "/aksi/produksi/$id"; params: { id: string } }
  | { to: "/aksi/persetujuan/$kind/$id"; params: { kind: string; id: string } }
  | { to: "/aksi/distribusi-sosial/$id"; params: { id: string } }
  | { to: "/aksi/distribusi-news/$id"; params: { id: string } }
  | { to: "/aksi/produksi" | "/aksi/persetujuan" | "/aksi/distribusi-sosial" | "/aksi/distribusi-news" };
export type Note = { at: string; author: string; text: string; origin?: "Persetujuan" | undefined };
export type Activity = { at: string; text: string };
export type Task = {
  id: string; title: string; source: TaskSource; kind: string; situation: string; strategy?: string | undefined;
  pic: string; support: string[]; due: string; priority: Priority; base: BaseStatus; sourceStatus?: string | undefined;
  description: string; link?: TaskLink | undefined; notes: Note[]; activity: Activity[];
};

export const PEOPLE: { name: string; team: Team }[] = [
  { name: "Dimas Pratama", team: "Pimpinan" }, { name: "Andi", team: "Tim Editorial" }, { name: "Rina", team: "Tim Kreatif" },
  { name: "Budi", team: "Tim Digital" }, { name: "Sari", team: "Tim Distribusi" }, { name: "Supervisor", team: "Supervisor" },
];
export const TEAMS: Team[] = ["Tim Editorial", "Tim Kreatif", "Tim Digital", "Tim Distribusi", "Supervisor"];
export const teamOf = (pic: string): Team => PEOPLE.find((p) => p.name === pic)?.team ?? "Tim Distribusi";
export const SITUATIONS = ["Demonstrasi Nasional", "Stabilitas Harga Pangan", "Gangguan Layanan Publik"];
export const SOURCES: TaskSource[] = ["Produksi", "Persetujuan", "Distribusi Sosial", "Distribusi News", "Manual"];
export const STATUS_FILTERS: TaskStatus[] = ["Belum Dimulai", "Dalam Proses", "Menunggu", "Perlu Tindakan", "Selesai", "Terlambat"];

/** PoC "now": 9 Oktober 2026, 09:47 WIB — keeps overdue logic deterministic. */
export const NOW = "2026-10-09T09:47";

// ---- Status mapping (brief §11) ----
export function productionStatus(p: Pick<ProductionItem, "status" | "approval">): BaseStatus {
  if (p.approval === "Disetujui") return "Selesai";
  if (p.approval === "Menunggu") return "Menunggu";
  if (p.approval === "Perlu Revisi" || p.approval === "Ditolak") return "Perlu Tindakan";
  if (p.status === "Generating") return "Dalam Proses";
  if (p.status === "Generated") return "Dalam Proses"; // selesai produksi, belum diajukan
  return "Belum Dimulai";
}
/** Review task: the approver's job ends once a decision is made; follow-up moves to the source task. */
export function reviewStatus(approval: string | null): BaseStatus {
  return approval === "Menunggu" ? "Menunggu" : "Selesai";
}
export function campaignStatus(s: Campaign["status"]): BaseStatus {
  if (s === "Draft") return "Belum Dimulai";
  if (s === "Menunggu Persetujuan") return "Menunggu";
  if (s === "Perlu Perubahan") return "Perlu Tindakan";
  if (s === "Selesai" || s === "Ditolak" || s === "Dibatalkan") return "Selesai";
  return "Dalam Proses";
}
export function orderStatus(s: NewsStatus): BaseStatus {
  if (s === "Draft Order") return "Belum Dimulai";
  if (s === "Menunggu Approval") return "Menunggu";
  if (s === "Selesai" || s === "Ditolak") return "Selesai";
  if (s === "Perlu Revisi") return "Perlu Tindakan";
  return "Dalam Proses";
}
export function workOrderStatus(s: NewsStatus): BaseStatus {
  if (s === "Dikirim" || s === "Approved" || s === "Draft Order") return "Belum Dimulai";
  if (s === "Diterima Kanal" || s === "Dalam Pengerjaan") return "Dalam Proses";
  if (s === "Tayang" || s === "Menunggu Verifikasi") return "Menunggu";
  if (s === "Perlu Revisi") return "Perlu Tindakan";
  return "Selesai";
}

export function effectiveStatus(t: Pick<Task, "base" | "due">, now = NOW): TaskStatus {
  return t.base !== "Selesai" && t.due < now ? "Terlambat" : t.base;
}

// ---- Seed scheduling for known objects (deadline, PIC, priority) ----
type Plan = { title?: string; due: string; pic?: string; priority?: Priority };
const PLAN: Record<string, Plan> = {
  "prod:PRD-021": { title: "Finalisasi Artikel Informasi Demonstrasi Nasional", due: "2026-10-09T10:00", pic: "Andi", priority: "Tinggi" },
  "rev:konten:PRD-021": { title: "Review Artikel Demonstrasi Nasional", due: "2026-10-09T11:30", priority: "Tinggi" },
  "prod:PRD-022": { title: "Video Penjelasan Demonstrasi", due: "2026-10-09T11:00", pic: "Rina" },
  "rev:konten:PRD-022": { title: "Approval Video Penjelasan", due: "2026-10-09T10:30" },
  "prod:PRD-023": { title: "Revisi Carousel Informasi Demonstrasi", due: "2026-10-08T16:00", pic: "Rina", priority: "Mendesak" },
  "rev:konten:PRD-023": { title: "Review Carousel Informasi Demonstrasi", due: "2026-10-08T09:20" },
  "prod:PRD-024": { title: "Produksi Audio Ringkasan Situasi", due: "2026-10-10T15:00", pic: "Andi" },
  "prod:PRD-018": { due: "2026-10-08T06:40", pic: "Andi" }, "rev:konten:PRD-018": { due: "2026-10-08T07:12" },
  "prod:PRD-017": { due: "2026-10-08T13:40", pic: "Rina" }, "rev:konten:PRD-017": { due: "2026-10-08T14:20" },
  "prod:PRD-019": { due: "2026-10-08T14:30", pic: "Rina" }, "rev:konten:PRD-019": { due: "2026-10-08T15:05" },
  "prod:PRD-020": { due: "2026-10-08T15:10", pic: "Rina" }, "rev:konten:PRD-020": { due: "2026-10-08T15:42" },
  "cmp:CMP-015": { title: "Siapkan Paket Publikasi Demonstrasi", due: "2026-10-09T13:00", pic: "Budi", priority: "Tinggi" },
  "rev:sosial:CMP-015": { title: "Review Distribusi Sosial Demonstrasi", due: "2026-10-09T12:30", priority: "Tinggi" },
  "cmp:CMP-014": { title: "Eksekusi Distribusi Sosial Klarifikasi", due: "2026-10-09T15:00", pic: "Budi" },
  "rev:sosial:CMP-014": { due: "2026-10-08T16:00" },
  "ord:DN-012": { title: "Order Distribusi Artikel Demonstrasi", due: "2026-10-09T14:00", pic: "Sari" },
  "rev:news:DN-012": { title: "Review Order Distribusi News", due: "2026-10-09T12:00", priority: "Tinggi" },
  "ord:DN-011": { title: "Order Publikasi Edisi Pagi", due: "2026-10-09T18:00", pic: "Sari" },
  "rev:news:DN-011": { due: "2026-10-08T07:41" },
  "wo:DN-011:Jawa Barat": { title: "Publikasi NusaKanal Jawa Barat", due: "2026-10-09T16:00" },
  "wo:DN-011:DKI Jakarta": { due: "2026-10-09T17:00" },
  "wo:DN-011:Banten": { due: "2026-10-09T17:00" },
  "ver:DN-011": { title: "Verifikasi Publikasi News Edisi Pagi", due: "2026-10-09T09:00", priority: "Tinggi" },
};
const DEFAULT_DUE = "2026-10-10T17:00";
const plan = (key: string): Plan => PLAN[key] ?? { due: DEFAULT_DUE };
const PIC_BY_TYPE: Record<string, string> = { "News Article": "Andi", "Audio / Podcast": "Andi" };
export const channelManager = (channel: string) => `Pengelola Kanal ${channel}`;

type Sources = { productions: ProductionItem[]; campaigns: Campaign[]; orders: NewsOrder[] };

/** Build the cross-module task list from the live workflow objects. */
export function deriveTasks({ productions, campaigns, orders }: Sources): Task[] {
  const out: Task[] = [];
  const titleOf = (id: string) => productions.find((p) => p.id === id)?.title ?? id;
  for (const p of productions) {
    const k = `prod:${p.id}`; const pl = plan(k);
    const approvalNotes: Note[] = p.approvals.filter((a) => a.note).map((a) => ({ at: a.at, author: a.actor, text: a.note!, origin: "Persetujuan" as const }));
    const situation = p.situationName ?? "Demonstrasi Nasional";
    // While approval is pending the job IS the review: one row, one status.
    if (p.approval !== "Menunggu") out.push({ id: k, title: pl.title ?? `Produksi ${p.title}`, source: "Produksi", kind: `Produksi ${p.type}`, situation, strategy: p.strategyTitle,
      pic: pl.pic ?? PIC_BY_TYPE[p.type] ?? "Rina", support: p.approval ? ["Supervisor"] : [], due: pl.due, priority: pl.priority ?? "Normal",
      base: productionStatus(p), sourceStatus: p.approval ? `${p.status} · ${p.approval}` : p.status,
      description: `Menyiapkan ${p.type} "${p.title}" sesuai brief${p.strategyTitle ? ` dari strategi ${p.strategyTitle}` : ""}.`,
      link: { to: "/aksi/produksi/$id", params: { id: p.id } }, notes: approvalNotes,
      activity: p.history.map((h) => ({ at: h.at, text: `${h.label} (v${h.version})` })) });
    if (p.approval) {
      const rk = `rev:konten:${p.id}`; const rp = plan(rk);
      out.push({ id: rk, title: rp.title ?? `Review ${p.title}`, source: "Persetujuan", kind: "Review Konten", situation, strategy: p.strategyTitle,
        pic: "Supervisor", support: [p.submittedBy ?? "Tim Produksi"], due: rp.due, priority: rp.priority ?? "Normal",
        base: reviewStatus(p.approval), sourceStatus: p.approval, description: `Memberi keputusan persetujuan untuk "${p.title}" versi ${p.version}.`,
        link: { to: "/aksi/persetujuan/$kind/$id", params: { kind: "konten", id: p.id } }, notes: approvalNotes,
        activity: p.approvals.map((a) => ({ at: a.at, text: `${a.decision} oleh ${a.actor}${a.version ? ` (v${a.version})` : ""}` })) });
    }
  }
  for (const c of campaigns) {
    const k = `cmp:${c.id}`; const pl = plan(k);
    if (c.status !== "Menunggu Persetujuan") out.push({ id: k, title: pl.title ?? `Distribusi Sosial ${c.name}`, source: "Distribusi Sosial", kind: "Distribusi Sosial (tingkat campaign)", situation: "Demonstrasi Nasional",
      strategy: c.name, pic: pl.pic ?? "Budi", support: [], due: pl.due, priority: pl.priority ?? "Normal", base: campaignStatus(c.status), sourceStatus: c.status,
      description: `Persiapan paket publikasi, kesiapan distribusi, dan pelaksanaan ${c.posts.length} posting. Rincian posting tersedia di modul Distribusi Sosial.`,
      link: { to: "/aksi/distribusi-sosial/$id", params: { id: c.id } }, notes: (c.approvals ?? []).filter((a) => a.note).map((a) => ({ at: a.at, author: a.actor, text: a.note!, origin: "Persetujuan" })),
      activity: c.history.map((h) => ({ at: h.at, text: h.text })) });
    if (c.approval) {
      const rk = `rev:sosial:${c.id}`; const rp = plan(rk);
      out.push({ id: rk, title: rp.title ?? `Review Distribusi ${c.name}`, source: "Persetujuan", kind: "Review Distribusi Sosial", situation: "Demonstrasi Nasional", strategy: c.name,
        pic: "Supervisor", support: ["Budi"], due: rp.due, priority: rp.priority ?? "Normal", base: reviewStatus(c.approval), sourceStatus: c.approval,
        description: `Keputusan persetujuan rencana distribusi "${c.name}".`, link: { to: "/aksi/persetujuan/$kind/$id", params: { kind: "sosial", id: c.id } },
        notes: [], activity: (c.approvals ?? []).map((a) => ({ at: a.at, text: `${a.decision} oleh ${a.actor}` })) });
    }
  }
  for (const o of orders) {
    const name = o.title ?? `Order ${o.id}`; const situation = "Demonstrasi Nasional";
    const k = `ord:${o.id}`; const pl = plan(k);
    if (o.status !== "Menunggu Approval") out.push({ id: k, title: pl.title ?? name, source: "Distribusi News", kind: "Order Distribusi News", situation, pic: pl.pic ?? "Sari", support: [], due: pl.due,
      priority: pl.priority ?? "Normal", base: orderStatus(o.status), sourceStatus: o.status,
      description: `Order "${name}" untuk ${o.channels.length} kanal NusaKanal berbasis ${titleOf(o.productionId)}.`, link: { to: "/aksi/distribusi-news/$id", params: { id: o.id } },
      notes: o.notes ? [{ at: o.submittedAt ?? "-", author: o.submittedBy ?? "Tim Media", text: o.notes }] : [], activity: (o.approvals ?? []).map((a) => ({ at: a.at, text: `${a.decision} oleh ${a.actor}` })) });
    if (o.approval) {
      const rk = `rev:news:${o.id}`; const rp = plan(rk);
      out.push({ id: rk, title: rp.title ?? `Review ${name}`, source: "Persetujuan", kind: "Review Distribusi News", situation, pic: "Supervisor", support: ["Sari"], due: rp.due,
        priority: rp.priority ?? "Normal", base: reviewStatus(o.approval), sourceStatus: o.approval, description: `Keputusan persetujuan order "${name}".`,
        link: { to: "/aksi/persetujuan/$kind/$id", params: { kind: "news", id: o.id } }, notes: [], activity: (o.approvals ?? []).map((a) => ({ at: a.at, text: `${a.decision} oleh ${a.actor}` })) });
    }
    const sent = !["Draft Order", "Menunggu Approval", "Approved", "Ditolak"].includes(o.status);
    if (!sent) continue;
    for (const ch of o.channels) {
      // Published URLs awaiting verification are tracked by the single verification task.
      if (ch.status === "Menunggu Verifikasi" || ch.status === "Tayang") continue;
      const wk = `wo:${o.id}:${ch.channel}`; const wp = plan(wk);
      out.push({ id: wk, title: wp.title ?? `Publikasi NusaKanal ${ch.channel}`, source: "Distribusi News", kind: "Work Order Kanal", situation, pic: channelManager(ch.channel), support: ["Sari"],
        due: wp.due, priority: wp.priority ?? "Normal", base: workOrderStatus(ch.status), sourceStatus: ch.status,
        description: `Work order ${name} untuk kanal ${ch.channel}.${ch.url ? ` URL tayang: ${ch.url}` : ""}`, link: { to: "/aksi/distribusi-news/$id", params: { id: o.id } }, notes: [], activity: [] });
    }
    const pending = o.channels.filter((c) => c.status === "Menunggu Verifikasi" || c.status === "Tayang").length;
    const done = o.channels.every((c) => c.status === "Selesai");
    if (pending || done) {
      const vk = `ver:${o.id}`; const vp = plan(vk);
      out.push({ id: vk, title: vp.title ?? `Verifikasi Publikasi ${name}`, source: "Distribusi News", kind: "Verifikasi Publikasi", situation, pic: "Sari", support: [], due: vp.due,
        priority: vp.priority ?? "Normal", base: done ? "Selesai" : "Belum Dimulai", sourceStatus: `${pending} URL menunggu verifikasi`,
        description: `Verifikasi ${pending} URL tayang dari pengelola kanal.`, link: { to: "/aksi/distribusi-news/$id", params: { id: o.id } }, notes: [], activity: [] });
    }
  }
  return out;
}

/** Example work from other situations so the calendar reads cross-situation (PoC data). */
const s = (id: string, title: string, source: TaskSource, kind: string, situation: string, pic: string, due: string, base: BaseStatus, priority: Priority = "Normal", link?: TaskLink): Task =>
  ({ id, title, source, kind, situation, pic, support: [], due, base, priority, link, description: `${kind} untuk situasi ${situation}.`, notes: [], activity: [{ at: "08:00", text: "Tugas dibuat" }] });
export const SCENARIO_TASKS: Task[] = [
  s("ext:HP-01", "Produksi Infografis Stabilitas Harga Pangan", "Produksi", "Produksi Infografis", "Stabilitas Harga Pangan", "Rina", "2026-10-10T09:00", "Dalam Proses", "Normal", { to: "/aksi/produksi" }),
  s("ext:HP-02", "Artikel Harga Pangan Wilayah Timur", "Produksi", "Produksi News Article", "Stabilitas Harga Pangan", "Andi", "2026-10-11T10:00", "Dalam Proses", "Normal", { to: "/aksi/produksi" }),
  s("ext:HP-03", "Verifikasi 14 URL News", "Distribusi News", "Verifikasi Publikasi", "Stabilitas Harga Pangan", "Sari", "2026-10-10T14:00", "Belum Dimulai", "Normal", { to: "/aksi/distribusi-news" }),
  s("ext:LP-01", "Review Carousel Informasi Publik", "Persetujuan", "Review Konten", "Gangguan Layanan Publik", "Supervisor", "2026-10-10T11:00", "Belum Dimulai", "Normal", { to: "/aksi/persetujuan" }),
  s("ext:LP-02", "Distribusi Sosial Informasi Layanan", "Distribusi Sosial", "Distribusi Sosial (tingkat campaign)", "Gangguan Layanan Publik", "Budi", "2026-10-12T10:00", "Belum Dimulai", "Normal", { to: "/aksi/distribusi-sosial" }),
  s("man:03", "Brief Konten Gangguan Layanan Publik", "Manual", "Tugas Manual", "Gangguan Layanan Publik", "Andi", "2026-10-12T14:00", "Belum Dimulai"),
  s("man:04", "Penyesuaian Headline Wilayah Harga Pangan", "Manual", "Tugas Manual", "Stabilitas Harga Pangan", "Andi", "2026-10-10T16:00", "Dalam Proses"),
  s("man:01", "Koordinasi Juru Bicara Harga Pangan", "Manual", "Tugas Manual", "Stabilitas Harga Pangan", "Dimas Pratama", "2026-10-08T14:00", "Selesai"),
  s("man:02", "Rekap Kendala Kanal Wilayah Timur", "Manual", "Tugas Manual", "Gangguan Layanan Publik", "Sari", "2026-10-13T15:00", "Dalam Proses"),
];

export type Summary = { active: number; todo: number; progress: number; waiting: number; late: number };
export function summarize(tasks: Pick<Task, "base" | "due">[], now = NOW): Summary {
  const st = tasks.map((t) => effectiveStatus(t, now));
  return {
    active: st.filter((x) => x !== "Selesai").length,
    todo: st.filter((x) => x === "Belum Dimulai" || x === "Perlu Tindakan").length,
    progress: st.filter((x) => x === "Dalam Proses").length,
    waiting: st.filter((x) => x === "Menunggu").length,
    late: st.filter((x) => x === "Terlambat").length,
  };
}

export type Filters = { situation: string; sources: TaskSource[]; team: string; statuses: TaskStatus[]; q: string };
export function filterTasks(tasks: Task[], f: Filters, now = NOW) {
  const q = f.q.trim().toLowerCase();
  return tasks.filter((t) => (f.situation === "Semua" || t.situation === f.situation)
    && (!f.sources.length || f.sources.includes(t.source))
    && (f.team === "Semua" || teamOf(t.pic) === f.team || (t.pic.startsWith("Pengelola Kanal") && f.team === "Tim Distribusi"))
    && (!f.statuses.length || f.statuses.includes(effectiveStatus(t, now)))
    && (!q || `${t.title} ${t.pic} ${t.kind} ${t.situation}`.toLowerCase().includes(q)));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const fmtDue = (iso: string) => { const [d, t] = iso.split("T"); const [, m, day] = d!.split("-"); return `${Number(day)} ${MONTHS[Number(m) - 1]} ${t}`; };

/** Simulated work notifications for the global bell (brief §12). */
export function taskNotifications(tasks: Task[], now = NOW) {
  const out: { id: string; text: string; title: string }[] = [];
  for (const t of tasks) {
    const st = effectiveStatus(t, now);
    if (st === "Terlambat") out.push({ id: t.id, text: t.source === "Distribusi News" ? "Pekerjaan News melewati tenggat" : "Tugas melewati tenggat", title: t.title });
    else if (st === "Menunggu" && t.source === "Persetujuan") out.push({ id: t.id, text: "Persetujuan menunggu keputusan", title: t.title });
    else if (st === "Perlu Tindakan") out.push({ id: t.id, text: "Pekerjaan membutuhkan revisi", title: t.title });
    else if (t.source === "Manual" && t.id.startsWith("man:new")) out.push({ id: t.id, text: "Anda mendapat tugas baru", title: t.title });
  }
  return out.slice(0, 6);
}
