import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, RadioTower } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActiveFilters, FilterBar, MetricGrid, Panel, RiskLabel, SituationMeta, SituationNav, SummaryBlock, type ActiveFilter } from "@/features/situasi/components";
import { useSituations } from "@/features/situasi/context";
import type { SituationRiskProfile } from "@/features/situasi/data";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/situasi/$slug/risiko-prediksi")({
  head: ({ params }) => ({ meta: [
    { title: `Risiko & Prediksi ${params.slug.replaceAll("-", " ")} — SINTESA` },
    { name: "description", content: "Tingkat risiko, faktor pendorong, early warning, dan proyeksi untuk situasi aktif." },
    { property: "og:title", content: "Risiko & Prediksi Situasi — SINTESA" },
    { property: "og:description", content: "Analisis risiko dan kemungkinan perkembangan situasi aktif." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RiskForecast,
});

const chartConfig = { actual: { label: "Aktual", color: "var(--color-chart-1)" }, forecast: { label: "Proyeksi", color: "var(--color-chart-3)" } };

type PersistedRiskProfile = SituationRiskProfile & {
  riskScore: number | null;
  dataQuality: "sufficient" | "insufficient";
  evidenceCount: number;
};

const emptyRiskProfile: PersistedRiskProfile = {
  activeRegions: "0", warningCount: "0", newActors: "—", negativeSentiment: "—",
  spreadPotential: "Rendah", growingRegions: "—", drivingNarrative: "Belum tersedia",
  factors: [], dimensions: [], warnings: [], riskDetails: [],
  unusualActivity: "Belum cukup observasi aktual untuk menyusun analisis risiko.",
  riskScore: null, dataQuality: "insufficient", evidenceCount: 0,
};

function RiskForecast() {
  const { slug } = Route.useParams();
  const { findings, topics } = useSituations();
  const situation = [...topics, ...findings].find((item) => item.slug === slug);
  if (!situation) throw notFound();
  const [profile, setProfile] = useState<PersistedRiskProfile>(emptyRiskProfile);
  const [trendRows, setTrendRows] = useState<any[]>([]);
  const [historyRows, setHistoryRows] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const db = supabase as any;
    async function loadRiskData() {
      const [riskResult, trendResult, ewsResult] = await Promise.all([
        db.from("situasi_risk_profiles").select("*").eq("topic_slug", slug).maybeSingle(),
        db.from("situasi_trend_points").select("*").eq("topic_slug", slug).gte("period_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)).order("period_date", { ascending: true }),
        db.from("situasi_ews").select("slug").eq("topic_slug", slug).maybeSingle(),
      ]);
      if (cancelled) return;
      const row = riskResult.data;
      if (riskResult.error) console.error("[Situasi] Gagal memuat profil risiko:", riskResult.error.message);
      setProfile(row ? {
        activeRegions: String(row.active_regions ?? 0),
        warningCount: String(row.warning_count ?? 0),
        newActors: row.new_actors ?? "—",
        negativeSentiment: row.negative_sentiment ?? "—",
        spreadPotential: row.spread_potential ?? "Rendah",
        growingRegions: row.growing_regions ?? "—",
        drivingNarrative: row.driving_narrative ?? "Belum tersedia",
        factors: Array.isArray(row.factors) ? row.factors : [],
        dimensions: Array.isArray(row.dimensions) ? row.dimensions : [],
        warnings: Array.isArray(row.warnings) ? row.warnings : [],
        riskDetails: Array.isArray(row.risk_details) ? row.risk_details : [],
        unusualActivity: row.unusual_activity ?? "Belum ada analisis aktivitas tidak biasa.",
        riskScore: row.risk_score ?? null,
        dataQuality: row.data_quality ?? "insufficient",
        evidenceCount: row.evidence_count ?? 0,
      } : emptyRiskProfile);
      setTrendRows(Array.isArray(trendResult.data) ? trendResult.data.map((item: any) => ({
        date: item.period_date,
        actual: item.actual_volume,
        forecast: item.forecast_volume,
        volume: item.volume,
      })) : []);
      if (ewsResult.data?.slug) {
        const history = await db.from("situasi_ews_history").select("*").eq("ews_slug", ewsResult.data.slug).order("event_at", { ascending: true });
        if (!cancelled) setHistoryRows(Array.isArray(history.data) ? history.data.map((item: any) => ({
          time: new Date(item.event_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }),
          event: item.event,
          status: item.status,
        })) : []);
      }
    }
    void loadRiskData().catch((error) => console.error("[Situasi] Gagal memuat data Risiko & Prediksi:", error));
    return () => { cancelled = true; };
  }, [slug, situation]);
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [range, setRange] = useState("7 Hari");
  const choose = (value: string) => setFilters([{ type: "indikator", value }]);
  const hasRiskEvidence = profile.dataQuality === "sufficient" && profile.riskScore !== null;
  const risk = hasRiskEvidence ? profile.spreadPotential : "Belum cukup data";
  const growth = hasRiskEvidence ? profile.factors.find((item) => item.factor === "Pertumbuhan observasi")?.change ?? "—" : "—";

  return <PageShell eyebrow={`Situasi / ${situation.name}`} title="Risiko & Prediksi" description="Memahami tingkat risiko, faktor pendorong, dan kemungkinan perkembangan situasi." actions={<FilterBar onAdvanced={() => setFilters([{ type: "risk", value: `Risiko ${risk}` }])} />}>
    <SituationMeta item={situation} />
    <SituationNav slug={slug} />
    <ActiveFilters filters={filters} remove={() => setFilters([])} reset={() => setFilters([])} />
    <div className="space-y-4">
      <MetricGrid items={[
        { value: hasRiskEvidence ? `${profile.riskScore}/100 · ${risk}` : "Belum cukup data", label: "Level Risiko Saat Ini", onClick: () => setFilters([{ type: "risk", value: `Risiko ${risk}` }]) },
        { value: growth, label: "Pertumbuhan Volume" },
        { value: profile.activeRegions, label: "Wilayah Aktif" },
        { value: profile.warningCount, label: "Early Warning Aktif" },
      ]} />

      <SummaryBlock title="Ringkasan Risiko" copy={hasRiskEvidence ? `${situation.name} memperoleh skor risiko ${profile.riskScore}/100 (${risk}) berdasarkan ${profile.evidenceCount} observasi aktual dalam 7 hari terakhir.` : `${situation.name} belum dapat diberi skor risiko karena bukti observasi terbaru belum memenuhi ambang minimal.`} highlights={[
        ...(hasRiskEvidence ? [`Pertumbuhan observasi ${growth}.`, `Aktivitas teramati di ${profile.activeRegions} wilayah.`, `${profile.newActors} aktor teramati.`, `Sentimen negatif ${profile.negativeSentiment}.`] : ["Skor risiko ditahan agar tidak menghasilkan peringatan palsu.", "Diperlukan minimal 5 observasi aktual dalam 7 hari terakhir.", "Data historis yang kedaluwarsa tidak dihitung sebagai kondisi terkini."]),
      ]} />

      <Panel title="Faktor Pendorong Risiko" description={`Faktor yang membentuk level risiko ${situation.name}`}>
        <Table><TableHeader><TableRow><TableHead>Faktor</TableHead><TableHead>Kondisi</TableHead><TableHead>Perubahan</TableHead></TableRow></TableHeader><TableBody>{profile.factors.map((item) => <TableRow key={item.factor} className="cursor-pointer" onClick={() => choose(item.factor)}><TableCell className="font-medium">{item.factor}</TableCell><TableCell>{item.condition}</TableCell><TableCell className="text-chart-2">{item.change}</TableCell></TableRow>)}</TableBody></Table>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Matriks Risiko" description="Risiko Dampak × Momentum Narasi">
          <div className="relative h-80 overflow-hidden rounded-md border border-border bg-muted/10">
            <div className="absolute inset-x-0 top-1/2 border-t border-border" /><div className="absolute inset-y-0 left-1/2 border-l border-border" />
            <span className="absolute left-3 top-3 text-[10px] text-muted-foreground">Dampak tinggi</span><span className="absolute bottom-3 left-3 text-[10px] text-muted-foreground">Dampak rendah</span><span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground">Momentum tinggi</span>
            {profile.dimensions.map((item, index) => <Button key={item.name} variant={item.impact === "Tinggi" ? "destructive" : "outline"} size="sm" className={cn("absolute h-auto max-w-[42%] whitespace-normal px-2 py-1 text-[10px] leading-4", ["left-[56%] top-[18%]", "left-[18%] top-[34%]", "left-[58%] top-[60%]", "left-[14%] top-[74%]"][index])} onClick={() => choose(item.name)}>{item.name}<span className="ml-1 opacity-70">{item.momentum}</span></Button>)}
          </div>
        </Panel>
        <Panel title="Proyeksi Volume" action={<div className="flex gap-1">{["7 Hari", "14 Hari", "30 Hari"].map((item) => <Button key={item} size="sm" variant={range === item ? "secondary" : "ghost"} onClick={() => setRange(item)}>{item}</Button>)}</div>}>
          <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto"><LineChart data={trendRows}><CartesianGrid vertical={false} /><XAxis dataKey="date" /><YAxis /><ChartTooltip content={<ChartTooltipContent />} /><ChartLegend content={<ChartLegendContent />} /><Line dataKey="actual" stroke="var(--color-actual)" strokeWidth={2} /><Line dataKey="forecast" stroke="var(--color-forecast)" strokeWidth={2} strokeDasharray="5 5" /></LineChart></ChartContainer>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Belum ada dasar data yang memadai untuk menyatakan proyeksi volume. Sistem hanya menampilkan proyeksi setelah tersedia data aktual dan metode peramalan yang memadai.</p>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Prediksi Penyebaran"><dl className="grid grid-cols-2 gap-4 text-xs">{[["Potensi Penyebaran", hasRiskEvidence ? profile.spreadPotential : "Belum cukup data"], ["Platform Dominan", hasRiskEvidence ? situation.platforms.slice(0, 3).join(", ") : "—"], ["Wilayah Berkembang", hasRiskEvidence ? profile.growingRegions : "—"], ["Aktor Baru", hasRiskEvidence ? profile.newActors : "—"], ["Narasi Pendorong", hasRiskEvidence ? profile.drivingNarrative : "—"]].map(([label, value]) => <div key={label} className={label === "Narasi Pendorong" ? "col-span-2" : undefined}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl></Panel>
        <Panel title="Early Warning" action={<RadioTower className="size-4 text-destructive" />}><div className="divide-y divide-border">{profile.warnings.map((warning) => <div key={warning.title} className="flex items-start gap-3 py-3"><AlertTriangle className={warning.level === "TINGGI" ? "mt-0.5 size-4 text-destructive" : "mt-0.5 size-4 text-chart-3"} /><div className="flex-1"><p className="text-xs font-medium">{warning.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{warning.meta}</p></div><span className="text-[9px] font-semibold">{warning.level}</span></div>)}</div></Panel>
      </div>

      <Panel title="Pola Aktivitas Tidak Biasa" action={<Button variant="outline" size="sm" onClick={() => choose("Indikasi aktivitas terkoordinasi")}>Lihat Detail<ArrowUpRight /></Button>}><p className="text-sm">{profile.unusualActivity}</p><p className="mt-2 text-xs text-muted-foreground">Analisis pola hanya ditampilkan jika didukung observasi yang cukup dan dapat ditelusuri.</p></Panel>

      <Panel title="Riwayat Peringatan & Penanganan" description="Linimasa peringatan dan status penanganan dari sistem hingga respons operasional">
        <ol className="space-y-4 border-l border-border pl-5">
          {historyRows.map((item) => <li key={item.time + item.event} className="relative">
            <span className="absolute -left-[26px] top-1 size-2.5 rounded-full border-2 border-card bg-primary" />
            <p className="text-xs font-medium text-muted-foreground">{item.time}</p>
            <p className="mt-0.5 text-sm">{item.event}</p>
            <span className="mt-1 inline-flex rounded-sm bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">{item.status}</span>
          </li>)}
        </ol>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/strategi">Lihat Strategi Terkait</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/dampak">Lihat Perubahan di Dampak</Link></Button>
        </div>
      </Panel>

      <Panel title="Detail Data Risiko" description={`Komponen risiko di dalam ${situation.name}`}><Table><TableHeader><TableRow><TableHead>Narasi / Indikator</TableHead><TableHead>Level</TableHead><TableHead>Volume</TableHead><TableHead>Growth</TableHead><TableHead>Aktor</TableHead><TableHead>Wilayah</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{profile.riskDetails.map((item) => <TableRow key={item.indicator} className="cursor-pointer" onClick={() => choose(item.indicator)}><TableCell className="font-medium">{item.indicator}</TableCell><TableCell><RiskLabel value={item.level} /></TableCell><TableCell>{item.volume}</TableCell><TableCell className="text-chart-2">{item.growth}</TableCell><TableCell>{item.actors}</TableCell><TableCell>{item.region}</TableCell><TableCell>{item.status}</TableCell></TableRow>)}</TableBody></Table></Panel>
    </div>
  </PageShell>;
}