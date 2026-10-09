import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Box, StatusPill, Stat, Trail } from "@/features/aksi/components";
import { useAksi, type QueueItem } from "@/features/aksi/context";
import { aksiHead } from "@/features/aksi/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aksi/persetujuan/")({
  head: aksiHead("Persetujuan", "Decision inbox untuk Persetujuan Konten dan Persetujuan Distribusi."),
  component: Persetujuan,
});

const statusLabel = (s: QueueItem["status"]) => (s === "Menunggu" ? "Menunggu Review" : s);
const kindParam = (q: QueueItem) => (q.ref.kind === "Konten" ? "konten" : q.ref.kind === "Distribusi Sosial" ? "sosial" : "news");

const TABS = ["Semua", "Konten", "Distribusi"] as const;
const uniq = (xs: string[]) => ["Semua", ...Array.from(new Set(xs))];

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return <label className="grid gap-1 text-[10px] text-muted-foreground">{label}
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground">{options.map((o) => <option key={o}>{o}</option>)}</select>
  </label>;
}

function Persetujuan() {
  const { queue, log } = useAksi();
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Semua");
  const [f, setF] = useState({ status: "Semua", jenis: "Semua", sumber: "Semua", pengaju: "Semua", tanggal: "Semua" });
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const rows = queue
    .filter((q) => (tab === "Semua" || q.group === tab) && (f.status === "Semua" || statusLabel(q.status) === f.status) && (f.jenis === "Semua" || q.subtype === f.jenis)
      && (f.sumber === "Semua" || q.source === f.sumber) && (f.pengaju === "Semua" || q.submittedBy === f.pengaju) && (f.tanggal === "Semua" || q.submittedDay === f.tanggal))
    .sort((a, b) => Number(b.status === "Menunggu") - Number(a.status === "Menunggu"));
  const open = (q: QueueItem) => navigate({ to: "/aksi/persetujuan/$kind/$id", params: { kind: kindParam(q), id: q.ref.id } });
  const waiting = queue.filter((q) => q.status === "Menunggu");

  return (
    <PageShell eyebrow="Aksi" title="Persetujuan" description="Semua yang membutuhkan keputusan Anda ada di satu tempat. Review, beri keputusan, dan kembalikan ke service asal bila perlu revisi.">
      <Trail items={["Aksi", "Persetujuan"]} />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={waiting.length} label="Menunggu Review" />
        <Stat value={waiting.filter((q) => q.group === "Konten").length} label="Persetujuan Konten" />
        <Stat value={waiting.filter((q) => q.group === "Distribusi").length} label="Persetujuan Distribusi" />
        <Stat value={queue.filter((q) => q.status === "Perlu Revisi").length} label="Perlu Revisi" />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">{TABS.map((k) => <Button key={k} size="sm" variant={tab === k ? "secondary" : "ghost"} className={cn(tab === k && "border border-border")} onClick={() => setTab(k)}>{k}</Button>)}</div>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Select label="Status" value={f.status} options={["Semua", "Menunggu Review", "Perlu Revisi", "Disetujui", "Ditolak"]} onChange={set("status")} />
        <Select label="Jenis" value={f.jenis} options={uniq(queue.map((q) => q.subtype))} onChange={set("jenis")} />
        <Select label="Service asal" value={f.sumber} options={uniq(queue.map((q) => q.source))} onChange={set("sumber")} />
        <Select label="Pengaju" value={f.pengaju} options={uniq(queue.map((q) => q.submittedBy))} onChange={set("pengaju")} />
        <Select label="Tanggal" value={f.tanggal} options={["Semua", "Hari ini", "Kemarin"]} onChange={set("tanggal")} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b border-border text-muted-foreground"><tr>{["Item", "Jenis", "Sumber", "Pengaju", "Diajukan", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{rows.map((q) => (
              <tr key={q.key} tabIndex={0} onClick={() => open(q)} onKeyDown={(e) => e.key === "Enter" && open(q)} className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/40">
                <td className="px-4 py-3"><strong>{q.title}</strong>{q.version ? <span className="block text-[10px] text-muted-foreground">Versi {q.version}</span> : null}</td>
                <td className="px-4 py-3">{q.group} · {q.subtype}</td>
                <td className="px-4 py-3 text-muted-foreground">{q.source}</td>
                <td className="px-4 py-3">{q.submittedBy}</td>
                <td className="px-4 py-3 text-muted-foreground">{q.submittedAt}</td>
                <td className="px-4 py-3"><StatusPill value={statusLabel(q.status)} /></td>
              </tr>))}
              {!rows.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Tidak ada item.</td></tr>}</tbody>
          </table>
        </div>
        <Box title="Aktivitas Terakhir"><ul className="grid gap-2.5 text-xs">{log.map((l, i) => <li key={i} className="flex gap-2"><span className="w-10 shrink-0 text-muted-foreground">{l.at}</span><span>{l.text}</span></li>)}</ul></Box>
      </div>
    </PageShell>
  );
}
