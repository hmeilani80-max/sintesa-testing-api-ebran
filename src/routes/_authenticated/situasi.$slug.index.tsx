import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ActiveFilters, DetailTable, FilterBar, MetricGrid, Panel, RecordSheet, SituationMeta, SituationNav, SummaryBlock, type ActiveFilter } from "@/features/situasi/components";
import { useSituations } from "@/features/situasi/context";
import { useArsip } from "@/features/arsip/context";
import { actors, narratives, records, regions, sentiment, trend, type DetailRecord } from "@/features/situasi/data";

export const Route = createFileRoute("/situasi/$slug/")({
  head: ({ params }) => ({ meta: [
    { title: `Ringkasan ${params.slug.replaceAll("-", " ")} — SINTESA` },
    { name: "description", content: "Ringkasan metrik, tren, aktor, narasi, sentimen, wilayah, dan data detail situasi." },
    { property: "og:title", content: "Ringkasan Detail Situasi — SINTESA" },
    { property: "og:description", content: "Kondisi terkini dari situasi yang dipantau." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SituationSummary,
});

const chartConfig = { volume: { label: "Volume", color: "var(--color-chart-1)" }, interactions: { label: "Interaksi", color: "var(--color-chart-1)" } };

function SituationSummary() {
  const { slug } = Route.useParams();
  const { findings, topics } = useSituations();
  const { items: arsipItems } = useArsip();
  const situation = [...topics, ...findings].find((item) => item.slug === slug);
  if (!situation) throw notFound();
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [selected, setSelected] = useState<DetailRecord>();
  const setFilter = (type: string, value: string) => setFilters((current) => [...current.filter((filter) => filter.type !== type), { type, value }]);
  const filteredRecords = useMemo(() => records.filter((row) => filters.every((filter) => {
    if (filter.type === "actor") return row.actor === filter.value;
    if (filter.type === "sentiment") return row.sentiment === filter.value;
    if (filter.type === "region") return row.region === filter.value;
    if (filter.type === "date") return row.date === filter.value;
    return true;
  })), [filters]);

  return <PageShell eyebrow={`Situasi / ${situation.name}`} title={situation.name} description={situation.description} actions={<FilterBar onAdvanced={() => setFilter("risk", "Perlu Perhatian")} />}>
    <SituationMeta item={situation} /><SituationNav slug={slug} />
    <ActiveFilters filters={filters} remove={(target) => setFilters((current) => current.filter((item) => item !== target))} reset={() => setFilters([])} />
    <div className="space-y-4">
      <MetricGrid items={[{value:situation.volume,label:"Konten Terpantau"},{value:situation.actors,label:"Aktor Teridentifikasi"},{value:situation.narratives,label:"Narasi Aktif"},{value:situation.risk === "Tinggi" ? "5" : "2",label:"Indikator Perlu Perhatian"}]} />
      <SummaryBlock title="Ringkasan Situasi" copy={`${situation.name} sedang ${situation.status.toLowerCase()} dalam periode pemantauan. Data menunjukkan dinamika percakapan yang perlu terus diamati berdasarkan cakupan dan indikator saat ini.`} highlights={situation.triggers ?? ["Pemantauan berlangsung lintas platform.", `Cakupan wilayah: ${situation.regionScope}.`, `${situation.narratives} narasi aktif sedang ditelaah.`, "Perubahan penting akan ditampilkan sebagai early warning."]} />
      {(() => {
        const internalRelated = arsipItems.filter((i) => i.modul === "Laporan Lapangan" && (i.ref === slug || i.verification?.situationRef === slug));
        if (!internalRelated.length) return null;
        return (
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold">Data Internal Terkait</h2>
            <ul className="grid gap-2 text-xs">
              {internalRelated.map((i) => {
                const v = i.verification;
                const status = v ? `${v.supported.length} didukung sumber lain · ${v.conflicting.length} berbeda/bertentangan · ${v.unverified.length} belum terverifikasi` : "Belum ada verifikasi silang";
                return (
                  <li key={i.id} className="rounded-md border border-border/60 p-3">
                    <p className="font-medium">{i.title}</p>
                    <p className="mt-1 text-muted-foreground">{status}</p>
                    <Link to="/arsip" className="mt-1 inline-block text-primary hover:underline">Lihat di Arsip & Pengetahuan</Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })()}
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Panel title="Tren Percakapan" description="Volume konten harian"><ChartContainer config={chartConfig} className="h-64 w-full aspect-auto"><LineChart data={trend.slice(0,7)} onClick={(state) => state?.activePayload?.[0]?.payload?.fullDate && setFilter("date", state.activePayload[0].payload.fullDate)}><CartesianGrid vertical={false}/><XAxis dataKey="date" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false} width={45}/><ChartTooltip content={<ChartTooltipContent />} /><Line dataKey="volume" stroke="var(--color-volume)" strokeWidth={2} dot={{r:4,fill:"var(--color-chart-1)"}} /></LineChart></ChartContainer></Panel>
        <Panel title="Sentimen" description="Distribusi percakapan"><ChartContainer config={chartConfig} className="h-64 w-full aspect-auto"><PieChart><Pie data={sentiment} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3} onClick={(data) => setFilter("sentiment", data.name)}>{sentiment.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Pie><ChartTooltip content={<ChartTooltipContent hideLabel />} /></PieChart></ChartContainer><div className="flex justify-center gap-2">{sentiment.map((item)=><Button key={item.name} variant="ghost" size="sm" onClick={()=>setFilter("sentiment",item.name)}>{item.name} {item.value}%</Button>)}</div></Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Aktor Dominan"><ChartContainer config={chartConfig} className="h-72 w-full aspect-auto"><BarChart data={[...actors]} layout="vertical" margin={{left:20}} onClick={(state)=>state?.activePayload?.[0]?.payload?.name&&setFilter("actor",state.activePayload[0].payload.name)}><XAxis type="number" hide/><YAxis type="category" dataKey="name" width={118} tickLine={false} axisLine={false}/><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="interactions" fill="var(--color-chart-1)" radius={3}/></BarChart></ChartContainer></Panel>
        <Panel title="Narasi Dominan"><div className="space-y-2">{narratives.map((item,index)=><Button key={item.name} variant="ghost" className="h-auto w-full justify-start p-2 text-left" onClick={()=>setFilter("narrative",item.name)}><span className="mr-2 font-display text-lg text-muted-foreground">0{index+1}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs">{item.name}</span><span className="text-[10px] text-muted-foreground">{item.volume.toLocaleString("id-ID")} · {item.growth}</span></span></Button>)}</div></Panel>
        <Panel title="Wilayah Dominan"><div className="space-y-3">{regions.map((item)=><Button key={item.name} variant="ghost" className="h-auto w-full justify-start px-2 py-1" onClick={()=>setFilter("region",item.name)}><span className="w-20 text-left text-xs">{item.name}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full bg-chart-2" style={{width:`${item.volume/600}%`}} /></span><span className="w-12 text-right text-[10px] text-chart-2">{item.growth}</span></Button>)}</div></Panel>
      </div>
      <Panel title="Data Detail" description={`${filteredRecords.length} rekam data sesuai filter`}><DetailTable rows={filteredRecords} onSelect={setSelected} /></Panel>
    </div>
    <RecordSheet record={selected} onOpenChange={(open)=>!open&&setSelected(undefined)} />
  </PageShell>;
}