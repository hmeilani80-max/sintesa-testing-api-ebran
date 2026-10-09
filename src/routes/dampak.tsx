import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useArsip } from "@/features/arsip/context";
import { systemFindings } from "@/features/situasi/data";
import {
  NOT_AVAILABLE, PERIODS, SCHEDULED_REPORTS, actors, completionRate, costPer, direction, fmt, fmtDelta, narratives, news, newsChannels,
  newsMetrics, platforms, recordsFor, regions, sentimentCompare, social, socialBreakdown, socialContentBreakdown, summary, timeline,
  volumeSeries, type Row, type SocialContentMetric,
} from "@/features/dampak/data";

/** Tampilkan "Data Tidak Tersedia" alih-alih angka 0 yang diasumsikan saat metrik tidak ada. */
function fmtOrNA(n: number | undefined, unit = "") {
  return n === undefined ? NOT_AVAILABLE : `${fmt(n)}${unit}`;
}

export const Route = createFileRoute("/dampak")({
  head: () => ({
    meta: [
      { title: "Dampak — SINTESA" },
      { name: "description", content: "Evaluasi perubahan kondisi situasi sebelum dan setelah rangkaian respons dijalankan." },
      { property: "og:title", content: "Dampak — SINTESA" },
      { property: "og:description", content: "Baseline → kondisi terkini → apa yang berubah, tanpa klaim sebab-akibat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dampak,
});

const tip = { contentStyle: { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 } };
type Detail = Row & { unit: string; kind: string };

const responseAreas = [
  { title: "Produksi", to: "/aksi/produksi", items: ["1 News Article", "1 Carousel", "1 Video Pendek", "1 Infografis"] },
  { title: "Distribusi Sosial", to: "/aksi/distribusi-sosial", items: ["2 campaign distribusi", "24 planned posts", "23 published", "12 akun", "3 platform"] },
  { title: "Distribusi News", to: "/aksi/distribusi-news", items: ["1 order distribusi", "16 kanal target", "14 publikasi selesai", "2 masih dalam pengerjaan"] },
] as const;

function Section({ n, title, period, children }: { n: number; title: string; period: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold"><span className="mr-2 text-primary">{String(n).padStart(2, "0")}</span>{title}</h2>
        <span className="text-[11px] text-muted-foreground">{period}</span>
      </div>
      {children}
    </section>
  );
}

function DeltaText({ d, unit = "", inverse = false }: { d: number; unit?: string; inverse?: boolean }) {
  const good = inverse ? d > 0 : d < 0;
  return <span className={d === 0 ? "text-muted-foreground" : good ? "text-chart-2" : "text-chart-4"}>{fmtDelta(d, unit)}</span>;
}

function DeltaTable({ rows, unit, label, onPick, status, extra }: { rows: Row[]; unit: string; label: string; onPick: (r: Row) => void; status?: boolean; extra?: (r: Row) => ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-muted-foreground"><tr className="border-b border-border text-left">
          <th className="py-2 font-medium">{label}</th><th className="py-2 text-right font-medium">Baseline</th><th className="py-2 text-right font-medium">Current</th><th className="py-2 text-right font-medium">Delta</th>
          {status && <th className="py-2 text-right font-medium">Status</th>}{extra && <th className="py-2 text-right font-medium">Share</th>}
        </tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.name} onClick={() => onPick(r)} className="cursor-pointer border-b border-border/60 hover:bg-accent/40">
            <td className="py-2 font-medium">{r.name}</td>
            <td className="py-2 text-right tabular-nums">{fmt(r.before)}{unit}</td>
            <td className="py-2 text-right tabular-nums">{fmt(r.now)}{unit}</td>
            <td className="py-2 text-right tabular-nums"><DeltaText d={r.now - r.before} unit={unit === "%" ? " pt" : ""} /></td>
            {status && <td className="py-2 text-right text-muted-foreground">{direction(r.before, r.now)}</td>}
            {extra && <td className="py-2 text-right text-muted-foreground">{extra(r)}</td>}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function CompareBars({ rows, onPick, layout = "vertical", height = 220 }: { rows: Row[]; onPick: (r: Row) => void; layout?: "vertical" | "horizontal"; height?: number }) {
  const click = (d: { name: string | undefined }) => { const r = rows.find((x) => x.name === d.name); if (r) onPick(r); };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout={layout} margin={{ left: layout === "vertical" ? 40 : 0 }} onClick={(e) => click({ name: e?.activeLabel as string | undefined })}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
        {layout === "vertical" ? <><XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} /><YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} /></>
          : <><XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} /><YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} /></>}
        <Tooltip {...tip} cursor={{ fill: "var(--color-accent)", opacity: 0.3 }} />
        <Bar dataKey="before" name="Baseline" fill="var(--color-muted-foreground)" radius={3} className="cursor-pointer" />
        <Bar dataKey="now" name="Current" fill="var(--color-primary)" radius={3} className="cursor-pointer" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Dampak() {
  const [situation, setSituation] = useState("demonstrasi-nasional");
  const [periodId, setPeriodId] = useState<string>("default");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [report, setReport] = useState({ type: "Per Situasi", kind: "Ringkasan Pimpinan", format: "PDF" });
  const [generated, setGenerated] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [schedule, setSchedule] = useState({ kind: "Ringkasan Pimpinan", frekuensi: "Harian", penerima: "" });
  const [contentDetail, setContentDetail] = useState<SocialContentMetric | null>(null);
  const { addItem } = useArsip();
  const period = PERIODS.find((p) => p.id === periodId) ?? PERIODS[0];
  const sit = systemFindings.find((s) => s.slug === situation) ?? systemFindings[0];
  const narrativeDetail = detail?.kind === "Narasi" ? narratives.find((n) => n.name === detail.name) : undefined;
  const pp = `Baseline ${period.baseline} · Current ${period.current}`;
  const pick = (kind: string, unit: string) => (r: Row) => setDetail({ ...r, unit, kind });

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      const label = `${report.kind} · Laporan Dampak ${report.type} — ${sit?.name ?? "Situasi"} (${period.baseline} → ${period.current}) · ${report.format}`;
      setGenerated((g) => [label, ...g]);
      addItem({
        id: `ARS-${Date.now()}`, title: label, jenis: "Laporan", label: "Laporan", modul: "Dampak",
        owner: "Tim Analisis", unit: "Direktorat Analisis", created: "Baru saja", updated: "Baru saja", version: "v1", klasifikasi: "Internal",
        retention: "Simpan 5 tahun", access: ["Direktorat terkait"], canAccess: true, downloadable: true,
        tags: ["laporan", "dampak", report.kind.toLowerCase()], snippet: label, content: label, preview: "laporan", related: [],
        versions: [{ v: "v1", label: "Dibuat", at: "Baru saja", note: "Generate Laporan Dampak" }],
        activity: [{ who: "Tim Analisis", what: "Laporan dibuat dari Generate Laporan Dampak", at: "Baru saja", v: "v1" }],
      });
      toast.success("Laporan tercatat di Arsip & Pengetahuan");
      setGenerating(false);
    }, 900);
  };
  const scheduleReport = () => {
    toast.success(`Jadwal disimpan: ${schedule.kind} · ${schedule.frekuensi}${schedule.penerima ? ` · ke ${schedule.penerima}` : ""} (simulasi)`);
  };

  return (
    <PageShell eyebrow="Measure" title="Dampak" description="Evaluasi perubahan kondisi situasi sebelum dan setelah rangkaian respons dijalankan.">
      <div className="space-y-4">
        {/* 1 Situasi & Periode */}
        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Situasi</p>
            <Select value={situation} onValueChange={setSituation}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>{systemFindings.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            {situation !== "demonstrasi-nasional" && <p className="mt-2 text-[11px] text-muted-foreground">Data contoh PoC memakai skenario Demonstrasi Nasional.</p>}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Periode Evaluasi</p>
            <Select value={periodId} onValueChange={setPeriodId}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>{PERIODS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              {[["Baseline", period.baseline], ["Periode Respons", period.response], ["Kondisi Terkini", period.current]].map(([l, v]) => (
                <div key={l} className="rounded-md border border-border px-3 py-2"><p className="text-muted-foreground">{l}</p><p className="mt-0.5 font-medium">{v}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* 2 AI summary */}
        <section className="rounded-lg border border-primary/30 bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-primary" />Ringkasan Evaluasi AI</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">Selama periode evaluasi, volume mention turun 22% dan sentimen negatif menurun 12 poin. Narasi “aksi meluas ke banyak kota” kehilangan dominasi, sementara narasi klarifikasi meningkat. Aktivitas di Jakarta menurun, tetapi Jawa Barat meningkat. Pada periode yang sama, 2 distribusi sosial dan publikasi melalui 16 kanal News dijalankan.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {["Volume Mention ↓ 22%", "Sentimen Negatif ↓ 12 pt", "Narasi Klarifikasi ↑ 13 pt", "Jawa Barat ↑ 600 mention"].map((h) => <span key={h} className="rounded-md border border-border bg-accent/40 px-2 py-1">{h}</span>)}
          </div>
        </section>

        {/* 3 Ringkasan Perubahan */}
        <Section n={3} title="Ringkasan Perubahan Utama" period={pp}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {summary.map((s) => (
              <div key={s.label} className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="mt-2 flex items-center gap-1.5 font-display text-lg"><span className="text-muted-foreground">{s.before}</span><ArrowRight className="size-3.5 text-muted-foreground" />{s.now}</p>
                <p className="mt-1 text-xs text-chart-2">{s.delta}</p>
                {s.label === "Risk Level" && <p className="mt-2 text-[11px] leading-4 text-muted-foreground">Mengikuti klasifikasi risiko pada modul Situasi.</p>}
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Volume mention harian — baseline, periode respons, current</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={volumeSeries}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <ReferenceArea x1="4 Okt" x2="8 Okt" fill="var(--color-primary)" fillOpacity={0.07} label={{ value: "Periode Respons", fontSize: 10, fill: "var(--color-muted-foreground)", position: "insideTop" }} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} domain={[16000, 26000]} />
                  <Tooltip {...tip} />
                  <Line dataKey="volume" name="Mention" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Sentimen (%) — baseline vs current</p>
              <CompareBars rows={sentimentCompare} layout="horizontal" onPick={pick("Sentimen", "%")} />
            </div>
          </div>
        </Section>

        <Section n={4} title="Perubahan Narasi (share of mention)" period={pp}>
          <div className="grid gap-5 lg:grid-cols-2">
            <CompareBars rows={narratives} onPick={pick("Narasi", "%")} />
            <div>
              <DeltaTable rows={narratives} unit="%" label="Narasi" onPick={pick("Narasi", "%")} />
              <p className="mt-3 text-xs leading-5 text-muted-foreground">Narasi “aksi meluas ke banyak kota” menurun dari 38% menjadi 22%, sementara narasi klarifikasi meningkat dari 8% menjadi 21%.</p>
            </div>
          </div>
        </Section>

        <Section n={5} title="Perubahan Aktor (jumlah mention)" period={pp}>
          <div className="grid gap-5 lg:grid-cols-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={actors.map((a) => ({ name: a.name, delta: a.now - a.before }))} layout="vertical" onClick={(e) => { const a = actors.find((x) => x.name === e?.activeLabel); if (a) pick("Aktor", "")(a); }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip {...tip} />
                <Bar dataKey="delta" name="Delta mention" fill="var(--color-primary)" radius={3} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
            <DeltaTable rows={actors} unit="" label="Aktor" onPick={pick("Aktor", "")} extra={(r) => { const a = actors.find((x) => x.name === r.name); return a ? `${a.shareBefore}% → ${a.shareNow}%` : "—"; }} />
          </div>
        </Section>

        <Section n={6} title="Perubahan Wilayah (jumlah mention)" period={pp}>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="grid grid-cols-5 gap-2 self-start">
              {regions.map((r) => { const d = direction(r.before, r.now); return (
                <button key={r.name} onClick={() => pick("Wilayah", "")(r)} className={`rounded-md border p-3 text-left text-xs transition-colors hover:bg-accent/40 ${d === "Meningkat" ? "border-chart-4/60" : "border-border"}`}>
                  <p className="font-medium">{r.name}</p><p className="mt-2 tabular-nums text-muted-foreground">{fmt(r.now)}</p><p className="mt-1"><DeltaText d={r.now - r.before} /></p>
                </button>); })}
              <p className="col-span-5 text-[11px] text-muted-foreground">Peta ringan per wilayah — klik untuk melihat records.</p>
            </div>
            <DeltaTable rows={regions} unit="" label="Wilayah" status onPick={pick("Wilayah", "")} />
          </div>
        </Section>

        <Section n={7} title="Perubahan Platform (volume mention)" period={pp}>
          <div className="grid gap-5 lg:grid-cols-2">
            <CompareBars rows={platforms} layout="horizontal" onPick={pick("Platform", "")} />
            <DeltaTable rows={platforms} unit="" label="Platform" status onPick={pick("Platform", "")} />
          </div>
        </Section>

        <Section n={8} title="Timeline Perubahan & Respons" period={`Periode Respons ${period.response}`}>
          <ol className="relative space-y-3 border-l border-border pl-5">
            {timeline.map((t) => (
              <li key={t.date + t.text} className="relative">
                <span className={`absolute -left-[25px] top-1 size-2.5 rounded-full ${t.kind === "Respons" ? "bg-primary" : t.kind === "Situasi" ? "bg-chart-4" : "bg-chart-2"}`} />
                <p className="text-xs"><span className="font-medium">{t.date}</span> <span className={`ml-2 rounded border px-1.5 py-0.5 text-[10px] ${t.kind === "Respons" ? "border-primary/40 text-primary" : t.kind === "Situasi" ? "border-chart-4/40 text-chart-4" : "border-chart-2/40 text-chart-2"}`}>{t.kind}</span></p>
                <p className="mt-1 text-sm text-muted-foreground">{t.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[11px] text-muted-foreground">Timeline menunjukkan kejadian pada periode yang sama, bukan hubungan sebab-akibat.</p>
        </Section>

        <Section n={9} title="Respons yang Berjalan pada Periode Evaluasi" period={`Periode Respons ${period.response}`}>
          <div className="grid gap-3 md:grid-cols-3 text-sm">
            {responseAreas.map(({ title, items, to }) => (
              <div key={title} className="rounded-md border border-border p-4"><p className="text-xs font-semibold">{title}</p><ul className="mt-2 space-y-1 text-muted-foreground">{items.map((i) => <li key={i}>· {i}</li>)}</ul><Button asChild variant="link" size="sm" className="mt-2 h-auto px-0"><Link to={to}>Lihat {title}<ArrowRight className="size-3.5" /></Link></Button></div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Konteks aktivitas; bukan skor dampak langsung.</p>
        </Section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section n={10} title="Evaluasi Kanal Sosial" period={`Periode Respons ${period.response}`}>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[["Planned", social.planned], ["Published", social.published], ["Failed", social.failed], ["Views", social.views], ["Interactions", social.interactions], ["Shares", social.shares]].map(([l, v]) => (
                <div key={l as string} className="rounded-md border border-border p-3"><p className="text-muted-foreground">{l}</p><p className="mt-1 font-display text-lg tabular-nums">{fmt(v as number)}</p></div>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-semibold text-muted-foreground">Per Platform</p>
            <table className="mt-1 w-full text-xs"><thead className="text-muted-foreground"><tr className="border-b border-border text-left"><th className="py-2 font-medium">Platform</th><th className="py-2 text-right font-medium">Published Posts</th><th className="py-2 text-right font-medium">Views</th><th className="py-2 text-right font-medium">Interactions</th><th className="py-2 text-right font-medium">Shares/Reposts</th><th className="py-2 text-right font-medium">Watch Time (video)</th></tr></thead>
              <tbody>{socialBreakdown.map((s) => <tr key={s.platform} className="border-b border-border/60"><td className="py-2">{s.platform}</td><td className="py-2 text-right">{s.published}</td><td className="py-2 text-right tabular-nums">{fmtOrNA(s.views)}</td><td className="py-2 text-right tabular-nums">{fmtOrNA(s.interactions)}</td><td className="py-2 text-right tabular-nums">{fmtOrNA(s.shares)}</td><td className="py-2 text-right tabular-nums">{s.isVideoPlatform ? fmtOrNA(s.watchTimeSec, " dtk") : NOT_AVAILABLE}</td></tr>)}</tbody></table>
            <p className="mt-4 text-[11px] font-semibold text-muted-foreground">Per Konten — klik untuk detail</p>
            <table className="mt-1 w-full text-xs"><thead className="text-muted-foreground"><tr className="border-b border-border text-left"><th className="py-2 font-medium">Konten</th><th className="py-2 font-medium">Platform</th><th className="py-2 text-right font-medium">Views</th><th className="py-2 text-right font-medium">Interactions</th><th className="py-2 text-right font-medium">Shares</th><th className="py-2 text-right font-medium">Watch Time</th></tr></thead>
              <tbody>{socialContentBreakdown.map((c) => <tr key={c.id} onClick={() => setContentDetail(c)} className="cursor-pointer border-b border-border/60 hover:bg-accent/40"><td className="py-2 font-medium">{c.title}</td><td className="py-2 text-muted-foreground">{c.platform} · {c.type}</td><td className="py-2 text-right tabular-nums">{fmtOrNA(c.views)}</td><td className="py-2 text-right tabular-nums">{fmtOrNA(c.interactions)}</td><td className="py-2 text-right tabular-nums">{fmtOrNA(c.shares)}</td><td className="py-2 text-right tabular-nums">{c.type === "Video" ? fmtOrNA(c.watchTimeSec, " dtk") : NOT_AVAILABLE}</td></tr>)}</tbody></table>
            <p className="mt-3 text-[11px] text-muted-foreground">Views, Website Visits, dan Estimated Exposure News ditampilkan terpisah dan tidak dijumlahkan menjadi satu angka total.</p>
          </Section>
          <Section n={11} title="Evaluasi Kanal News" period={`Periode Respons ${period.response}`}>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[["Published Articles", fmt(newsMetrics.publishedArticles)], ["Verified URLs", fmt(newsMetrics.verifiedUrls)], ["Website Visits", fmtOrNA(newsMetrics.websiteVisits)], ["Page Views", fmtOrNA(newsMetrics.pageViews)], ["Completion rate", `${completionRate(news.live, news.target).toLocaleString("id-ID")}%`]].map(([l, v]) => (
                <div key={l} className="rounded-md border border-border p-3"><p className="text-muted-foreground">{l}</p><p className="mt-1 font-display text-lg">{v}</p></div>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-semibold text-muted-foreground">Klik baris untuk drilldown ke URL publikasi</p>
            <table className="mt-1 w-full text-xs"><thead className="text-muted-foreground"><tr className="border-b border-border text-left"><th className="py-2 font-medium">Kanal</th><th className="py-2 font-medium">Status</th><th className="py-2 text-right font-medium">Waktu Tayang</th></tr></thead>
              <tbody>{newsChannels.map((c) => <tr key={c.channel} onClick={() => c.status === "Tayang" && toast.message(`URL publikasi ${c.channel}`, { description: `Tayang ${c.time} (drilldown simulasi)` })} className={`border-b border-border/60 ${c.status === "Tayang" ? "cursor-pointer hover:bg-accent/40" : ""}`}><td className="py-2">{c.channel}</td><td className={`py-2 ${c.status === "Tayang" ? "text-chart-2" : "text-muted-foreground"}`}>{c.status}</td><td className="py-2 text-right">{c.time}</td></tr>)}</tbody></table>
            <p className="mt-3 text-[11px] text-muted-foreground">Metrik News ditampilkan terpisah dan tidak dijumlahkan dengan views sosial.</p>
          </Section>
        </div>

        <Section n={12} title="Cost vs Output" period={`Periode Respons ${period.response}`}>
          <table className="w-full text-sm"><thead className="text-xs text-muted-foreground"><tr className="border-b border-border text-left"><th className="py-2 font-medium">Kanal</th><th className="py-2 text-right font-medium">Biaya</th><th className="py-2 text-right font-medium">Output</th><th className="py-2 text-right font-medium">Biaya per output</th></tr></thead>
            <tbody>
              <tr className="border-b border-border/60"><td className="py-2">Social Distribution</td><td className="py-2 text-right tabular-nums">Rp{fmt(social.cost)}</td><td className="py-2 text-right">{social.published} published posts</td><td className="py-2 text-right tabular-nums">Rp{fmt(costPer(social.cost, social.published))} / post</td></tr>
              <tr><td className="py-2">News Distribution</td><td className="py-2 text-right tabular-nums">Rp{fmt(news.cost)}</td><td className="py-2 text-right">{news.live} published articles</td><td className="py-2 text-right tabular-nums">Rp{fmt(costPer(news.cost, news.live))} / article</td></tr>
            </tbody></table>
        </Section>

        <Section n={13} title="Generate Laporan Dampak" period={pp}>
          <div className="flex flex-wrap items-end gap-3">
            <div><p className="mb-1 text-xs text-muted-foreground">Jenis laporan</p><Select value={report.kind} onValueChange={(kind) => setReport((r) => ({ ...r, kind }))}><SelectTrigger aria-label="Jenis laporan" className="w-52"><SelectValue /></SelectTrigger><SelectContent>{["Ringkasan Pimpinan", "Laporan Analitik", "Laporan Lengkap"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><p className="mb-1 text-xs text-muted-foreground">Periode</p><Select value={report.type} onValueChange={(type) => setReport((r) => ({ ...r, type }))}><SelectTrigger aria-label="Periode" className="w-40"><SelectValue /></SelectTrigger><SelectContent>{["Harian", "Mingguan", "Bulanan", "Per Situasi"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><p className="mb-1 text-xs text-muted-foreground">Format</p><Select value={report.format} onValueChange={(format) => setReport((r) => ({ ...r, format }))}><SelectTrigger aria-label="Format" className="w-40"><SelectValue /></SelectTrigger><SelectContent>{["Document", "Spreadsheet", "Presentation", "PDF"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={generate} disabled={generating}><FileText />{generating ? "Menyusun…" : "Generate Laporan Dampak"}</Button>
          </div>
          {generated.length > 0 && <ul className="mt-4 space-y-2 text-xs">{generated.map((g, i) => <li key={i} className="rounded-md border border-border px-3 py-2">{g} <span className="ml-2 text-chart-2">Siap (simulasi) · tercatat di Arsip</span></li>)}</ul>}

          <div className="mt-6 rounded-md border border-border p-4">
            <p className="text-xs font-semibold">Jadwalkan Laporan Otomatis</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <div><p className="mb-1 text-xs text-muted-foreground">Jenis laporan</p><Select value={schedule.kind} onValueChange={(kind) => setSchedule((r) => ({ ...r, kind }))}><SelectTrigger aria-label="Jenis laporan jadwal" className="w-52"><SelectValue /></SelectTrigger><SelectContent>{["Ringkasan Pimpinan", "Laporan Analitik", "Laporan Lengkap"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><p className="mb-1 text-xs text-muted-foreground">Frekuensi</p><Select value={schedule.frekuensi} onValueChange={(frekuensi) => setSchedule((r) => ({ ...r, frekuensi }))}><SelectTrigger aria-label="Frekuensi" className="w-40"><SelectValue /></SelectTrigger><SelectContent>{["Harian", "Mingguan", "Bulanan", "Per Situasi"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><p className="mb-1 text-xs text-muted-foreground">Penerima (opsional)</p><Input value={schedule.penerima} onChange={(e) => setSchedule((r) => ({ ...r, penerima: e.target.value }))} placeholder="mis. Deputi, Direktorat terkait" className="w-56" /></div>
              <Button variant="outline" onClick={scheduleReport}>Jadwalkan</Button>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Sistem mensimulasikan pembuatan laporan otomatis secara berkala; setiap laporan yang dihasilkan otomatis tercatat di Arsip & Pengetahuan. Tidak ada backend scheduler sungguhan pada PoC ini.</p>
            <p className="mt-4 text-xs font-semibold">Laporan Terjadwal</p>
            <ul className="mt-2 grid gap-2 text-xs sm:grid-cols-3">{SCHEDULED_REPORTS.map((s) => (
              <li key={s.id} className="rounded-md border border-border px-3 py-2"><p className="font-medium">{s.name}</p><p className="text-muted-foreground">{s.frekuensi} · {s.jenis}</p></li>
            ))}</ul>
          </div>
        </Section>
      </div>

      <Dialog open={!!contentDetail} onOpenChange={(o) => !o && setContentDetail(null)}>
        <DialogContent>
          {contentDetail && <>
            <DialogHeader><DialogTitle>{contentDetail.title}</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground">{contentDetail.platform} · {contentDetail.type} · Published {contentDetail.published}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Views</p><p className="mt-1 font-display text-lg">{fmtOrNA(contentDetail.views)}</p></div>
              <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Interactions</p><p className="mt-1 font-display text-lg">{fmtOrNA(contentDetail.interactions)}</p></div>
              <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Shares/Reposts</p><p className="mt-1 font-display text-lg">{fmtOrNA(contentDetail.shares)}</p></div>
              <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Watch Time</p><p className="mt-1 font-display text-lg">{contentDetail.type === "Video" ? fmtOrNA(contentDetail.watchTimeSec, " dtk") : NOT_AVAILABLE}</p></div>
            </div>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          {detail && <>
            <DialogHeader><DialogTitle>{detail.kind}: {detail.name}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">{narrativeDetail ? "Share baseline" : "Baseline"} · {period.baseline}</p><p className="mt-1 font-display text-lg">{fmt(detail.before)}{detail.unit}</p></div>
              <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">{narrativeDetail ? "Share current" : "Current"} · {period.current}</p><p className="mt-1 font-display text-lg">{fmt(detail.now)}{detail.unit}</p></div>
              <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Delta</p><p className="mt-1 font-display text-lg"><DeltaText d={detail.now - detail.before} unit={detail.unit === "%" ? " pt" : ""} /></p></div>
            </div>
            {narrativeDetail && <>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Mention baseline</p><p className="mt-1 font-display text-lg">{fmt(narrativeDetail.mentionsBefore)}</p></div>
                <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Mention current</p><p className="mt-1 font-display text-lg">{fmt(narrativeDetail.mentionsNow)}</p></div>
                <div className="rounded-md border border-border p-3"><p className="text-muted-foreground">Delta mention</p><p className="mt-1 font-display text-lg"><DeltaText d={narrativeDetail.mentionsNow - narrativeDetail.mentionsBefore} /></p></div>
              </div>
              <p className="text-[11px] text-muted-foreground">Jumlah mention dan sumber/konten berikut adalah data contoh PoC.</p>
            </>}
            <p className="mt-2 text-xs font-semibold">{narrativeDetail ? "Contoh sumber/konten" : "Contoh records"}</p>
            <ul className="space-y-2 text-xs">{recordsFor(detail.name).map((r) => <li key={r.time} className="rounded-md border border-border p-3"><p>{r.post}</p><p className="mt-1 text-muted-foreground">{r.platform} · {r.time} · Sumber: {narrativeDetail ? "contoh monitoring PoC" : "data monitoring"}</p></li>)}</ul>
          </>}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
