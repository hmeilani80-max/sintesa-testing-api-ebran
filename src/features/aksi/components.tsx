import { ChevronRight } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const GOOD = ["Siap", "Ready", "Dijadwalkan", "Generated", "Approved", "Disetujui", "Published", "Selesai", "Siap Eksekusi", "Tayang", "Scheduled"];
const WARN = ["Perlu Perubahan", "Busy", "Diedit", "Perlu Revisi", "Perlu Tindakan", "Menunggu Verifikasi", "Menunggu Approval Distribusi"];
const BAD = ["Unavailable", "Ditolak", "Failed", "Belum dapat didistribusikan", "Terlambat"];
const ACTIVE = ["Menunggu Persetujuan", "Sedang Berjalan", "Generating", "Menunggu", "Menunggu Review", "Menunggu Approval", "Dikirim", "Diterima Kanal", "Dalam Pengerjaan", "Publishing", "Dalam Produksi", "Dalam Proses"];

export function StatusPill({ value }: { value: string }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-sm px-2 py-1 text-[10px] font-semibold",
    GOOD.includes(value) ? "bg-chart-2/15 text-chart-2" : WARN.includes(value) ? "bg-chart-3/15 text-chart-3" : BAD.includes(value) ? "bg-destructive/15 text-destructive" : ACTIVE.includes(value) ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground")}>{value}</span>;
}

/** Breadcrumb trail: pass Links or plain text; the last item is the current page. */
export function Trail({ items }: { items: ReactNode[] }) {
  return <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
    {items.map((item, i) => <Fragment key={i}>{i > 0 && <ChevronRight className="size-3.5" />}<span className={cn(i === items.length - 1 && "font-medium text-foreground", "[&_a:hover]:text-foreground [&_a:hover]:underline")}>{item}</span></Fragment>)}
  </nav>;
}

/** Lineage: where this item came from, each step linking back to its source. */
export function Lineage({ steps }: { steps: { label: string; value: ReactNode }[] }) {
  return <section className="rounded-lg border border-border bg-card p-4">
    <h2 className="mb-3 text-[11px] font-semibold uppercase text-muted-foreground">Jejak Sumber</h2>
    <ol className="flex flex-wrap items-stretch gap-2">
      {steps.map((s, i) => <Fragment key={s.label}>{i > 0 && <ChevronRight className="size-4 self-center text-muted-foreground" />}<li className="rounded-md border border-border px-3 py-2"><span className="block text-[10px] text-muted-foreground">{s.label}</span><span className="text-xs font-medium [&_a]:text-primary [&_a:hover]:underline">{s.value}</span></li></Fragment>)}
    </ol>
  </section>;
}

export function Flow({ steps, current }: { steps: string[]; current: number }) {
  return <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
    {steps.map((s, i) => <li key={s} className={cn("bg-card px-3 py-2.5 text-[11px]", i < current ? "text-foreground shadow-[inset_0_-2px_0_var(--color-brand)]" : i === current ? "bg-accent font-semibold text-foreground shadow-[inset_0_-2px_0_var(--color-brand)]" : "text-muted-foreground")}><span className="block text-[10px] opacity-70">0{i + 1}</span>{s}</li>)}
  </ol>;
}

export function Box({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={cn("rounded-lg border border-border bg-card", className)}>
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3"><h2 className="text-sm font-semibold">{title}</h2>{action}</header>
    <div className="p-4">{children}</div>
  </section>;
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return <div className="rounded-lg border border-border bg-card p-4"><strong className="font-display text-2xl">{value}</strong><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>;
}
