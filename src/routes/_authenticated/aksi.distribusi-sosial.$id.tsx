import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Ban, Lock, Play, RotateCw, Send } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, Lineage, StatusPill, Trail } from "@/features/aksi/components";
import { useAksi } from "@/features/aksi/context";
import { aksiHead } from "@/features/aksi/meta";
import { canExecute, canSubmitDistribution, isEditable, periodLabel, readinessChecks } from "@/features/aksi/sosial";
import { ChecksView, PostsBrowser } from "@/features/aksi/sosial-components";

export const Route = createFileRoute("/aksi/distribusi-sosial/$id")({
  head: aksiHead("Detail Distribusi", "Ringkasan, paket publikasi, persetujuan, eksekusi, dan riwayat distribusi sosial."),
  component: DistributionDetail,
});

const EXEC_STATES = ["Scheduled", "Published", "Failed", "Cancelled"] as const;

function DistributionDetail() {
  const { id } = Route.useParams();
  const { campaigns, productions, updatePost, regenerate, submitCampaign, advanceCampaign, retryPost, cancelCampaign } = useAksi();
  const c = campaigns.find((x) => x.id === id);
  if (!c) return <PageShell title="Distribusi tidak ditemukan" description="Item ini tidak tersedia."><Button asChild variant="outline"><Link to="/aksi/distribusi-sosial"><ArrowLeft />Kembali</Link></Button></PageShell>;
  const contents = c.contentIds.map((cid) => productions.find((p) => p.id === cid)).filter((p) => !!p);
  const prod = contents[0];
  const editable = isEditable(c);
  const checks = readinessChecks(c, productions);
  const approvedRec = [...(c.approvals ?? [])].reverse().find((r) => r.decision === "Disetujui" || r.decision === "Perlu Revisi" || r.decision === "Ditolak");
  const execStatus = c.status === "Sedang Berjalan" || c.status === "Selesai" || c.status === "Dijadwalkan" || c.status === "Dibatalkan" ? c.status : "Belum berjalan";
  const runnable = canExecute(c);

  return (
    <PageShell eyebrow="Aksi · Distribusi Sosial" title={c.name} description={`${c.id} · ${c.platforms.join(", ")} · ${c.accounts.length} akun · ${periodLabel(c.timing)}`} actions={<Button asChild variant="outline"><Link to="/aksi/distribusi-sosial"><ArrowLeft />Kembali ke list</Link></Button>}>
      <Trail items={["Aksi", <Link key="l" to="/aksi/distribusi-sosial">Distribusi Sosial</Link>, c.name]} />
      <div className="mb-4 flex flex-wrap items-center gap-2"><StatusPill value={c.status} />
        {editable && <Button size="sm" disabled={!canSubmitDistribution(checks)} onClick={() => submitCampaign(c.id)}><Send />{c.status === "Perlu Perubahan" ? "Ajukan Kembali" : "Ajukan Persetujuan Distribusi"}</Button>}
        {c.status === "Perlu Perubahan" && <span className="text-xs text-chart-3">Approver meminta perubahan — perbaiki Paket Publikasi lalu ajukan kembali.</span>}
      </div>
      <Tabs defaultValue="ringkasan">
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start">{["Ringkasan", "Paket Publikasi", "Persetujuan", "Eksekusi", "Riwayat"].map((t) => <TabsTrigger key={t} value={t.toLowerCase()}>{t}</TabsTrigger>)}</TabsList>

        <TabsContent value="ringkasan" className="grid gap-4">
          <Lineage steps={[
            ...(prod?.strategySlug ? [{ label: "Strategi", value: <Link to="/strategi/$slug" params={{ slug: prod.strategySlug }}>{prod.strategyTitle}</Link> }] : []),
            { label: "Produksi", value: prod ? <Link to="/aksi/produksi/$id" params={{ id: prod.id }}>{prod.id}</Link> : "—" },
            { label: "Approved Content", value: `${contents.length} asset` },
            { label: "Distribusi Sosial", value: c.id },
          ]} />
          <Box title="Ringkasan Distribusi"><dl className="grid gap-4 text-xs sm:grid-cols-3">
            {[["Nama distribusi", c.name], ["Sumber konten", contents.map((p) => `${p.title} v${p.version}`).join(", ")], ["Tujuan", c.purpose.join(", ")], ["Platform", c.platforms.join(", ")], ["Jumlah akun", `${c.accounts.length} akun`], ["Volume posting", `${c.posts.length} posting`], ["Periode", `${c.timing.mode === "Segera" ? "Segera · " : ""}${periodLabel(c.timing)} · ${c.timing.from}–${c.timing.to}`], ["Pola", c.staggered ? "Otomatis bertahap" : "Serentak"]].map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="mt-1 font-medium">{v}</dd></div>)}
            <div><dt className="text-muted-foreground">Status approval</dt><dd className="mt-1">{c.approval ? <StatusPill value={c.approval} /> : "Belum diajukan"}</dd></div>
            <div><dt className="text-muted-foreground">Status eksekusi</dt><dd className="mt-1"><StatusPill value={execStatus} /></dd></div>
          </dl>{c.direction && <p className="mt-4 text-xs text-muted-foreground">Arahan: {c.direction}</p>}</Box>
        </TabsContent>

        <TabsContent value="paket publikasi" className="grid gap-4">
          {editable && <Box title="Readiness Check"><ChecksView checks={checks} /></Box>}
          <Box title={`Paket Publikasi · ${c.posts.length} posting`} action={!editable ? <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="size-3" />Terkunci selama {c.status}</span> : undefined}>
            <PostsBrowser posts={c.posts} productions={productions} editable={editable} showExec={!editable && c.approval === "Disetujui"} onEdit={(pid, caption) => updatePost(c.id, pid, { caption })} onRegenerate={(pid) => regenerate(c.id, pid)} />
          </Box>
        </TabsContent>

        <TabsContent value="persetujuan" className="grid gap-4">
          <Box title="Persetujuan Distribusi" action={c.approval ? <StatusPill value={c.approval} /> : undefined}>
            {!c.approval ? <p className="text-xs text-muted-foreground">Belum diajukan untuk Persetujuan Distribusi.</p> : <dl className="grid gap-3 text-xs sm:grid-cols-4">
              <div><dt className="text-muted-foreground">Status</dt><dd className="mt-1 font-medium">{c.approval}</dd></div>
              <div><dt className="text-muted-foreground">Approver</dt><dd className="mt-1 font-medium">{approvedRec?.actor ?? "Supervisor"}</dd></div>
              <div><dt className="text-muted-foreground">Waktu keputusan</dt><dd className="mt-1 font-medium">{approvedRec?.at ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Versi diajukan</dt><dd className="mt-1 font-medium">{(c.approvals ?? []).filter((r) => r.decision.startsWith("Diajukan")).length || 1}</dd></div>
              {approvedRec?.note && <div className="sm:col-span-4"><dt className="text-muted-foreground">Catatan</dt><dd className="mt-1">“{approvedRec.note}”</dd></div>}
            </dl>}
            {c.approval === "Menunggu" && <p className="mt-3 text-xs">Menunggu keputusan di <Link to="/aksi/persetujuan/$kind/$id" params={{ kind: "sosial", id: c.id }} className="text-primary hover:underline">Persetujuan → Distribusi</Link>.</p>}
          </Box>
          <Box title="Riwayat Keputusan"><ol className="grid gap-2 text-xs">{[...(c.approvals ?? [])].reverse().map((r, i) => <li key={i} className="flex flex-wrap items-center gap-2 border-b border-border pb-2 last:border-0"><span className="w-12 text-muted-foreground">{r.at}</span><StatusPill value={r.decision === "Perlu Revisi" ? "Perlu Perubahan" : r.decision} /><span>{r.actor}</span>{r.note && <span className="text-muted-foreground">— “{r.note}”</span>}</li>)}</ol></Box>
        </TabsContent>

        <TabsContent value="eksekusi" className="grid gap-4">
          {c.approval !== "Disetujui" ? <Box title="Eksekusi"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Lock className="size-4" />Distribusi tidak dapat dipublikasikan, dijadwalkan, atau auto-post sebelum Distribution Approval = Approved.</p></Box> : <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{EXEC_STATES.map((s) => <div key={s} className="rounded-lg border border-border bg-card p-4"><strong className="font-display text-2xl">{c.posts.filter((p) => p.exec === s).length}</strong><p className="mt-1 text-xs text-muted-foreground">{s}</p></div>)}</div>
            <Box title="Status Eksekusi" action={<div className="flex gap-2">
              {runnable && <Button size="sm" onClick={() => advanceCampaign(c.id)}><Play />{c.status === "Dijadwalkan" ? "Mulai sesuai jadwal (simulasi)" : "Proses posting berikutnya (simulasi)"}</Button>}
              {runnable && <Button size="sm" variant="outline" onClick={() => cancelCampaign(c.id)}><Ban />Batalkan</Button>}
            </div>}>
              <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs">
                <thead className="text-muted-foreground"><tr><th className="py-2 font-medium">Akun</th><th className="py-2 font-medium">Platform</th><th className="py-2 font-medium">Asset</th><th className="py-2 font-medium">Planned</th><th className="py-2 font-medium">Actual</th><th className="py-2 font-medium">Status</th><th /></tr></thead>
                <tbody>{c.posts.map((p) => <tr key={p.id} className="border-t border-border"><td className="py-2 font-medium">{p.handle}</td><td className="py-2">{p.platform}</td><td className="py-2">{p.assetType}</td><td className="py-2">{p.time}</td><td className="py-2">{p.actual ?? "—"}</td>
                  <td className="py-2"><StatusPill value={p.exec} />{p.reason && <span className="ml-2 text-[11px] text-muted-foreground">{p.reason}</span>}</td>
                  <td className="py-2 text-right">{p.exec === "Failed" && c.status !== "Dibatalkan" && <Button size="sm" variant="outline" onClick={() => retryPost(c.id, p.id)}><RotateCw />Retry</Button>}</td></tr>)}</tbody>
              </table></div>
              <p className="mt-3 text-[11px] text-muted-foreground">Engagement dan dampak dipantau di <Link to="/dampak" className="text-primary hover:underline">Dampak</Link>.</p>
            </Box>
          </>}
        </TabsContent>

        <TabsContent value="riwayat"><Box title="Riwayat"><ol className="grid gap-2 text-xs">{c.history.map((h, i) => <li key={i} className="flex gap-3 border-b border-border pb-2 last:border-0"><span className="w-12 shrink-0 text-muted-foreground">{h.at}</span><span>{h.text}</span></li>)}</ol></Box></TabsContent>
      </Tabs>
    </PageShell>
  );
}
