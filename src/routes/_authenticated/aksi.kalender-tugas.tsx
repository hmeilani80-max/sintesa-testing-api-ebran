import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Stat, StatusPill, Trail } from "@/features/aksi/components";
import { aksiHead } from "@/features/aksi/meta";
import { useTugas } from "@/features/aksi/tugas-context";
import {
  effectiveStatus, filterTasks, fmtDue, NOW, PEOPLE, SITUATIONS, SOURCES, STATUS_FILTERS, summarize, TEAMS, teamOf,
  type BaseStatus, type Filters, type Task, type TaskSource, type TaskStatus,
} from "@/features/aksi/tugas";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aksi/kalender-tugas")({
  validateSearch: (s: Record<string, unknown>): { task?: string | undefined } => ({ task: typeof s["task"] === "string" ? s["task"] : undefined }),
  head: aksiHead("Kalender & Tugas", "Kelola jadwal, penanggung jawab, dan perkembangan pekerjaan dari seluruh proses pelaksanaan strategi."),
  component: KalenderTugasPage,
});

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const d = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => { const x = d(s); x.setUTCDate(x.getUTCDate() + n); return iso(x); };
const weekStart = (s: string) => addDays(s, -((d(s).getUTCDay() + 6) % 7));
const label = (s: string) => `${d(s).getUTCDate()} ${MONTHS[d(s).getUTCMonth()]} ${d(s).getUTCFullYear()}`;
const sameDay = (t: Task, day: string) => t.due.startsWith(day);
const byDue = (a: Task, b: Task) => a.due.localeCompare(b.due);

function KalenderTugasPage() {
  const { tasks } = useTugas();
  const { task: openId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [filters, setFilters] = useState<Filters>({ situation: "Semua", sources: [], team: "Semua", statuses: [], q: "" });
  const [adding, setAdding] = useState(false);
  const shown = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);
  const sum = summarize(tasks);
  const open = (id?: string) => navigate({ search: { task: id }, replace: true });
  const selected = tasks.find((t) => t.id === openId);
  const toggle = <K extends "sources" | "statuses">(k: K, v: Filters[K][number]) =>
    setFilters((f) => ({ ...f, [k]: (f[k] as string[]).includes(v) ? (f[k] as string[]).filter((x) => x !== v) : [...f[k], v] }));

  return (
    <PageShell eyebrow="Aksi" title="Kalender & Tugas" description="Kelola jadwal, penanggung jawab, dan perkembangan pekerjaan dari seluruh proses pelaksanaan strategi." actions={<Button onClick={() => setAdding(true)}><Plus />Tambah Tugas</Button>}>
      <Trail items={["Aksi", "Kalender & Tugas"]} />
      <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat value={sum.active} label="Total Tugas Aktif" />
        <Stat value={sum.todo} label="Perlu Dikerjakan" />
        <Stat value={sum.progress} label="Dalam Proses" />
        <Stat value={sum.waiting} label="Menunggu Persetujuan" />
        <Stat value={<span className={sum.late ? "text-destructive" : undefined}>{sum.late}</span>} label="Terlambat" />
      </div>
      <p className="mb-5 text-[11px] text-muted-foreground">Tugas dibuat otomatis dari Produksi, Persetujuan, Distribusi Sosial, dan Distribusi News; statusnya mengikuti modul asal. Per {fmtDue(NOW)} WIB.</p>

      <section className="mb-5 space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1"><Label className="text-xs">Situasi / Strategi</Label>
            <Select value={filters.situation} onValueChange={(v) => setFilters((f) => ({ ...f, situation: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Semua">Semua</SelectItem>{SITUATIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">PIC</Label>
            <Select value={filters.team} onValueChange={(v) => setFilters((f) => ({ ...f, team: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Semua">Semua Petugas</SelectItem>{TEAMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label className="text-xs">Cari tugas</Label>
            <div className="relative"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input className="pl-8" placeholder="Judul, PIC, jenis…" value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} /></div></div>
        </div>
        <Chips label="Sumber Pekerjaan" items={SOURCES} active={filters.sources} onToggle={(v) => toggle("sources", v as TaskSource)} />
        <Chips label="Status" items={STATUS_FILTERS} active={filters.statuses} onToggle={(v) => toggle("statuses", v as TaskStatus)} />
      </section>

      <Tabs defaultValue="kalender">
        <TabsList><TabsTrigger value="kalender">Kalender</TabsTrigger><TabsTrigger value="daftar">Daftar Tugas</TabsTrigger></TabsList>
        <TabsContent value="kalender" className="mt-4"><CalendarView tasks={shown} onOpen={open} /></TabsContent>
        <TabsContent value="daftar" className="mt-4"><TaskTable tasks={shown} onOpen={open} /></TabsContent>
      </Tabs>

      <TaskDetail task={selected} onClose={() => open(undefined)} />
      <AddTask open={adding} onClose={() => setAdding(false)} onCreated={(id) => open(id)} />
    </PageShell>
  );
}

function Chips({ label: l, items, active, onToggle }: { label: string; items: string[]; active: string[]; onToggle: (v: string) => void }) {
  return <div className="flex flex-wrap items-center gap-1.5"><span className="mr-1 text-xs text-muted-foreground">{l}:</span>
    {items.map((i) => <button key={i} type="button" aria-pressed={active.includes(i)} onClick={() => onToggle(i)}
      className={cn("rounded-full border px-2.5 py-1 text-[11px] transition-colors", active.includes(i) ? "border-brand bg-brand/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>{i}</button>)}
  </div>;
}

function EventCard({ t, onOpen, compact }: { t: Task; onOpen: (id: string) => void; compact?: boolean }) {
  const st = effectiveStatus(t);
  return <button type="button" onClick={() => onOpen(t.id)} className={cn("w-full rounded-md border border-border bg-background/60 p-2 text-left hover:border-primary/50", st === "Terlambat" && "border-destructive/50")}>
    <p className="text-[10px] font-semibold text-muted-foreground">{t.due.slice(11)} · {t.source}</p>
    <p className={cn("mt-0.5 text-xs font-medium leading-snug", compact && "line-clamp-2")}>{t.title}</p>
    {!compact && <p className="mt-0.5 text-[10px] text-muted-foreground">{t.kind}</p>}
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5"><StatusPill value={st} /><span className="truncate text-[10px] text-muted-foreground">{t.pic}</span></div>
  </button>;
}

function CalendarView({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: string) => void }) {
  const [mode, setMode] = useState<"Bulan" | "Minggu" | "Hari">("Minggu");
  const [anchor, setAnchor] = useState(NOW.slice(0, 10));
  const sorted = [...tasks].sort(byDue);
  const today = NOW.slice(0, 10);
  const shift = (dir: number) => {
    if (mode === "Hari") setAnchor(addDays(anchor, dir));
    else if (mode === "Minggu") setAnchor(addDays(anchor, dir * 7));
    else { const x = d(anchor); x.setUTCMonth(x.getUTCMonth() + dir, 1); setAnchor(iso(x)); }
  };
  const ws = weekStart(anchor);
  const title = mode === "Hari" ? label(anchor) : mode === "Minggu" ? `${label(ws)} – ${label(addDays(ws, 6))}` : `${MONTHS[d(anchor).getUTCMonth()]} ${d(anchor).getUTCFullYear()}`;

  return <section className="rounded-lg border border-border bg-card p-4">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Sebelumnya" onClick={() => shift(-1)}><ChevronLeft /></Button>
        <Button variant="outline" size="icon" aria-label="Berikutnya" onClick={() => shift(1)}><ChevronRight /></Button>
        <Button variant="ghost" size="sm" onClick={() => setAnchor(today)}>Hari ini</Button>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="flex rounded-md border border-border p-0.5">
        {(["Bulan", "Minggu", "Hari"] as const).map((m) => <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m}
          className={cn("rounded px-3 py-1 text-xs", mode === m ? "bg-secondary text-foreground shadow-[inset_0_-2px_0_var(--color-brand)]" : "text-muted-foreground")}>{m}</button>)}
      </div>
    </div>

    {mode === "Minggu" && <div className="grid gap-2 md:grid-cols-7">
      {Array.from({ length: 7 }, (_, i) => addDays(ws, i)).map((day, i) => {
        const items = sorted.filter((t) => sameDay(t, day));
        return <div key={day} className={cn("min-h-40 rounded-md border border-border p-2", day === today && "border-primary/50 bg-primary/5")}>
          <p className="mb-2 text-xs font-semibold">{DAYS[i]} <span className="text-muted-foreground">{d(day).getUTCDate()}</span></p>
          <div className="space-y-1.5">{items.map((t) => <EventCard key={t.id} t={t} onOpen={onOpen} compact />)}
            {!items.length && <p className="text-[10px] text-muted-foreground">—</p>}</div>
        </div>;
      })}
    </div>}

    {mode === "Hari" && <div className="space-y-2">
      {sorted.filter((t) => sameDay(t, anchor)).map((t) => <div key={t.id} className="grid grid-cols-[3.5rem_1fr] gap-3"><span className="pt-2 text-xs font-semibold text-muted-foreground">{t.due.slice(11)}</span><EventCard t={t} onOpen={onOpen} /></div>)}
      {!sorted.some((t) => sameDay(t, anchor)) && <p className="py-6 text-center text-xs text-muted-foreground">Tidak ada pekerjaan terjadwal pada hari ini.</p>}
    </div>}

    {mode === "Bulan" && (() => {
      const first = `${anchor.slice(0, 7)}-01`; const start = weekStart(first);
      return <div className="grid grid-cols-7 gap-1">
        {DAYS.map((x) => <p key={x} className="px-1 text-[10px] font-semibold text-muted-foreground">{x}</p>)}
        {Array.from({ length: 42 }, (_, i) => addDays(start, i)).map((day) => {
          const items = sorted.filter((t) => sameDay(t, day)); const inMonth = day.slice(0, 7) === anchor.slice(0, 7);
          return <div key={day} className={cn("min-h-24 rounded border border-border p-1", !inMonth && "opacity-40", day === today && "border-primary/50")}>
            <button type="button" className="text-[10px] font-semibold hover:underline" onClick={() => { setAnchor(day); setMode("Hari"); }}>{d(day).getUTCDate()}</button>
            {items.slice(0, 3).map((t) => <button key={t.id} type="button" onClick={() => onOpen(t.id)} className={cn("mt-0.5 block w-full truncate rounded bg-secondary px-1 text-left text-[10px] hover:bg-accent", effectiveStatus(t) === "Terlambat" && "text-destructive")}>{t.due.slice(11)} {t.title}</button>)}
            {items.length > 3 && <button type="button" className="mt-0.5 text-[10px] text-muted-foreground hover:underline" onClick={() => { setAnchor(day); setMode("Hari"); }}>+{items.length - 3} lainnya</button>}
          </div>;
        })}
      </div>;
    })()}
  </section>;
}

function TaskTable({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: string) => void }) {
  const [asc, setAsc] = useState(true);
  const rows = [...tasks].sort((a, b) => (asc ? byDue(a, b) : byDue(b, a)));
  return <div className="overflow-x-auto rounded-lg border border-border bg-card">
    <table className="w-full text-sm">
      <thead className="border-b border-border text-left text-xs text-muted-foreground"><tr>
        <th className="p-3">Tugas</th><th className="p-3">Sumber</th><th className="p-3">PIC</th>
        <th className="p-3"><button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setAsc(!asc)}>Tenggat <ArrowUpDown className="size-3" /></button></th>
        <th className="p-3">Prioritas</th><th className="p-3">Status</th></tr></thead>
      <tbody>{rows.map((t) => <tr key={t.id} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/40" onClick={() => onOpen(t.id)}>
        <td className="p-3"><p className="font-medium">{t.title}</p><p className="text-[11px] text-muted-foreground">{t.situation}</p></td>
        <td className="p-3 text-xs">{t.source}</td><td className="p-3 text-xs">{t.pic}</td>
        <td className="whitespace-nowrap p-3 text-xs">{fmtDue(t.due)}</td><td className="p-3 text-xs">{t.priority}</td>
        <td className="p-3"><StatusPill value={effectiveStatus(t)} /></td></tr>)}
        {!rows.length && <tr><td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">Tidak ada tugas yang sesuai filter.</td></tr>}
      </tbody>
    </table>
  </div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-border p-3"><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>{children}</section>;
}

function TaskDetail({ task: t, onClose }: { task?: Task | undefined; onClose: () => void }) {
  const { setPic, addNote, setManualStatus } = useTugas();
  const [note, setNote] = useState("");
  const st = t ? effectiveStatus(t) : undefined;
  return <Sheet open={!!t} onOpenChange={(o) => !o && onClose()}>
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      {t && <>
        <SheetHeader><SheetTitle className="pr-6">{t.title}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-3 px-4 pb-6">
          <dl className="grid grid-cols-2 gap-2 text-xs">
            {[["Sumber", t.source], ["Situasi", t.situation], ["Strategi", t.strategy ?? "—"], ["Jenis", t.kind], ["Tenggat", fmtDue(t.due)], ["Prioritas", t.priority]].map(([k, v]) =>
              <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          </dl>
          <Section title="A. Ringkasan Pekerjaan"><p className="text-sm">{t.description}</p></Section>
          <Section title="B. Penanggung Jawab">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={t.pic} onValueChange={(v) => { setPic(t.id, v); toast.success(`PIC diubah ke ${v}`); }}>
                <SelectTrigger className="w-56" aria-label="PIC utama"><SelectValue /></SelectTrigger>
                <SelectContent>{[...new Set([t.pic, ...PEOPLE.map((p) => p.name)])].map((p) => <SelectItem key={p} value={p}>{p}{PEOPLE.some((x) => x.name === p) ? ` — ${teamOf(p)}` : ""}</SelectItem>)}</SelectContent>
              </Select>
              {t.support.length > 0 && <span className="text-xs text-muted-foreground">Pendukung: {t.support.join(", ")}</span>}
            </div>
          </Section>
          <Section title="C. Tenggat & Status">
            <div className="flex flex-wrap items-center gap-2 text-sm"><span>{fmtDue(t.due)} WIB</span><StatusPill value={st!} />
              {t.sourceStatus && <span className="text-xs text-muted-foreground">Status di modul asal: {t.sourceStatus}</span>}</div>
            {t.source === "Manual" ? <Select value={t.base} onValueChange={(v) => setManualStatus(t.id, v as BaseStatus)}>
              <SelectTrigger className="mt-2 w-48" aria-label="Ubah status"><SelectValue /></SelectTrigger>
              <SelectContent>{(["Belum Dimulai", "Dalam Proses", "Menunggu", "Selesai"] as const).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              : <p className="mt-2 text-[11px] text-muted-foreground">Status mengikuti modul asal dan diperbarui otomatis.</p>}
          </Section>
          <Section title="D. Diskusi & Catatan">
            <div className="space-y-2">{t.notes.map((n, i) => <div key={i} className="rounded-md bg-secondary/50 p-2 text-sm">
              <p className="text-[11px] font-semibold">{n.author} — {n.at}{n.origin && <span className="ml-1 font-normal text-muted-foreground">· catatan {n.origin}</span>}</p><p>{n.text}</p></div>)}
              {!t.notes.length && <p className="text-xs text-muted-foreground">Belum ada catatan.</p>}</div>
            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; addNote(t.id, note.trim()); setNote(""); }}>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tulis catatan…" aria-label="Catatan" /><Button type="submit" variant="outline">Kirim</Button></form>
          </Section>
          <Section title="E. Riwayat Aktivitas">
            <ol className="space-y-1 text-xs">{t.activity.map((a, i) => <li key={i}><span className="text-muted-foreground">{a.at}</span> — {a.text}</li>)}
              {!t.activity.length && <li className="text-muted-foreground">Belum ada aktivitas.</li>}</ol>
          </Section>
          {t.link && <Button asChild className="w-full"><Link {...(t.link as { to: "/aksi/produksi" })}><ExternalLink />Buka Pekerjaan Asal</Link></Button>}
        </div>
      </>}
    </SheetContent>
  </Sheet>;
}

function AddTask({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { addTask } = useTugas();
  const [f, setF] = useState({ title: "", pic: "Andi", due: "2026-10-10T10:00", situation: "", note: "" });
  return <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent>
      <DialogHeader><DialogTitle>Tambah Tugas</DialogTitle></DialogHeader>
      <p className="text-xs text-muted-foreground">Hanya untuk pekerjaan di luar workflow sistem. Tugas dari Produksi, Persetujuan, dan Distribusi muncul otomatis.</p>
      <div className="space-y-3">
        <div className="space-y-1"><Label htmlFor="tt">Judul Tugas</Label><Input id="tt" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>PIC</Label><Select value={f.pic} onValueChange={(v) => setF({ ...f, pic: v })}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PEOPLE.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label htmlFor="td">Tenggat</Label><Input id="td" type="datetime-local" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></div>
        </div>
        <div className="space-y-1"><Label>Terkait Situasi/Strategi (opsional)</Label><Select value={f.situation || "none"} onValueChange={(v) => setF({ ...f, situation: v === "none" ? "" : v })}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="none">Tidak terkait</SelectItem>{SITUATIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label htmlFor="tn">Catatan (opsional)</Label><Textarea id="tn" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Batal</Button>
        <Button disabled={!f.title.trim() || !f.due} onClick={() => { const id = addTask({ ...f, title: f.title.trim() }); toast.success("Tugas ditambahkan"); setF({ ...f, title: "", note: "" }); onClose(); onCreated(id); }}>Simpan Tugas</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
