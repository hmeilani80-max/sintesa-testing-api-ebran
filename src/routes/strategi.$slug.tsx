import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSituations } from "@/features/situasi/context";
import { Panel, RiskLabel, SummaryBlock } from "@/features/situasi/components";
import { buildBahanTanggapan, type BahanTanggapan } from "@/features/strategi/bahan";
import { BahanTanggapanPanel, StatusBadge } from "@/features/strategi/components";
import { approachPlatforms, useStrategies } from "@/features/strategi/context";
import { channelRoles, getActionPlan, getChannelApproach, getStrategyContext, insights, scenarios, sources, studyFacts, type ChannelApproach } from "@/features/strategi/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/strategi/$slug")({
  head: () => ({ meta: [
    { title: "Detail Strategi — SINTESA" },
    { name: "description", content: "Workspace keputusan: konteks, kajian, rekomendasi kanal, dan action plan." },
    { property: "og:title", content: "Detail Strategi — SINTESA" },
    { property: "og:description", content: "Menyusun rekomendasi dan rencana respons dari situasi." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: StrategyDetail,
});

function StrategyDetail() {
  const { slug } = Route.useParams();
  const { strategies, updateStrategy, sendToAction } = useStrategies();
  const { findings, topics } = useSituations();
  const navigate = useNavigate();
  const strategy = strategies.find((s) => s.slug === slug);
  const [editing, setEditing] = useState(false);
  const [objective, setObjective] = useState(strategy?.objective ?? "");
  const [tab, setTab] = useState("ringkasan");
  if (!strategy) throw notFound();
  const situation = [...topics, ...findings].find((s) => s.slug === strategy.situationSlug);
  const ctx = getStrategyContext(strategy, situation);
  const recommended = getChannelApproach(ctx.platforms);
  const approach: ChannelApproach = strategy.approach ?? recommended;
  const tasks = getActionPlan(approachPlatforms(approach, ctx.platforms));
  const bahanInput = useMemo(() => ({
    title: strategy.situationName ?? strategy.title,
    narrative: ctx.narrative,
    growth: ctx.growth,
    regions: ctx.regions,
    verifiedFacts: studyFacts.verified,
    unverifiedFacts: studyFacts.unverified,
    sources,
  }), [strategy.situationName, strategy.title, ctx.narrative, ctx.growth, ctx.regions]);
  const [bahan, setBahan] = useState<BahanTanggapan>(() => buildBahanTanggapan(bahanInput));
  // Kajian & Sumber: render seluruh kategori yang tersedia pada data (termasuk kategori baru seperti Data Internal / Laporan Lapangan jika ditambahkan ke data.ts).
  const studyFactLabels: Record<string, string> = { verified: "Fakta Terverifikasi", claims: "Klaim yang Berkembang", unverified: "Informasi Belum Terverifikasi", internal: "Data Internal / Laporan Lapangan" };
  const studyFactColors: Record<string, string> = { verified: "text-chart-2", claims: "text-chart-3", unverified: "text-muted-foreground", internal: "text-primary" };
  const studyFactCategories = Object.entries(studyFacts)
    .filter((entry): entry is [string, string[]] => Array.isArray(entry[1]))
    .map(([key, items]) => [studyFactLabels[key] ?? key, items, studyFactColors[key] ?? "text-muted-foreground"] as [string, string[], string]);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link to="/strategi" className="hover:text-foreground">Strategi</Link><ChevronRight className="size-3" /><span className="text-foreground">{strategy.situationName ?? strategy.title}</span>
      </nav>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground"><Link to="/strategi"><ArrowLeft />Semua Strategi</Link></Button>
        {strategy.situationSlug && <Button asChild variant="ghost" size="sm" className="text-muted-foreground"><Link to="/situasi/$slug" params={{ slug: strategy.situationSlug }}><ArrowLeft />Kembali ke Situasi</Link></Button>}
      </div>
      <header className="mt-4 flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase text-primary">Strategi</p>
          <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{strategy.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Sumber: {strategy.situationSlug ? <>Situasi → <Link to="/situasi/$slug" params={{ slug: strategy.situationSlug }} className="text-foreground underline-offset-2 hover:underline">{strategy.situationName}</Link></> : "Input Manual"}</span>
            <span className="flex items-center gap-1.5">Status: <StatusBadge status={strategy.status} /></span>
          </div>
        </div>
        <Button onClick={() => { sendToAction(strategy.slug); navigate({ to: "/aksi/produksi" }); }}>Lanjutkan ke Aksi<ArrowRight /></Button>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className="h-auto flex-wrap"><TabsTrigger value="ringkasan">Ringkasan</TabsTrigger><TabsTrigger value="kajian">Kajian & Sumber</TabsTrigger><TabsTrigger value="rencana">Rekomendasi & Rencana</TabsTrigger></TabsList>

        <TabsContent value="ringkasan" className="mt-5 space-y-4">
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Konteks Situasi</h2>{strategy.situationSlug && <Button asChild variant="outline" size="sm"><Link to="/situasi/$slug" params={{ slug: strategy.situationSlug }}>Lihat Data Situasi</Link></Button>}</div>
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[["Sumber", ctx.source], ["Level Risiko", ctx.risk], ["Pertumbuhan", ctx.growth], ["Platform Dominan", ctx.platforms.join(", ")], ["Wilayah Prioritas", ctx.regions], ["Sentimen", ctx.sentiment], ["Narasi Dominan", ctx.narrative], ["Aktor Baru", ctx.newActors]].map(([l, v]) => (
                <div key={l}><dt className="text-[10px] uppercase text-muted-foreground">{l}</dt><dd className="mt-1 text-sm font-medium">{l === "Level Risiko" && ["Tinggi", "Sedang", "Rendah"].includes(v ?? "") ? <RiskLabel value={v ?? ""} /> : v}</dd></div>
              ))}
            </dl>
          </section>
          <SummaryBlock title="Ringkasan Konteks" copy={ctx.summary} highlights={ctx.highlights} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Tujuan Strategi" action={<Button variant="ghost" size="sm" onClick={() => { if (editing) updateStrategy(strategy.slug, { objective }); setEditing(!editing); }}>{editing ? "Simpan" : "Edit"}</Button>}>
              {editing ? <Textarea aria-label="Tujuan strategi" value={objective} onChange={(e) => setObjective(e.target.value)} /> : <p className="text-sm leading-6">{strategy.objective}</p>}
            </Panel>
            <Panel title="Fokus Utama"><div className="grid gap-2 sm:grid-cols-2">{["Informasi Faktual", "Klarifikasi Informasi Tidak Terverifikasi", "Perluasan Jangkauan Informasi Resmi", "Penyesuaian Pesan per Kanal"].map((f) => <div key={f} className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs">{f}</div>)}</div></Panel>
          </div>
        </TabsContent>

        <TabsContent value="kajian" className="mt-5 space-y-4">
          <Panel title="Ringkasan Kajian"><p className="text-sm leading-6 text-muted-foreground">Peningkatan percakapan terutama dipicu oleh perluasan agenda aksi dan informasi situasi lapangan. Percakapan sosial berkembang lebih cepat daripada pemberitaan, sementara klarifikasi resmi belum mengimbangi laju informasi yang belum terverifikasi.</p></Panel>
          <div className="grid gap-4 lg:grid-cols-3">
            {studyFactCategories.map(([t, items, c]) => (
              <Panel key={t} title={t}><ul className="space-y-2">{items.map((i) => <li key={i} className="flex gap-2 text-xs leading-5"><span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full bg-current", c)} />{i}</li>)}</ul></Panel>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Klaim tidak dinyatakan benar atau salah tanpa sumber yang cukup.</p>
          <Panel title="Sumber Pendukung" description="Setiap pernyataan penting dapat ditelusuri ke sumbernya.">
            <Table><TableHeader><TableRow><TableHead>Pernyataan</TableHead><TableHead>Sumber</TableHead><TableHead>Platform</TableHead><TableHead>Waktu</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{sources.map((s) => <TableRow key={s.statement}><TableCell className="font-medium">{s.statement}</TableCell><TableCell>{s.source}</TableCell><TableCell>{s.platform}</TableCell><TableCell>{s.time}</TableCell><TableCell><span className={cn("text-xs", s.status === "Terverifikasi" ? "text-chart-2" : "text-chart-3")}>{s.status}</span></TableCell></TableRow>)}</TableBody></Table>
          </Panel>
          <Panel title="Insight Strategis"><div className="grid gap-3 md:grid-cols-2">{insights.map((i, n) => <div key={i.title} className="rounded-md border border-border p-3"><p className="text-xs font-semibold">{n + 1}. {i.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{i.copy}</p></div>)}</div></Panel>
        </TabsContent>

        <TabsContent value="rencana" className="mt-5 space-y-4">
          <Panel title="Alur Penurunan Rekomendasi">
            <ol className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {[["Yang terjadi", `Volume ${ctx.growth}`], ["Narasi", ctx.narrative], ["Kanal", ctx.platforms.join(", ")], ["Wilayah", ctx.regions], ["Tujuan", "Informasi terverifikasi"], ["Bentuk", approach], ["Task", `${tasks.length} task`]].map(([k, v], i, arr) => (
                <li key={k} className="flex items-center gap-1.5"><span className="rounded-md border border-border bg-secondary/40 px-2 py-1"><span className="text-muted-foreground">{k}: </span>{v}</span>{i < arr.length - 1 && <ChevronRight className="size-3 text-muted-foreground" />}</li>
              ))}
            </ol>
          </Panel>
          <Panel title="Arah Strategi" action={<span className="rounded-sm bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary">{approach}</span>}>
            <p className="text-sm leading-6">Memperkuat informasi faktual mengenai kondisi aktual serta mempercepat distribusi klarifikasi terhadap informasi yang belum terverifikasi.</p>
          </Panel>
          <Panel title="Pendekatan Kanal">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from(new Set([...ctx.platforms, ...(approach === "Integrated" ? ["Instagram"] : [])])).filter((p) => channelRoles[p]).map((p) => (
                <div key={p} className="rounded-md border border-border p-3"><p className="text-sm font-semibold">{p}</p><p className="mt-0.5 text-[11px] text-primary">{channelRoles[p]?.role}</p><ul className="mt-2 space-y-1 text-xs text-muted-foreground">{(channelRoles[p]?.items ?? []).map((i) => <li key={i}>· {i}</li>)}</ul></div>
              ))}
            </div>
          </Panel>
          <Panel title="Simulasi Skenario" description="Perbandingan sederhana pendekatan komunikasi. Anda tetap dapat memilih pendekatan lain.">
            <div className="grid gap-3 lg:grid-cols-3">
              {scenarios.map((s) => (
                <button key={s.key} type="button" aria-pressed={approach === s.key} onClick={() => updateStrategy(strategy.slug, { approach: s.key })} className={cn("rounded-md border p-4 text-left transition-colors", approach === s.key ? "border-brand bg-brand/10" : "border-border hover:border-muted-foreground")}>
                  <p className="text-sm font-semibold">{s.label}</p>
                  {s.key === recommended && <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-primary"><Sparkles className="size-3" />Direkomendasikan berdasarkan Situasi</p>}
                  <dl className="mt-3 space-y-1.5 text-xs">{[["Fokus", s.focus], ["Kekuatan", s.strength], ["Estimasi kecepatan", s.speed], ["Potensi jangkauan", s.reach]].map(([l, v]) => <div key={l} className="flex justify-between gap-3"><dt className="text-muted-foreground">{l}</dt><dd className="text-right">{v}</dd></div>)}</dl>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Rekomendasi">
            <p className="text-sm leading-6">Berdasarkan pola penyebaran saat ini, pendekatan <strong>{approach}</strong> {approach === recommended ? "direkomendasikan" : "dipilih"}. News digunakan sebagai sumber informasi lengkap dan terverifikasi, sementara kanal sosial memperluas distribusi dengan pesan yang konsisten.</p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[["Target Utama", strategy.audience || "Publik umum di wilayah prioritas"], ["Wilayah", ctx.regions], ["Kanal Prioritas", ctx.platforms.join(", ")], ["Kanal Pendukung", "Instagram, Threads"], ["Pesan Utama", "Informasi faktual dan perkembangan situasi terkini"]].map(([l, v]) => <div key={l}><dt className="text-[10px] uppercase text-muted-foreground">{l}</dt><dd className="mt-1 text-xs font-medium">{v}</dd></div>)}</dl>
          </Panel>
          <Panel title="Action Plan" description="Task diturunkan dari data situasi dan pendekatan terpilih.">
            <div className="grid gap-3 md:grid-cols-2">
              {tasks.map((t) => (
                <div key={t.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">Task {t.id} — {t.title}</p><RiskLabel value={t.priority} /></div>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">{[["Jenis", t.type], ["Platform", t.platforms.join(", ")], ["Jumlah", t.count], ["Fokus", t.focus]].map(([l, v]) => <div key={l}><dt className="text-muted-foreground">{l}</dt><dd>{v}</dd></div>)}</dl>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end"><Button onClick={() => { sendToAction(strategy.slug); navigate({ to: "/aksi/produksi" }); }}>Lanjutkan ke Aksi<ArrowRight /></Button></div>
          </Panel>

          <BahanTanggapanPanel
            bahan={bahan}
            onChange={setBahan}
            onRegenerate={() => { setBahan(buildBahanTanggapan(bahanInput)); toast.success("Paket Bahan Tanggapan dibuat ulang (simulasi)"); }}
            onLihatSumber={() => setTab("kajian")}
            onTeruskan={() => { sendToAction(strategy.slug); navigate({ to: "/aksi/produksi" }); }}
            onSimpanArsip={() => toast.success("Tersimpan ke Arsip (simulasi)")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
