import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, BellRing, Plus, Radar, RadioTower } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EwsLevelBadge, FilterBar, MetricGrid, RiskLabel } from "@/features/situasi/components";
import { useSituations } from "@/features/situasi/context";
import { getEws, type SituationEntry } from "@/features/situasi/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/situasi/")({
  head: () => ({ meta: [
    { title: "Situasi — SINTESA" },
    { name: "description", content: "Pantau temuan sistem dan topik strategis yang sedang dipantau." },
    { property: "og:title", content: "Situasi — SINTESA" },
    { property: "og:description", content: "Temuan EWS dan topik strategis dalam satu area pemantauan." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SituationCatalogue,
});

const platforms = ["X", "Instagram", "TikTok", "Facebook", "YouTube", "Threads", "News"];

function FindingCard({ item, monitored, onMonitor }: { item: SituationEntry; monitored: boolean; onMonitor: () => void }) {
  const ews = getEws(item.slug);
  return <article className="flex h-full flex-col rounded-lg border border-border bg-card p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase text-primary">Temuan Sistem</p><h3 className="mt-2 text-base font-semibold">{item.name}</h3></div><div className="flex flex-col items-end gap-1">{item.risk && <RiskLabel value={item.risk} />}{ews && <EwsLevelBadge level={ews.level} />}</div></div>
    <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.description}</p>
    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
      <div><dt className="text-muted-foreground">Volume</dt><dd className="mt-1 font-semibold text-chart-2">{item.growth}</dd></div>
      <div><dt className="text-muted-foreground">Cakupan</dt><dd className="mt-1 font-medium">{item.regionsGrowing}</dd></div>
      <div className="col-span-2"><dt className="text-muted-foreground">Narasi dominan</dt><dd className="mt-1 font-medium">{item.dominantNarrative}</dd></div>
      <div className="col-span-2"><dt className="text-muted-foreground">Pemicu</dt><dd className="mt-1 font-medium">{item.detectedReason}</dd></div>
      {ews && <>
        <div><dt className="text-muted-foreground">Pertama terdeteksi</dt><dd className="mt-1 font-medium">{ews.firstDetected}</dd></div>
        <div><dt className="text-muted-foreground">Status penanganan</dt><dd className="mt-1 font-medium">{ews.handlingStatus}</dd></div>
        <div className="col-span-2"><dt className="text-muted-foreground">Indikator pemicu (EWS)</dt><dd className="mt-1 font-medium">{ews.triggers.join(" · ")}</dd></div>
        <div className="col-span-2"><dt className="text-muted-foreground">PIC</dt><dd className="mt-1 font-medium">{ews.pic ?? "Belum ditetapkan"}</dd></div>
      </>}
    </dl>
    <div className="mt-auto flex flex-wrap gap-2 pt-5">
      <Button asChild size="sm"><Link to="/situasi/$slug" params={{ slug: item.slug }}>Lihat Situasi<ArrowRight /></Link></Button>
      <Button size="sm" variant="outline" disabled={monitored} onClick={onMonitor}>{monitored ? "Sedang Dipantau" : "Pantau Topik Ini"}</Button>
    </div>
  </article>;
}

function TopicCard({ item }: { item: SituationEntry }) {
  const fromSystem = item.source === "Temuan Sistem";
  return <article className="flex h-full flex-col rounded-lg border border-border bg-card p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] text-muted-foreground">{fromSystem ? "Sumber: Temuan Sistem" : `Dipantau sejak ${item.since}`}</p><h3 className="mt-2 text-base font-semibold">{item.name}</h3></div><span className={cn("rounded-sm px-2 py-1 text-[10px] font-semibold", item.status === "Perlu Perhatian" ? "bg-destructive/15 text-destructive" : item.status === "Meningkat" ? "bg-chart-3/15 text-chart-3" : "bg-chart-2/15 text-chart-2")}>{item.status}</span></div>
    <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.description}</p>
    <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-border py-4 text-xs"><div><dt className="text-muted-foreground">Konten</dt><dd className="mt-1 font-semibold">{item.volume}</dd></div><div><dt className="text-muted-foreground">Aktor</dt><dd className="mt-1 font-semibold">{item.actors}</dd></div><div><dt className="text-muted-foreground">Narasi</dt><dd className="mt-1 font-semibold">{item.narratives}</dd></div></dl>
    <Button asChild variant="outline" size="sm" className="mt-5 self-start"><Link to="/situasi/$slug" params={{ slug: item.slug }}>Lihat Situasi<ArrowRight /></Link></Button>
  </article>;
}

function SituationCatalogue() {
  const { findings, topics, monitorFinding, addTopic } = useSituations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["X", "TikTok", "News"]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const keyword = String(form.get("keyword") ?? "").trim();
    if (!name || !description) return;
    addTopic({ name, description, keywords: keyword ? keyword.split(",").map((item) => item.trim()) : [], platforms: selectedPlatforms });
    setDialogOpen(false);
  }

  return <PageShell eyebrow="See" title="Situasi" description="Pantau temuan sistem dan topik strategis yang sedang dipantau." actions={<FilterBar />}>
    <div className="space-y-10">
      <section aria-labelledby="ews-title">
        <div className="mb-5 flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-destructive/10 text-destructive"><RadioTower className="size-4" /></span><div><h2 id="ews-title" className="text-lg font-semibold">EWS / Temuan Sistem</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Situasi yang terdeteksi otomatis berdasarkan lonjakan aktivitas, perubahan pola, risiko, atau indikator tidak biasa.</p></div></div>
        <MetricGrid items={[{ value: "4", label: "Temuan Aktif" }, { value: "2", label: "Risiko Tinggi" }, { value: "7", label: "Early Warning Aktif" }, { value: "3", label: "Temuan Baru 24 Jam" }]} />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{findings.map((item) => <FindingCard key={item.slug} item={item} monitored={topics.some((topic) => topic.slug === item.slug)} onMonitor={() => monitorFinding(item.slug)} />)}</div>
      </section>

      <section aria-labelledby="topics-title" className="border-t border-border pt-8">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-primary"><Radar className="size-4" /></span><div><h2 id="topics-title" className="text-lg font-semibold">Topik Pantauan</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Topik strategis yang ditentukan pengguna untuk dipantau secara berkelanjutan.</p></div></div><Button onClick={() => setDialogOpen(true)}><Plus />Buat Topik Pantauan</Button></div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{topics.map((item) => <TopicCard key={item.slug} item={item} />)}</div>
      </section>
    </div>

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Buat Topik Pantauan</DialogTitle><DialogDescription>Tentukan topik strategis yang perlu dipantau secara berkelanjutan.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="topic-name">Nama Topik</Label><Input id="topic-name" name="name" required placeholder="Contoh: Stabilitas Energi Nasional" /></div><div className="space-y-2"><Label htmlFor="topic-description">Deskripsi Singkat</Label><Textarea id="topic-description" name="description" required placeholder="Jelaskan fokus pemantauan" /></div><div className="space-y-2"><Label htmlFor="topic-keyword">Keyword / Frasa <span className="text-muted-foreground">(opsional)</span></Label><Input id="topic-keyword" name="keyword" placeholder="Pisahkan dengan koma" /></div><fieldset><legend className="mb-3 text-sm font-medium">Platform</legend><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{platforms.map((platform) => <Label key={platform} className="flex items-center gap-2 font-normal"><Checkbox checked={selectedPlatforms.includes(platform)} onCheckedChange={(checked) => setSelectedPlatforms((current) => checked ? [...current, platform] : current.filter((item) => item !== platform))} />{platform}</Label>)}</div></fieldset><DialogFooter><Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Batal</Button><Button type="submit"><BellRing />Mulai Pantau</Button></DialogFooter></form></DialogContent></Dialog>
  </PageShell>;
}