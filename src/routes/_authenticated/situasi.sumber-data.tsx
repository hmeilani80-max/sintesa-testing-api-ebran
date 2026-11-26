import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowLeft, ExternalLink, Newspaper, Radio, RefreshCw, ShieldCheck } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
type RunRow = {
  id: string;
  source_category: "news" | "social" | "government";
  actor_id: string;
  actor_run_id: string | null;
  status: "running" | "success" | "partial" | "failed";
  items_seen: number;
  items_saved: number;
  observations_inserted: number;
  duplicates_skipped: number;
  unmatched_items: number;
  errors: unknown[];
  started_at: string;
  finished_at: string | null;
};

type ItemRow = {
  id: string;
  source_category: string;
  source_name: string | null;
  platform: string | null;
  title: string | null;
  content: string;
  source_url: string | null;
  published_at: string | null;
  province: string | null;
  region: string | null;
  topic_slug: string | null;
  match_status: string;
  created_at: string;
};

const categoryLabel: Record<string, string> = {
  news: "Berita online",
  social: "Media sosial",
  government: "Situs pemerintah",
};
const statusLabel: Record<string, string> = {
  running: "Berjalan",
  success: "Berhasil",
  partial: "Sebagian berhasil",
  failed: "Gagal",
};

function formatDate(value: string | null) {
  if (!value) return "Belum selesai";
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
}

export const Route = createFileRoute("/_authenticated/situasi/sumber-data")({
  head: () => ({ meta: [{ title: "Sumber Data Situasi — SINTESA" }] }),
  component: SituationSources,
});

function SituationSources() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [runResult, itemResult] = await Promise.all([
      db.from("situasi_apify_ingestion_runs").select("*").order("started_at", { ascending: false }).limit(30),
      db.from("situasi_apify_items").select("id,source_category,source_name,platform,title,content,source_url,published_at,province,region,topic_slug,match_status,created_at").order("created_at", { ascending: false }).limit(30),
    ]);
    if (runResult.error || itemResult.error) {
      setError(runResult.error?.message ?? itemResult.error?.message ?? "Gagal membaca data Apify.");
    } else {
      setError(null);
      setRuns((runResult.data ?? []) as RunRow[]);
      setItems((itemResult.data ?? []) as ItemRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const channel = db.channel("situasi-apify-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "situasi_apify_ingestion_runs" }, () => { void load(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "situasi_apify_items" }, () => { void load(); })
      .subscribe();
    return () => { void db.removeChannel(channel); };
  }, [load]);

  const totals = runs.reduce((acc, run) => ({
    runs: acc.runs + 1,
    items: acc.items + Number(run.items_seen ?? 0),
    observations: acc.observations + Number(run.observations_inserted ?? 0),
    failures: acc.failures + (run.status === "failed" ? 1 : 0),
  }), { runs: 0, items: 0, observations: 0, failures: 0 });

  return (
    <PageShell
      eyebrow="Situasi"
      title="Sumber Data"
      description="Pantau pengumpulan berita online, media sosial, dan situs pemerintah melalui Apify."
      actions={<div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><Link to="/situasi"><ArrowLeft />Kembali ke Situasi</Link></Button>
        <Button asChild variant="outline" size="sm"><a href="https://supabase.com/dashboard/project/kaafosgeoxcqeidtzblq/functions/secrets" target="_blank" rel="noreferrer">Atur Secrets<ShieldCheck /></a></Button>
        <Button asChild size="sm"><a href="https://github.com/hmeilani80-max/sintesa-testing-api-ebran/actions/workflows/situasi-apify-ingestion.yml" target="_blank" rel="noreferrer">Jalankan / Pantau Workflow<ExternalLink /></a></Button>
      </div>}
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardDescription>Total run (30 terakhir)</CardDescription><CardTitle>{totals.runs}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Item ditemukan</CardDescription><CardTitle>{totals.items.toLocaleString("id-ID")}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Observasi EWS masuk</CardDescription><CardTitle>{totals.observations.toLocaleString("id-ID")}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Run gagal</CardDescription><CardTitle>{totals.failures}</CardTitle></CardHeader></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />Konfigurasi kolektor</CardTitle>
            <CardDescription>Token dan konfigurasi Actor hanya disimpan sebagai Supabase Edge Function Secrets, tidak pernah di browser atau database publik.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4"><Newspaper className="mb-2 size-5" /><p className="font-medium">Berita online</p><p className="mt-1 text-xs text-muted-foreground">Google News / berita online</p></div>
            <div className="rounded-lg border p-4"><Radio className="mb-2 size-5" /><p className="font-medium">Media sosial</p><p className="mt-1 text-xs text-muted-foreground">Instagram · TikTok · Facebook · X · YouTube · Telegram</p></div>
            <div className="rounded-lg border p-4"><Activity className="mb-2 size-5" /><p className="font-medium">Situs pemerintah</p><p className="mt-1 text-xs text-muted-foreground">Portal nasional + situs resmi provinsi</p></div>
          </CardContent>
          <CardContent className="border-t pt-4 text-sm text-muted-foreground">
            Cakupan target: Indonesia nasional dan 38 provinsi. Kata kunci temuan diperluas untuk Actor yang mendukung pencarian berbasis daftar; portal pemerintah, halaman Facebook, dan kanal Telegram harus diisi dengan URL/username publik resmi. Lokasi hanya dicatat jika sumber mengembalikan informasi wilayah secara eksplisit. Jadwal otomatis setiap 3 jam setelah secret dan Actor dikonfigurasi.
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className="size-4" />Riwayat pengambilan Apify</CardTitle><CardDescription>30 proses terakhir dari Supabase.</CardDescription></CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Memuat riwayat…</p> : error ? <p className="text-sm text-destructive">{error}</p> : runs.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada proses Apify. Konfigurasikan secrets lalu jalankan workflow.</p> : (
              <div className="space-y-3">
                {runs.map((run) => <div key={run.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{categoryLabel[run.source_category] ?? run.source_category}</span><Badge variant={run.status === "success" ? "default" : run.status === "failed" ? "destructive" : "secondary"}>{statusLabel[run.status] ?? run.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{formatDate(run.started_at)} · Actor {run.actor_id}</p></div>
                  <div className="grid grid-cols-3 gap-4 text-xs"><div><p className="text-muted-foreground">Ditemukan</p><p className="font-semibold">{run.items_seen}</p></div><div><p className="text-muted-foreground">Observasi</p><p className="font-semibold">{run.observations_inserted}</p></div><div><p className="text-muted-foreground">Belum cocok</p><p className="font-semibold">{run.unmatched_items}</p></div></div>
                </div>)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Data terkumpul</CardTitle><CardDescription>Item mentah disimpan untuk pemeriksaan; hanya item bertanggal, memiliki URL sumber, dan cocok dengan temuan yang dipromosikan menjadi observasi EWS.</CardDescription></CardHeader>
          <CardContent>
            {items.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada item terkumpul.</p> : <div className="space-y-3">
              {items.map((item) => <article key={item.id} className="rounded-lg border p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant="outline">{categoryLabel[item.source_category] ?? item.source_category}</Badge><Badge variant={item.match_status === "matched" ? "default" : "secondary"}>{item.match_status}</Badge><span className="text-xs text-muted-foreground">{formatDate(item.published_at)}</span></div>
                <h3 className="font-medium">{item.title ?? "Tanpa judul"}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{item.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">{[item.source_name,item.platform,item.province ?? item.region].filter(Boolean).join(" · ") || "Metadata sumber belum tersedia"}</p>
                {item.source_url && <a className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline" href={item.source_url} target="_blank" rel="noreferrer">Buka sumber <ExternalLink className="size-3" /></a>}
              </article>)}
            </div>}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
