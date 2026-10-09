import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ArrowUpRight, RadioTower } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActiveFilters, FilterBar, MetricGrid, Panel, RiskLabel, SituationMeta, SituationNav, SummaryBlock, type ActiveFilter } from "@/features/situasi/components";
import { useSituations } from "@/features/situasi/context";
import { getRiskProfile, trend, warningHistory } from "@/features/situasi/data";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/situasi/$slug/risiko-prediksi")({
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

function RiskForecast() {
  const { slug } = Route.useParams();
  const { findings, topics } = useSituations();
  const situation = [...topics, ...findings].find((item) => item.slug === slug);
  if (!situation) throw notFound();
  const profile = getRiskProfile(situation);
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [range, setRange] = useState("7 Hari");
  const choose = (value: string) => setFilters([{ type: "indikator", value }]);
  const risk = situation.risk ?? "Sedang";
  const growth = situation.growth ?? profile.factors.find((item) => item.factor === "Pertumbuhan Volume")?.change ?? "—";

  return <PageShell eyebrow={`Situasi / ${situation.name}`} title="Risiko & Prediksi" description="Memahami tingkat risiko, faktor pendorong, dan kemungkinan perkembangan situasi." actions={<FilterBar onAdvanced={() => setFilters([{ type: "risk", value: `Risiko ${risk}` }])} />}>
    <SituationMeta item={situation} />
    <SituationNav slug={slug} />
    <ActiveFilters filters={filters} remove={() => setFilters([])} reset={() => setFilters([])} />
    <div className="space-y-4">
      <MetricGrid items={[
        { value: risk.toUpperCase(), label: "Level Risiko Saat Ini", onClick: () => setFilters([{ type: "risk", value: `Risiko ${risk}` }]) },
        { value: growth, label: "Pertumbuhan Volume" },
        { value: profile.activeRegions, label: "Wilayah Aktif" },
        { value: profile.warningCount, label: "Early Warning Aktif" },
      ]} />

      <SummaryBlock title="Ringkasan Risiko" copy={`${situation.name} saat ini berada pada tingkat risiko ${risk.toLowerCase()}. Perkembangan terutama dipengaruhi oleh perubahan volume, perluasan aktivitas di ${profile.activeRegions} wilayah, bertambahnya aktor baru, dan penguatan narasi “${profile.drivingNarrative}”.`} highlights={[
        `Volume berubah ${growth} dibanding periode sebelumnya.`,
        `Aktivitas terpantau di ${profile.activeRegions} wilayah.`,
        `${profile.newActors.replace("/", "dalam")} teridentifikasi.`,
        `Narasi “${profile.drivingNarrative}” menjadi pendorong utama.`,
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
          <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto"><LineChart data={[...trend]}><CartesianGrid vertical={false} /><XAxis dataKey="date" /><YAxis /><ChartTooltip content={<ChartTooltipContent />} /><ChartLegend content={<ChartLegendContent />} /><Line dataKey="actual" stroke="var(--color-actual)" strokeWidth={2} /><Line dataKey="forecast" stroke="var(--color-forecast)" strokeWidth={2} strokeDasharray="5 5" /></LineChart></ChartContainer>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Berdasarkan pola {situation.name} saat ini, volume percakapan diproyeksikan tetap {risk === "Tinggi" ? "tinggi" : "dinamis"} dalam {range.toLowerCase()} ke depan. Pertumbuhan tambahan dapat terjadi apabila narasi “{profile.drivingNarrative}” menguat atau muncul kejadian lapangan baru.</p>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Prediksi Penyebaran"><dl className="grid grid-cols-2 gap-4 text-xs">{[["Potensi Penyebaran", profile.spreadPotential], ["Platform Dominan", situation.platforms.slice(0, 3).join(", ")], ["Wilayah Berkembang", profile.growingRegions], ["Aktor Baru", profile.newActors], ["Narasi Pendorong", profile.drivingNarrative]].map(([label, value]) => <div key={label} className={label === "Narasi Pendorong" ? "col-span-2" : undefined}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl></Panel>
        <Panel title="Early Warning" action={<RadioTower className="size-4 text-destructive" />}><div className="divide-y divide-border">{profile.warnings.map((warning) => <div key={warning.title} className="flex items-start gap-3 py-3"><AlertTriangle className={warning.level === "TINGGI" ? "mt-0.5 size-4 text-destructive" : "mt-0.5 size-4 text-chart-3"} /><div className="flex-1"><p className="text-xs font-medium">{warning.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{warning.meta}</p></div><span className="text-[9px] font-semibold">{warning.level}</span></div>)}</div></Panel>
      </div>

      <Panel title="Pola Aktivitas Tidak Biasa" action={<Button variant="outline" size="sm" onClick={() => choose("Indikasi aktivitas terkoordinasi")}>Lihat Detail<ArrowUpRight /></Button>}><p className="text-sm">{profile.unusualActivity}</p><p className="mt-2 text-xs text-muted-foreground">Indikasi aktivitas terkoordinasi — pola ini memerlukan penelaahan lebih lanjut dan tidak menyatakan koordinasi sebagai fakta.</p></Panel>

      <Panel title="Riwayat Peringatan & Penanganan" description="Linimasa peringatan dan status penanganan dari sistem hingga respons operasional">
        <ol className="space-y-4 border-l border-border pl-5">
          {warningHistory.map((item) => <li key={item.time + item.event} className="relative">
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