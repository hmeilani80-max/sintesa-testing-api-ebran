import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { PageShell } from "@/components/page-shell";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveFilters, DetailTable, ManipulationPatternPanel, MetricGrid, Panel, RecordSheet, SituationMeta, SituationNav, type ActiveFilter } from "@/features/situasi/components";
import { useSituations } from "@/features/situasi/context";
import type { DetailRecord, ManipulationPattern } from "@/features/situasi/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/situasi/$slug/eksplorasi")({
  head: () => ({ meta: [
    { title: "Eksplorasi Situasi — SINTESA" },
    { name: "description", content: "Eksplorasi aktor, narasi, sentimen, dan observasi aktual." },
  ] }),
  component: Exploration,
});

const chartConfig = {
  volume: { label: "Volume", color: "var(--color-chart-1)" },
  interactions: { label: "Interaksi", color: "var(--color-chart-2)" },
};

type ActorRow = {
  name: string; category: string; platform: string; interactions: number;
  reach: string; influence: string; cluster: string; narrative: string;
};
type NarrativeRow = { name: string; volume: number; actors: number; growth: string };
type TrendRow = { date: string; volume: number };
type SentimentRow = { platform: string; sentiment: string; percentage: number; count: number };

function Exploration() {
  const { slug } = Route.useParams();
  const { findings, topics } = useSituations();
  const situation = [...topics, ...findings].find((item) => item.slug === slug);
  if (!situation) throw notFound();

  const [actors, setActors] = useState<ActorRow[]>([]);
  const [narratives, setNarratives] = useState<NarrativeRow[]>([]);
  const [trendRows, setTrendRows] = useState<TrendRow[]>([]);
  const [sentimentRows, setSentimentRows] = useState<SentimentRow[]>([]);
  const [records, setRecords] = useState<DetailRecord[]>([]);
  const [patterns, setPatterns] = useState<ManipulationPattern[]>([]);
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DetailRecord>();

  useEffect(() => {
    let cancelled = false;
    const db = supabase as any;
    async function load() {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const results = await Promise.all([
        db.from("situasi_actors").select("*").eq("topic_slug", slug).order("interactions", { ascending: false }),
        db.from("situasi_narratives").select("*").eq("topic_slug", slug).order("volume", { ascending: false }),
        db.from("situasi_trend_points").select("*").eq("topic_slug", slug).gte("period_date", since.slice(0, 10)).order("period_date", { ascending: true }),
        db.from("situasi_sentiment_metrics").select("*").eq("topic_slug", slug).order("period_date", { ascending: true }),
        db.from("situasi_observations").select("*").eq("topic_slug", slug).order("observed_at", { ascending: false }).limit(200),
        db.from("situasi_manipulation_patterns").select("*").eq("topic_slug", slug),
      ]);
      if (cancelled) return;
      const [actorResult, narrativeResult, trendResult, sentimentResult, observationResult, patternResult] = results;
      setActors((actorResult.data ?? []).map((x: any) => ({
        name: x.actor_name ?? "—", category: x.category ?? "—", platform: x.platform ?? "—",
        interactions: Number(x.interactions ?? 0),
        reach: x.reach ? new Intl.NumberFormat("id-ID", { notation: "compact" }).format(Number(x.reach)) : "—",
        influence: x.influence ?? "—", cluster: x.cluster_name ?? "—", narrative: x.dominant_narrative ?? "—",
      })));
      setNarratives((narrativeResult.data ?? []).map((x: any) => ({
        name: x.name, volume: Number(x.volume ?? 0), actors: Number(x.actor_count ?? 0),
        growth: x.growth_percent == null ? "—" : `${Number(x.growth_percent) > 0 ? "+" : ""}${x.growth_percent}%`,
      })));
      setTrendRows((trendResult.data ?? []).map((x: any) => ({ date: x.period_date, volume: Number(x.actual_volume ?? x.volume ?? 0) })));
      setSentimentRows((sentimentResult.data ?? []).map((x: any) => ({
        platform: x.platform ?? "Semua Platform", sentiment: x.sentiment,
        percentage: Number(x.percentage ?? 0), count: Number(x.item_count ?? 0),
      })));
      setRecords((observationResult.data ?? []).map((x: any) => {
        const date = x.observed_at ? new Date(x.observed_at) : null;
        return {
          actor: x.actor ?? "—", platform: x.platform ?? "—", content: x.content ?? "",
          narrative: x.narrative ?? "—", sentiment: x.sentiment ?? "Netral",
          emotion: x.emotion ?? "—", region: x.region ?? "—",
          risk: x.risk === "Tinggi" || x.risk === "Rendah" ? x.risk : "Sedang",
          time: date ? date.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) : "—",
          date: date ? date.toLocaleDateString("id-ID", { day: "numeric", month: "long", timeZone: "Asia/Jakarta" }) : "—",
        } as DetailRecord;
      }));
      setPatterns((patternResult.data ?? []).map((x: any) => ({
        id: x.id, name: x.name, description: x.description ?? "—",
        count: Number(x.detected_count ?? 0), trend: x.trend ?? "Stabil",
        dominantPlatform: x.dominant_platform ?? "—",
        relatedNarrative: x.related_narrative ?? "—", example: x.example ?? "—",
      } as ManipulationPattern)));
    }
    void load().catch((error) => console.error("[Situasi] Gagal memuat Eksplorasi dari Supabase:", error));
    return () => { cancelled = true; };
  }, [slug]);

  const filteredRecords = useMemo(() => records.filter((record) => filters.every((filter) => {
    if (filter.type === "actor") return record.actor === filter.value;
    if (filter.type === "sentiment") return record.sentiment === filter.value;
    if (filter.type === "region") return record.region === filter.value;
    return true;
  })), [records, filters]);
  const totalInteractions = actors.reduce((sum, actor) => sum + actor.interactions, 0);
  const sentimentTotals = sentimentRows.filter((row) => row.platform === "Semua Platform");
  const choose = (type: string, value: string) => setFilters((current) => [...current.filter((item) => item.type !== type), { type, value }]);

  return <PageShell eyebrow={`Situasi / ${situation.name}`} title={`Eksplorasi · ${situation.name}`} description="Analisis berdasarkan data relasional dan observasi yang tersimpan di database.">
    <SituationMeta item={situation} />
    <SituationNav slug={slug} />
    <ActiveFilters filters={filters} remove={(target) => setFilters((current) => current.filter((item) => item !== target))} reset={() => setFilters([])} />
    <Tabs defaultValue="aktor">
      <TabsList className="mb-4 h-10 w-full justify-start overflow-x-auto bg-card">
        <TabsTrigger value="aktor">Aktor</TabsTrigger>
        <TabsTrigger value="narasi">Narasi</TabsTrigger>
        <TabsTrigger value="sentimen">Sentimen</TabsTrigger>
      </TabsList>
      <TabsContent value="aktor" className="space-y-4">
        <MetricGrid items={[
          { value: actors.length.toLocaleString("id-ID"), label: "Aktor Tersimpan" },
          { value: actors.filter((actor) => actor.influence === "Tinggi").length.toLocaleString("id-ID"), label: "Pengaruh Tinggi" },
          { value: totalInteractions.toLocaleString("id-ID"), label: "Total Interaksi" },
          { value: String(new Set(actors.map((actor) => actor.cluster).filter((value) => value !== "—")).size), label: "Cluster Terdata" },
        ]} />
        <Panel title="Aktor Teridentifikasi" description="Angka dihitung dari tabel situasi_actors">
          {actors.length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-muted-foreground"><th className="p-2">Aktor</th><th className="p-2">Platform</th><th className="p-2">Interaksi</th><th className="p-2">Pengaruh</th><th className="p-2">Cluster</th><th className="p-2">Narasi</th></tr></thead><tbody>{actors.map((actor) => <tr key={actor.name} className="border-b border-border/60"><td className="p-2 font-medium">{actor.name}</td><td className="p-2">{actor.platform}</td><td className="p-2">{actor.interactions.toLocaleString("id-ID")}</td><td className="p-2">{actor.influence}</td><td className="p-2">{actor.cluster}</td><td className="p-2">{actor.narrative}</td></tr>)}</tbody></table></div> : <p className="text-xs text-muted-foreground">Belum ada data aktor untuk situasi ini.</p>}
        </Panel>
      </TabsContent>
      <TabsContent value="narasi" className="space-y-4">
        <MetricGrid items={[
          { value: narratives.length.toLocaleString("id-ID"), label: "Narasi Tersimpan" },
          { value: narratives.reduce((sum, item) => sum + item.volume, 0).toLocaleString("id-ID"), label: "Volume Narasi" },
          { value: String(narratives.reduce((sum, item) => sum + item.actors, 0)), label: "Aktor pada Narasi" },
          { value: String(patterns.length), label: "Pola Tersimpan" },
        ]} />
        <Panel title="Narasi Dominan">
          {narratives.length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-muted-foreground"><th className="p-2">Narasi</th><th className="p-2">Volume</th><th className="p-2">Aktor</th><th className="p-2">Pertumbuhan</th></tr></thead><tbody>{narratives.map((item) => <tr key={item.name} className="border-b border-border/60"><td className="p-2">{item.name}</td><td className="p-2">{item.volume.toLocaleString("id-ID")}</td><td className="p-2">{item.actors.toLocaleString("id-ID")}</td><td className="p-2">{item.growth}</td></tr>)}</tbody></table></div> : <p className="text-xs text-muted-foreground">Belum ada data narasi untuk situasi ini.</p>}
        </Panel>
        <Panel title="Indikasi Pola Informasi">
          {patterns.length ? <ManipulationPatternPanel patterns={patterns} onSelect={(pattern) => choose("pattern", pattern.name)} /> : <p className="text-xs text-muted-foreground">Belum ada pola yang tersimpan. Sistem tidak mengisi contoh simulasi.</p>}
        </Panel>
      </TabsContent>
      <TabsContent value="sentimen" className="space-y-4">
        <MetricGrid items={["Positif", "Netral", "Negatif"].map((name) => ({
          value: `${sentimentTotals.find((row) => row.sentiment === name)?.percentage ?? 0}%`,
          label: name,
        }))} />
        <Panel title="Sentimen per Platform">
          {sentimentRows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-muted-foreground"><th className="p-2">Platform</th><th className="p-2">Sentimen</th><th className="p-2">Persentase</th><th className="p-2">Jumlah</th></tr></thead><tbody>{sentimentRows.map((row, index) => <tr key={`${row.platform}-${row.sentiment}-${index}`} className="border-b border-border/60"><td className="p-2">{row.platform}</td><td className="p-2">{row.sentiment}</td><td className="p-2">{row.percentage}%</td><td className="p-2">{row.count.toLocaleString("id-ID")}</td></tr>)}</tbody></table></div> : <p className="text-xs text-muted-foreground">Belum ada metrik sentimen tersimpan.</p>}
        </Panel>
      </TabsContent>
    </Tabs>
    <div className="mt-4 space-y-4">
      <Panel title="Tren Observasi 30 Hari" description="Hanya titik tren terbaru dari database yang ditampilkan">
        {trendRows.length ? <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto"><LineChart data={trendRows}><CartesianGrid vertical={false} /><XAxis dataKey="date" /><YAxis /><ChartTooltip content={<ChartTooltipContent />} /><Line dataKey="volume" stroke="var(--color-volume)" strokeWidth={2} /></LineChart></ChartContainer> : <p className="text-xs text-muted-foreground">Belum ada titik tren dalam 30 hari terakhir.</p>}
      </Panel>
      <Panel title="Observasi Sumber" description={`${filteredRecords.length} observasi tersimpan sesuai filter`}>
        {filteredRecords.length ? <DetailTable rows={filteredRecords} onSelect={setSelectedRecord} /> : <p className="text-xs text-muted-foreground">Belum ada observasi untuk ditampilkan.</p>}
      </Panel>
    </div>
    <RecordSheet record={selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(undefined)} />
  </PageShell>;
}
