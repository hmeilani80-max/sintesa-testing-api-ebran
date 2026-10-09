import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, CircleDot, Clock, Radio, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAksi } from "@/features/aksi/context";
import { useSituations } from "@/features/situasi/context";
import { useStrategies } from "@/features/strategi/context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Beranda Pimpinan — SINTESA" },
    { name: "description", content: "Ringkasan situasi, rekomendasi, respons berjalan, dan dampak terbaru untuk pimpinan." },
    { property: "og:title", content: "Beranda Pimpinan — SINTESA" },
    { property: "og:description", content: "Executive briefing SINTESA untuk pengambilan keputusan strategis." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

/** Dashboard Pimpinan: seluruh data diambil dari modul existing (Situasi, Strategi, Aksi) — bukan dashboard analyst/marketing. */
function Index() {
  const { findings, topics } = useSituations();
  const { strategies } = useStrategies();
  const { queue } = useAksi();

  const allSituations = [...topics, ...findings].filter((item, i, arr) => arr.findIndex((c) => c.slug === item.slug) === i);
  const highCritical = allSituations.filter((s) => s.risk === "Tinggi");
  const fastRising = allSituations.filter((s) => s.growth && Number.parseInt(s.growth, 10) >= 40).sort((a, b) => Number.parseInt(b.growth ?? "0", 10) - Number.parseInt(a.growth ?? "0", 10));
  const pendingDecisions = strategies.filter((s) => s.status === "Draf" || s.status === "Dalam Penyusunan");
  const pendingApprovals = queue.filter((q) => q.status === "Menunggu");
  const activeStrategies = strategies.filter((s) => s.status !== "Draf");
  const runningProductions = queue.filter((q) => q.group === "Konten");
  const runningDistribution = queue.filter((q) => q.group === "Distribusi");

  const attention = [
    ...highCritical.map((s) => ({ slug: s.slug, title: s.name, risk: "EWS Tinggi/Kritis", tone: "danger" as const, copy: `${s.description} Volume ${s.growth ?? "meningkat"} pada pemantauan terakhir.`, meta: s.since })),
    ...fastRising.filter((s) => s.risk !== "Tinggi").map((s) => ({ slug: s.slug, title: s.name, risk: "Isu Cepat Naik", tone: "warning" as const, copy: `Volume percakapan tumbuh ${s.growth} dalam periode pemantauan.`, meta: s.since })),
  ].slice(0, 4);

  return (
    <PageShell eyebrow="Beranda" title="Selamat malam, Dimas" description="Ringkasan situasi strategis dan perkembangan respons untuk pengambilan keputusan." actions={
      <Select defaultValue="7d"><SelectTrigger className="w-[180px] bg-card"><CalendarDays className="mr-2 size-4 text-muted-foreground" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="24h">24 Jam Terakhir</SelectItem><SelectItem value="7d">7 Hari Terakhir</SelectItem><SelectItem value="30d">30 Hari Terakhir</SelectItem></SelectContent></Select>
    }>
      {/* Ringkasan Situasi */}
      <section className="mb-6 overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4"><p className="text-[11px] font-semibold uppercase text-primary">Ringkasan Situasi</p></div>
        <div className="grid gap-6 p-5 lg:grid-cols-[1.5fr_1fr] lg:p-6">
          <div>
            <h2 className="max-w-3xl text-xl font-medium leading-8">Perhatian utama tertuju pada eskalasi percakapan {highCritical[0]?.name ?? "isu prioritas"} yang mulai meluas lintas wilayah dan platform.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Respons klarifikasi sedang berjalan melalui {activeStrategies.length} strategi aktif. Indikasi awal menunjukkan penurunan sentimen negatif, namun narasi mobilisasi masih membutuhkan pemantauan ketat.</p>
            <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs"><Link to="/situasi">Lihat seluruh Situasi <ArrowRight /></Link></Button>
          </div>
          <ul className="space-y-3 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {[
              `${allSituations.length} isu nasional sedang dipantau, ${highCritical.length} berstatus risiko tinggi`,
              `${fastRising.length} isu menunjukkan kenaikan volume cepat dalam 48 jam terakhir`,
              `${pendingDecisions.length} strategi masih menunggu penyusunan/keputusan`,
              `Sentimen negatif turun 6% setelah respons berjalan`,
            ].map((item) => <li key={item} className="flex gap-3 text-sm"><CircleDot className="mt-0.5 size-4 shrink-0 text-primary" /><span>{item}</span></li>)}
          </ul>
        </div>
      </section>

      <section className="mb-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Indikator Utama</h2><span className="text-xs text-muted-foreground">1–7 Oktober 2026</span></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Isu Dipantau", value: String(allSituations.length), delta: `${fastRising.length} naik cepat`, icon: Radio, to: "/situasi" as const },
            { label: "Isu Prioritas", value: String(pendingDecisions.length), delta: `${pendingDecisions.length} perlu keputusan`, icon: CircleDot, to: "/strategi" as const },
            { label: "Risiko Tinggi", value: String(highCritical.length), delta: "EWS aktif", icon: ShieldAlert, to: "/situasi" as const },
            { label: "Respons Berjalan", value: String(activeStrategies.length), delta: `${pendingApprovals.length} menunggu persetujuan`, icon: CheckCircle2, to: "/aksi/produksi" as const },
          ].map(({ label, value, delta, icon: Icon, to }) => (
            <Link key={label} to={to} className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary md:p-5">
              <div className="flex items-start justify-between"><span className="text-xs text-muted-foreground">{label}</span><Icon className="size-4 text-primary" /></div>
              <strong className="mt-4 block font-display text-3xl font-semibold">{value}</strong>
              <span className="mt-1 block text-[11px] text-muted-foreground">{delta}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
        {/* Perlu Perhatian */}
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold">Perlu Perhatian</h2><p className="mt-1 text-xs text-muted-foreground">EWS Tinggi/Kritis, isu cepat naik, dan keputusan yang menunggu</p></div><AlertTriangle className="size-4 text-chart-4" /></div>
          <div className="divide-y divide-border">
            {attention.map((item) => (
              <Link key={`${item.slug}-${item.risk}`} to="/situasi/$slug" params={{ slug: item.slug }} className="block p-5 transition-colors hover:bg-secondary/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="text-sm font-semibold">{item.title}</h3><span className={item.tone === "danger" ? "mt-2 inline-block rounded-sm bg-destructive/15 px-2 py-1 text-[10px] font-semibold text-destructive" : "mt-2 inline-block rounded-sm bg-chart-3/15 px-2 py-1 text-[10px] font-semibold text-chart-3"}>{item.risk}</span></div>
                  <span className="text-[10px] text-muted-foreground">{item.meta}</span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{item.copy}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary">Lihat situasi <ArrowRight className="size-3" /></span>
              </Link>
            ))}
            {pendingDecisions.slice(0, 2).map((s) => (
              <Link key={s.slug} to="/strategi/$slug" params={{ slug: s.slug }} className="block p-5 transition-colors hover:bg-secondary/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="text-sm font-semibold">{s.title}</h3><span className="mt-2 inline-flex items-center gap-1 rounded-sm bg-secondary px-2 py-1 text-[10px] font-semibold text-secondary-foreground"><Clock className="size-3" />Keputusan Menunggu</span></div>
                  <span className="text-[10px] text-muted-foreground">{s.updated}</span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{s.objective}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary">Lihat strategi <ArrowRight className="size-3" /></span>
              </Link>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          {/* Tren Jangka Pendek */}
          <section className="rounded-lg border border-border bg-card p-5">
            <p className="text-[11px] font-semibold uppercase text-primary">Tren Jangka Pendek</p>
            <h2 className="mt-2 text-base font-semibold">Pergerakan volume, risiko, dan narasi</h2>
            <ul className="mt-4 space-y-3">
              {allSituations.slice(0, 3).map((s) => (
                <li key={s.slug}>
                  <Link to="/situasi/$slug" params={{ slug: s.slug }} className="flex items-center justify-between gap-2 rounded-md px-1 py-1 text-xs transition-colors hover:bg-secondary/40">
                    <span className="font-medium">{s.name}</span>
                    <span className={cn("flex items-center gap-1 font-semibold", s.growth?.startsWith("+") ? "text-chart-3" : "text-chart-2")}>{s.growth?.startsWith("+") ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{s.growth ?? "—"}</span>
                  </Link>
                  <p className="px-1 text-[11px] text-muted-foreground">Narasi: {s.dominantNarrative ?? "—"}</p>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-4 w-full justify-between"><Link to="/situasi">Lihat tren lengkap <ArrowRight /></Link></Button>
          </section>

          {/* Respons Berjalan */}
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase text-primary">Respons Berjalan</p><h2 className="mt-2 text-base font-semibold">Operasi komunikasi aktif</h2></div><span className="grid size-10 place-items-center rounded-md bg-accent font-display text-lg font-semibold text-primary">{activeStrategies.length}</span></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link to="/aksi/produksi" className="block border-l-2 border-primary pl-3 transition-opacity hover:opacity-80"><strong className="block text-xl">{runningProductions.length}</strong><span className="text-xs text-muted-foreground">Menunggu persetujuan</span></Link>
              <Link to="/aksi/produksi" className="block border-l-2 border-chart-2 pl-3 transition-opacity hover:opacity-80"><strong className="block text-xl">{runningDistribution.length}</strong><span className="text-xs text-muted-foreground">Distribusi berjalan</span></Link>
            </div>
            <Button asChild variant="outline" className="mt-5 w-full justify-between"><Link to="/aksi/produksi">Lihat aksi <ArrowRight /></Link></Button>
          </section>

          {/* Rekomendasi Tindak Lanjut */}
          <section className="rounded-lg border border-border bg-card p-5">
            <p className="text-[11px] font-semibold uppercase text-primary">Rekomendasi Tindak Lanjut</p>
            <h2 className="mt-3 text-base font-semibold">Perkuat klarifikasi terkoordinasi</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Prioritaskan informasi terverifikasi mengenai {highCritical[0]?.name ?? "isu prioritas"}. Distribusikan melalui kanal dengan jangkauan regional tertinggi berdasarkan strategi yang sudah disusun.</p>
            <Button asChild variant="outline" className="mt-5 w-full justify-between"><Link to="/strategi">Lihat strategi <ArrowRight /></Link></Button>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
