import { Link, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Check, ChevronRight, ExternalLink, Filter, RotateCcw, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DetailRecord, SituationEntry } from "./data";
import { useSituations } from "./context";

export type ActiveFilter = { type: string; value: string };

export function SituationNav({ slug }: { slug?: string }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const { findings, topics } = useSituations();
  const activeSlug = slug ?? params.slug;
  if (!activeSlug) return null;
  const situations = [...topics, ...findings].filter((item, index, items) => items.findIndex((candidate) => candidate.slug === item.slug) === index);
  const activeSituation = situations.find((item) => item.slug === activeSlug);
  const section = pathname.endsWith("/eksplorasi") ? "Eksplorasi" : pathname.endsWith("/risiko-prediksi") ? "Risiko & Prediksi" : "Ringkasan";
  const links = [
    { to: "/situasi/$slug", label: "Ringkasan" },
    { to: "/situasi/$slug/eksplorasi", label: "Eksplorasi" },
    { to: "/situasi/$slug/risiko-prediksi", label: "Risiko & Prediksi" },
  ] as const;
  return <div className="mb-6 space-y-4">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      <Link to="/situasi" className="transition-colors hover:text-foreground">Situasi</Link><ChevronRight className="size-3" />
      <Link to="/situasi/$slug" params={{ slug: activeSlug }} className="transition-colors hover:text-foreground">{activeSituation?.name ?? activeSlug}</Link><ChevronRight className="size-3" />
      <span className="text-foreground">{section}</span>
    </nav>
    <div className="flex flex-col gap-3 border-y border-border py-3 sm:flex-row sm:items-center sm:justify-between">
      <Button asChild variant="ghost" size="sm" className="self-start text-muted-foreground"><Link to="/situasi"><ArrowLeft />Semua Situasi</Link></Button>
      <div className="flex items-center gap-2"><span className="shrink-0 text-xs text-muted-foreground">Situasi:</span><Select value={activeSlug} onValueChange={(nextSlug) => navigate({ to: pathname.endsWith("/eksplorasi") ? "/situasi/$slug/eksplorasi" : pathname.endsWith("/risiko-prediksi") ? "/situasi/$slug/risiko-prediksi" : "/situasi/$slug", params: { slug: nextSlug } })}><SelectTrigger aria-label="Pilih situasi" className="w-full min-w-0 sm:w-[280px]"><SelectValue /></SelectTrigger><SelectContent>{situations.map((item) => <SelectItem key={item.slug} value={item.slug}>{item.name}</SelectItem>)}</SelectContent></Select></div>
    </div>
    <nav aria-label="Navigasi Situasi" className="flex w-full gap-1 overflow-x-auto border-b border-border">
      {links.map((link) => <Button key={link.to} asChild variant="ghost" className={cn("h-11 shrink-0 rounded-none border-b-2 border-transparent px-3 text-xs text-muted-foreground", pathname === link.to.replace("$slug", activeSlug) && "border-brand text-foreground")}><Link to={link.to} params={{ slug: activeSlug }}>{link.label}</Link></Button>)}
    </nav>
  </div>;
}

export function SituationMeta({ item }: { item: SituationEntry }) {
  const isFinding = item.source === "Temuan Sistem";
  const details = isFinding
    ? [["Pertama terdeteksi", item.since], ["Alasan ditemukan", item.detectedReason], ["Status warning", item.warningStatus], ["Indikator pemicu", item.triggers?.join(" · ")]]
    : [["Dibuat oleh", item.createdBy], ["Dipantau sejak", item.since], ["Platform", item.platforms.join(", ")], ["Cakupan wilayah", item.regionScope], ["Keyword", item.keywords.join(", ") || "—"]];
  return <section className="mb-5 rounded-lg border border-border bg-card p-4"><div className="mb-4 flex flex-wrap items-center gap-2"><span className="rounded-sm bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground">Sumber: {item.source}</span>{item.risk && <RiskLabel value={item.risk} />}<span className="rounded-sm bg-secondary px-2 py-1 text-[10px] font-semibold text-secondary-foreground">{item.status}</span></div><dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{details.map(([label, value]) => <div key={label}><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className="mt-1 text-xs font-medium leading-5">{value ?? "—"}</dd></div>)}</dl></section>;
}

export function FilterBar({ onAdvanced }: { onAdvanced?: () => void }) {
  return <div className="flex flex-wrap gap-2">
    <Select defaultValue="7"><SelectTrigger aria-label="Periode" className="w-[158px]"><CalendarDays className="size-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">24 Jam Terakhir</SelectItem><SelectItem value="7">7 Hari Terakhir</SelectItem><SelectItem value="30">30 Hari Terakhir</SelectItem></SelectContent></Select>
    <Select defaultValue="all"><SelectTrigger aria-label="Platform" className="w-[152px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua Platform</SelectItem><SelectItem value="x">X</SelectItem><SelectItem value="tiktok">TikTok</SelectItem><SelectItem value="media">Media Online</SelectItem></SelectContent></Select>
    <Select defaultValue="all"><SelectTrigger aria-label="Wilayah" className="w-[148px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua Wilayah</SelectItem><SelectItem value="jakarta">Jakarta</SelectItem><SelectItem value="bandung">Bandung</SelectItem><SelectItem value="nasional">Nasional</SelectItem></SelectContent></Select>
    <Button variant="outline" onClick={onAdvanced}><Filter />Filter Lainnya</Button>
  </div>;
}

export function ActiveFilters({ filters, remove, reset }: { filters: ActiveFilter[]; remove: (filter: ActiveFilter) => void; reset: () => void }) {
  if (!filters.length) return null;
  return <div aria-label="Filter aktif" className="mb-5 flex flex-wrap items-center gap-2">
    <span className="text-xs text-muted-foreground">Filter aktif</span>
    {filters.map((filter) => <Button key={`${filter.type}-${filter.value}`} variant="secondary" size="sm" className="h-7 gap-1 text-xs" onClick={() => remove(filter)}>{filter.value}<X className="size-3" /></Button>)}
    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={reset}><RotateCcw className="size-3" />Reset Filter</Button>
  </div>;
}

export function MetricGrid({ items }: { items: Array<{ value: string; label: string; delta?: string; onClick?: () => void }> }) {
  return <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{items.map((item) => <Button key={item.label} variant="outline" className="h-auto min-h-24 items-start justify-start border-border bg-card p-4 text-left" onClick={item.onClick}><span><strong className="block font-display text-2xl text-foreground">{item.value}</strong><span className="mt-1 block text-xs font-normal text-muted-foreground">{item.label}</span>{item.delta && <span className="mt-2 block text-[10px] font-medium text-chart-2">{item.delta}</span>}</span></Button>)}</div>;
}

export function Panel({ title, description, action, children, className }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}><header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3"><div><h2 className="text-sm font-semibold">{title}</h2>{description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}</div>{action}</header><div className="p-4">{children}</div></section>;
}

export function SummaryBlock({ title, copy, highlights }: { title: string; copy: string; highlights: string[] }) {
  return <Panel title={title}><p className="max-w-5xl text-sm leading-6 text-muted-foreground">{copy}</p><div className="mt-4 grid gap-2 md:grid-cols-2">{highlights.map((item) => <div key={item} className="flex gap-2 text-xs leading-5"><span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"><Check className="size-2.5" /></span><span>{item}</span></div>)}</div></Panel>;
}

export function RiskLabel({ value }: { value: string }) {
  return <span className={cn("inline-flex rounded-sm px-2 py-1 text-[10px] font-semibold", value === "Tinggi" ? "bg-destructive/15 text-destructive" : value === "Sedang" ? "bg-chart-3/15 text-chart-3" : "bg-chart-2/15 text-chart-2")}>{value}</span>;
}

export function DetailTable({ rows, onSelect }: { rows: DetailRecord[]; onSelect: (row: DetailRecord) => void }) {
  return <Table><TableHeader><TableRow><TableHead>Aktor</TableHead><TableHead>Platform</TableHead><TableHead className="min-w-64">Konten</TableHead><TableHead>Narasi</TableHead><TableHead>Sentimen</TableHead><TableHead>Wilayah</TableHead><TableHead>Risiko</TableHead><TableHead>Waktu</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={`${row.actor}-${row.time}`} tabIndex={0} className="cursor-pointer" onClick={() => onSelect(row)} onKeyDown={(event) => event.key === "Enter" && onSelect(row)}><TableCell className="font-medium">{row.actor}</TableCell><TableCell>{row.platform}</TableCell><TableCell className="max-w-72 truncate text-muted-foreground">{row.content}</TableCell><TableCell>{row.narrative}</TableCell><TableCell>{row.sentiment}</TableCell><TableCell>{row.region}</TableCell><TableCell><RiskLabel value={row.risk} /></TableCell><TableCell className="whitespace-nowrap text-muted-foreground">{row.time}</TableCell></TableRow>)}</TableBody></Table>;
}

export function RecordSheet({ record, onOpenChange }: { record: DetailRecord | undefined; onOpenChange: (open: boolean) => void }) {
  return <Sheet open={Boolean(record)} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>Detail Konten</SheetTitle><SheetDescription>Rekam data terpilih dan sumber asal.</SheetDescription></SheetHeader>{record && <div className="mt-7 space-y-6"><blockquote className="border-l-2 border-primary pl-4 text-sm leading-6">“{record.content}”</blockquote><dl className="grid grid-cols-2 gap-4 text-sm">{[["Aktor",record.actor],["Platform",record.platform],["Waktu",record.time],["Narasi",record.narrative],["Sentimen",record.sentiment],["Emosi",record.emotion],["Wilayah",record.region],["Risiko",record.risk]].map(([label,value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl><Button variant="outline" className="w-full">Lihat Sumber<ExternalLink /></Button></div>}</SheetContent></Sheet>;
}
/* ===================== REVISI 1 — Analisis Pola Manipulasi Informasi ===================== */
import type { AccountProfile, EwsLevel, ManipulationContentRow, ManipulationPattern } from "./data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TrendBadge({ value }: { value: "Meningkat" | "Stabil" | "Menurun" }) {
  return <span className={cn("inline-flex rounded-sm px-2 py-1 text-[10px] font-semibold", value === "Meningkat" ? "bg-destructive/15 text-destructive" : value === "Menurun" ? "bg-chart-2/15 text-chart-2" : "bg-secondary text-secondary-foreground")}>{value}</span>;
}

export function ManipulationPatternPanel({ patterns, onSelect }: { patterns: ManipulationPattern[]; onSelect: (pattern: ManipulationPattern) => void }) {
  return <Panel title="Analisis Pola Manipulasi Informasi" description="Sistem mendeteksi indikasi pola komunikasi dalam pemberitaan dan percakapan media sosial. Label menunjukkan indikasi pola, bukan tuduhan niat pelaku.">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {patterns.map((pattern) => <Button key={pattern.id} variant="outline" className="h-auto min-h-36 flex-col items-start justify-start gap-2 p-4 text-left" onClick={() => onSelect(pattern)}>
        <span className="w-full"><span className="block text-xs font-semibold leading-5">{pattern.name}</span><span className="mt-2 block font-display text-2xl text-foreground">{pattern.count}</span></span>
        <TrendBadge value={pattern.trend} />
        <span className="block text-[10px] font-normal leading-4 text-muted-foreground">Platform dominan: {pattern.dominantPlatform}</span>
        <span className="block text-[10px] font-normal leading-4 text-muted-foreground">Narasi terkait: {pattern.relatedNarrative}</span>
      </Button>)}
    </div>
  </Panel>;
}

export function ManipulationContentSheet({ pattern, rows, onOpenChange }: { pattern: ManipulationPattern | undefined; rows: ManipulationContentRow[]; onOpenChange: (open: boolean) => void }) {
  return <Sheet open={Boolean(pattern)} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
    <SheetHeader><SheetTitle>Indikasi Pola: {pattern?.name}</SheetTitle><SheetDescription>Konten yang mendasari indikasi pola ini. Kemiripan atau pengulangan konten tidak menyimpulkan niat pelaku.</SheetDescription></SheetHeader>
    {pattern && <div className="mt-6 space-y-4">
      <p className="text-xs leading-5 text-muted-foreground">{pattern.description}</p>
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-xs"><strong className="block text-[10px] uppercase text-muted-foreground">Contoh konten</strong><p className="mt-1">{pattern.example}</p></div>
      <Table><TableHeader><TableRow><TableHead className="min-w-56">Konten / Ringkasan</TableHead><TableHead>Akun / Media</TableHead><TableHead>Platform</TableHead><TableHead>Waktu</TableHead><TableHead className="min-w-48">Alasan Terdeteksi</TableHead><TableHead>Sumber</TableHead></TableRow></TableHeader>
        <TableBody>{rows.map((row) => <TableRow key={row.sourceUrl}><TableCell className="max-w-64 text-xs leading-5">{row.content}</TableCell><TableCell>{row.actor}</TableCell><TableCell>{row.platform}</TableCell><TableCell className="whitespace-nowrap text-muted-foreground">{row.time}</TableCell><TableCell className="max-w-56 text-xs text-muted-foreground">{row.reason}</TableCell><TableCell><a href={row.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Lihat<ExternalLink className="size-3" /></a></TableCell></TableRow>)}</TableBody>
      </Table>
    </div>}
  </SheetContent></Sheet>;
}

/* ===================== REVISI 2 — Account Deep Dive ===================== */
export function AccountDetailSheet({ account, onOpenChange }: { account: AccountProfile | undefined; onOpenChange: (open: boolean) => void }) {
  return <Sheet open={Boolean(account)} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
    <SheetHeader><SheetTitle>Detail Akun — {account?.username}</SheetTitle><SheetDescription>Pendalaman aktivitas akun yang bisa ditelusuri ke posting sumber.</SheetDescription></SheetHeader>
    {account && <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/10 p-4 text-xs sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Platform</dt><dd className="mt-1 font-medium">{account.platform}</dd></div>
        <div><dt className="text-muted-foreground">Status Akun</dt><dd className="mt-1 font-medium">{account.status}</dd></div>
        <div><dt className="text-muted-foreground">Periode Analisis</dt><dd className="mt-1 font-medium">{account.periodAnalysis}</dd></div>
        <div><dt className="text-muted-foreground">Pertama Terdeteksi</dt><dd className="mt-1 font-medium">{account.firstDetected}</dd></div>
        <div className="col-span-2 sm:col-span-2"><dt className="text-muted-foreground">Tautan Profil Sumber</dt><dd className="mt-1"><a href={account.profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">{account.profileUrl}<ExternalLink className="size-3" /></a></dd></div>
      </div>
      <Tabs defaultValue="ringkasan">
        <TabsList className="h-10 w-full justify-start overflow-x-auto bg-card">
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
          <TabsTrigger value="unggahan">Riwayat Unggahan</TabsTrigger>
          <TabsTrigger value="relasi">Pola Interaksi & Relasi</TabsTrigger>
          <TabsTrigger value="perilaku">Perubahan Perilaku</TabsTrigger>
        </TabsList>
        <TabsContent value="ringkasan" className="space-y-4 pt-4">
          <MetricGrid items={[{ value: String(account.postsMonitored), label: "Posting Terpantau" }, { value: account.interactionsMonitored.toLocaleString("id-ID"), label: "Interaksi Terpantau" }, { value: String(account.mentions), label: "Mention" }, { value: account.dominantTopic, label: "Topik Dominan" }]} />
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-5"><strong className="block text-[10px] uppercase text-primary">AI Insight</strong><p className="mt-1">{account.aiInsight}</p></div>
          <p className="text-xs text-muted-foreground">{account.activityChange}</p>
        </TabsContent>
        <TabsContent value="unggahan" className="pt-4">
          <Table><TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead className="min-w-56">Isi / Ringkasan</TableHead><TableHead>Topik</TableHead><TableHead>Interaksi</TableHead><TableHead>Sumber</TableHead></TableRow></TableHeader>
            <TableBody>{account.uploads.map((row) => <TableRow key={row.source}><TableCell className="whitespace-nowrap">{row.date}</TableCell><TableCell className="max-w-72 text-xs leading-5">{row.content}</TableCell><TableCell>{row.topic}</TableCell><TableCell>{row.interactions.toLocaleString("id-ID")}</TableCell><TableCell><a href={row.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Lihat<ExternalLink className="size-3" /></a></TableCell></TableRow>)}</TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="relasi" className="space-y-4 pt-4">
          <div className="relative h-56 overflow-hidden rounded-md border border-border bg-muted/10">
            <svg className="absolute inset-0 size-full" aria-hidden="true">{account.relations.map((_, index) => <line key={index} x1="50%" y1="50%" x2={`${20 + index * 25}%`} y2={index % 2 === 0 ? "20%" : "80%"} stroke="var(--color-border)" />)}</svg>
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-card px-3 py-1.5 text-[10px] font-semibold">{account.username}</span>
            {account.relations.map((relation, index) => <span key={relation.name} className="absolute rounded-full border border-border bg-card px-2 py-1 text-[9px]" style={{ left: `${12 + index * 25}%`, top: index % 2 === 0 ? "14%" : "78%" }}>{relation.name}</span>)}
          </div>
          <Table><TableHeader><TableRow><TableHead>Akun</TableHead><TableHead>Jumlah Interaksi</TableHead><TableHead>Hubungan Teramati</TableHead></TableRow></TableHeader>
            <TableBody>{account.relations.map((relation) => <TableRow key={relation.name}><TableCell className="font-medium">{relation.name}</TableCell><TableCell>{relation.interactions.toLocaleString("id-ID")}</TableCell><TableCell>{relation.relation}</TableCell></TableRow>)}</TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="perilaku" className="space-y-4 pt-4">
          <Table><TableHeader><TableRow><TableHead>Indikator</TableHead><TableHead>Sebelum</TableHead><TableHead>Sekarang</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell className="font-medium">Posting</TableCell><TableCell>{account.behaviorChange.postsBefore}</TableCell><TableCell>{account.behaviorChange.postsNow}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">Frekuensi Posting</TableCell><TableCell>{account.behaviorChange.frequencyBefore}</TableCell><TableCell>{account.behaviorChange.frequencyNow}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">Interaksi Terpantau</TableCell><TableCell>{account.behaviorChange.interactionsBefore.toLocaleString("id-ID")}</TableCell><TableCell>{account.behaviorChange.interactionsNow.toLocaleString("id-ID")}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">Mention Terkait Isu</TableCell><TableCell>{account.behaviorChange.mentionsBefore.toLocaleString("id-ID")}</TableCell><TableCell>{account.behaviorChange.mentionsNow.toLocaleString("id-ID")}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">Topik Paling Sering Dibahas</TableCell><TableCell>{account.behaviorChange.topicBefore}</TableCell><TableCell>{account.behaviorChange.topicNow}</TableCell></TableRow>
            </TableBody>
          </Table>
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-5"><strong className="block text-[10px] uppercase text-primary">AI Insight</strong><p className="mt-1">{account.aiInsight}</p></div>
        </TabsContent>
      </Tabs>
    </div>}
  </SheetContent></Sheet>;
}

/* ===================== REVISI 4 — EWS Bertingkat ===================== */
export function EwsLevelBadge({ level }: { level: EwsLevel }) {
  const styles: Record<EwsLevel, string> = { Rendah: "bg-chart-2/15 text-chart-2", Sedang: "bg-chart-3/15 text-chart-3", Tinggi: "bg-destructive/15 text-destructive", Kritis: "bg-destructive text-destructive-foreground" };
  return <span className={cn("inline-flex rounded-sm px-2 py-1 text-[10px] font-semibold", styles[level])}>{level}</span>;
}
