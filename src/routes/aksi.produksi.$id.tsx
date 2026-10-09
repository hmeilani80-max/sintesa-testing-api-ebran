import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, Lineage, StatusPill, Trail } from "@/features/aksi/components";
import { useAksi } from "@/features/aksi/context";
import { approvalLabel, canSubmit, qualityChecks, SOURCES } from "@/features/aksi/data";
import { aksiHead } from "@/features/aksi/meta";
import { ChecksList, ProductionWorkspace } from "@/features/aksi/production-workspaces";
import { rencanaPublikasi } from "@/features/aksi/sosial";

export const Route = createFileRoute("/aksi/produksi/$id")({
  head: aksiHead("Workspace Produksi", "Generate, review, dan ajukan satu output konten ke Persetujuan."),
  component: ProduksiDetail,
});

function ProduksiDetail() {
  const { id } = Route.useParams();
  const { productions, campaigns, orders, submit } = useAksi();
  const p = productions.find((x) => x.id === id);
  if (!p) return <PageShell title="Produksi tidak ditemukan" description="Item ini tidak tersedia."><Button asChild variant="outline"><Link to="/aksi/produksi"><ArrowLeft />Kembali ke Produksi</Link></Button></PageShell>;
  const checks = qualityChecks(p);
  const warnings = checks.filter((c) => !c.ok).length;
  const destLabel = p.dest.includes("News") ? "Distribusi News" : "Distribusi Sosial";

  const submitButton = canSubmit(p) && <Button onClick={() => submit(p.id)}><Send />{p.approval ? "Ajukan Ulang" : "Ajukan Persetujuan"}</Button>;

  return (
    <PageShell eyebrow={`Aksi · Produksi · ${p.type}`} title={p.title} description={p.brief.message} actions={<div className="flex flex-wrap gap-2">{submitButton}<Button asChild variant="outline"><Link to="/aksi/produksi"><ArrowLeft />Kembali</Link></Button></div>}>
      <Trail items={["Aksi", <Link key="l" to="/aksi/produksi">Produksi</Link>, p.title]} />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Produksi</span><StatusPill value={p.status} />
        <span className="ml-2 text-muted-foreground">Approval</span><StatusPill value={approvalLabel(p.approval)} />
        {p.version > 0 && <span className="text-muted-foreground">· v{p.version}</span>}
        {p.approval === "Disetujui" && <span className="ml-2 text-chart-2">Siap digunakan di {destLabel} — belum dipublikasikan.</span>}
      </div>
      <Tabs defaultValue="produksi">
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start">
          <TabsTrigger value="brief">Brief</TabsTrigger><TabsTrigger value="produksi">Produksi</TabsTrigger>
          <TabsTrigger value="editorial">Editorial{warnings ? ` (${warnings})` : ""}</TabsTrigger><TabsTrigger value="approval">Approval</TabsTrigger><TabsTrigger value="riwayat">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="brief" className="grid gap-4">
          <Lineage steps={p.source === "Strategi" ? [
            ...(p.situationName ? [{ label: "Situasi", value: p.situationSlug ? <Link to="/situasi/$slug" params={{ slug: p.situationSlug }}>{p.situationName}</Link> : p.situationName }] : []),
            { label: "Sumber Strategi", value: p.strategySlug ? <Link to="/strategi/$slug" params={{ slug: p.strategySlug }}>{p.strategyTitle}</Link> : (p.strategyTitle ?? "—") },
            { label: "Produksi", value: p.title },
          ] : [{ label: "Sumber", value: "Produksi Manual" }, { label: "Produksi", value: p.title }]} />
          <Box title="Brief Produksi"><dl className="grid gap-4 text-xs sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Judul / Tema</dt><dd className="mt-1 font-medium">{p.brief.theme}</dd></div>
            <div><dt className="text-muted-foreground">Arahan Gaya</dt><dd className="mt-1">{p.brief.style.join(", ") || "—"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-muted-foreground">Pesan Utama</dt><dd className="mt-1 leading-6">{p.brief.message}</dd></div>
            <div className="sm:col-span-2"><dt className="text-muted-foreground">Poin / Fakta Pendukung</dt><dd className="mt-1"><ul className="list-disc pl-4 leading-6">{p.brief.points.filter(Boolean).map((x) => <li key={x}>{x}</li>)}</ul></dd></div>
          </dl></Box>
        </TabsContent>

        <TabsContent value="produksi" className="grid gap-4">
          <Box title={p.type}><ProductionWorkspace p={p} /></Box>
          <Box title="Rencana Publikasi">
            {(() => {
              const rows = rencanaPublikasi(p.id, campaigns, orders);
              if (!rows.length) return <p className="text-xs text-muted-foreground">Belum memiliki rencana publikasi.</p>;
              return <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs">
                <thead className="text-muted-foreground"><tr><th className="py-1.5 font-medium">Distribusi</th><th className="py-1.5 font-medium">Target</th><th className="py-1.5 font-medium">Jadwal</th><th className="py-1.5 font-medium">PIC</th><th className="py-1.5 font-medium">Status</th></tr></thead>
                <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-border"><td className="py-2">{r.distribusi}</td><td className="py-2">{r.target}</td><td className="py-2">{r.jadwal}</td><td className="py-2">{r.pic}</td><td className="py-2"><StatusPill value={r.status} /></td></tr>)}</tbody>
              </table></div>;
            })()}
          </Box>
        </TabsContent>

        <TabsContent value="editorial" className="grid gap-4 lg:grid-cols-2">
          <Box title="Pemeriksaan Otomatis" action={checks.length > 0 && <StatusPill value={warnings ? "Perlu Revisi" : "Approved"} />}><ChecksList checks={checks} />{checks.length > 0 && <p className="mt-3 text-[11px] text-muted-foreground">{warnings ? "Ada catatan yang sebaiknya ditinjau sebelum diajukan." : "Aman untuk diajukan ke reviewer."}</p>}</Box>
          <Box title="Sumber yang Digunakan"><table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th className="py-1.5 font-medium">Sumber</th><th className="py-1.5 font-medium">Jenis</th><th className="py-1.5 font-medium">Digunakan untuk</th></tr></thead>
            <tbody>{(p.source === "Strategi" ? SOURCES : [{ name: "Brief Manual", kind: "Input", use: "Pesan & poin" }]).map((s) => <tr key={s.name} className="border-t border-border"><td className="py-2">{s.name}</td><td>{s.kind}</td><td className="text-muted-foreground">{s.use}</td></tr>)}</tbody></table></Box>
        </TabsContent>

        <TabsContent value="approval"><Box title="Approval Konten" action={<StatusPill value={approvalLabel(p.approval)} />}>
          <ol className="mb-4 flex flex-wrap gap-2 text-[11px]">{["Belum Diajukan", "Menunggu Review", "Perlu Revisi / Approved"].map((s, i) => <li key={s} className="rounded-sm border border-border px-2 py-1 text-muted-foreground">{i + 1}. {s}</li>)}</ol>
          {p.reviewNote && <p className="mb-3 rounded-md bg-accent/50 px-3 py-2 text-xs">Catatan reviewer: “{p.reviewNote}”</p>}
          <p className="mb-3 text-xs text-muted-foreground">{p.status !== "Generated" ? "Generate konten terlebih dahulu sebelum diajukan." : p.approval === "Menunggu" ? <>Sedang ditinjau di <Link to="/aksi/persetujuan" className="text-primary hover:underline">Persetujuan</Link>.</> : p.approval === "Disetujui" ? <>Approved. Konten siap dipakai di <Link to={p.dest.includes("News") ? "/aksi/distribusi-news" : "/aksi/distribusi-sosial"} className="text-primary hover:underline">{destLabel}</Link>, yang memiliki Approval Distribusi tersendiri.</> : p.approval ? "Perbaiki atau regenerate konten, lalu ajukan ulang." : "Setelah ditinjau, ajukan output ini ke Persetujuan."}</p>
          {submitButton}
        </Box></TabsContent>

        <TabsContent value="riwayat"><Box title="Riwayat Versi">
          {!p.history.length ? <p className="text-xs text-muted-foreground">Belum ada versi.</p> : <ol className="grid gap-2 text-xs">{[...p.history].reverse().map((h, i) => <li key={i} className="flex items-center gap-3"><span className="w-10 text-muted-foreground">{h.at}</span><strong className="w-8">v{h.version}</strong><StatusPill value={h.label} /></li>)}</ol>}
        </Box></TabsContent>
      </Tabs>
    </PageShell>
  );
}
