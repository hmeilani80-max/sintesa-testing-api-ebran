import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

import { periodLabel } from "@/features/aksi/sosial";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Box, StatusPill, Trail } from "@/features/aksi/components";
import { useAksi, type ApprovalRef } from "@/features/aksi/context";
import { APPROVER_ROLE, newsChannelDomain, qualityChecks, SOURCES, type ApprovalRecord, type ApprovalStatus } from "@/features/aksi/data";
import { aksiHead } from "@/features/aksi/meta";
import { ChecksList, ContentPreview } from "@/features/aksi/production-workspaces";
import { PostsBrowser } from "@/features/aksi/sosial-components";

export const Route = createFileRoute("/aksi/persetujuan/$kind/$id")({
  head: aksiHead("Detail Persetujuan", "Preview, konteks, hasil pemeriksaan otomatis, keputusan, dan riwayat keputusan."),
  component: Detail,
});

const label = (s: ApprovalStatus | null) => (s === null ? "Belum Diajukan" : s === "Menunggu" ? "Menunggu Review" : s);

function Meta({ items }: { items: [string, ReactNode][] }) {
  return <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">{items.map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>)}</dl>;
}

function Timeline({ records }: { records: ApprovalRecord[] }) {
  if (!records.length) return <p className="text-xs text-muted-foreground">Belum ada riwayat.</p>;
  return <ol className="grid gap-3 border-l border-border pl-4 text-xs">{records.map((r, i) => <li key={i} className="relative">
    <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-primary" />
    <span className="text-muted-foreground">{r.at}</span>
    <p><strong>{r.version ? `v${r.version} · ` : ""}{r.decision}</strong> <span className="text-muted-foreground">oleh {r.actor}</span></p>
    {r.note && <p className="mt-0.5 text-muted-foreground">“{r.note}”</p>}
  </li>)}</ol>;
}

function Decision({ refx, status, distribution, after }: { refx: ApprovalRef; status: ApprovalStatus | null; distribution?: boolean; after: ReactNode }) {
  const { decide } = useAksi();
  const [mode, setMode] = useState<"Perlu Revisi" | "Ditolak" | null>(null);
  const [note, setNote] = useState("");
  if (status !== "Menunggu") return <Box title="Keputusan"><p className="mb-2"><StatusPill value={label(status)} /></p><div className="text-xs text-muted-foreground">{status === "Disetujui" ? after : status === "Perlu Revisi" ? "Dikembalikan ke service asal untuk diperbaiki, lalu dapat diajukan kembali." : status === "Ditolak" ? "Item ditolak." : "Belum diajukan."}</div></Box>;
  return <Box title="Keputusan">
    <p className="mb-3 text-[11px] text-muted-foreground">Approver: {APPROVER_ROLE}. Persetujuan tidak mengubah isi — perbaikan dilakukan di service asal.</p>
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => decide(refx, "Disetujui")}>{distribution ? "Setujui Distribusi" : "Setujui"}</Button>
      <Button variant="outline" onClick={() => setMode("Perlu Revisi")}>{distribution ? "Minta Perubahan" : "Minta Revisi"}</Button>
      <Button variant="ghost" onClick={() => setMode("Ditolak")}>Tolak</Button>
    </div>
    {mode && <div className="mt-3 grid gap-2">
      <Textarea aria-label="Catatan" placeholder={mode === "Ditolak" ? "Alasan penolakan…" : "Catatan revisi, mis. Perjelas sumber informasi pada bagian ketiga."} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2"><Button size="sm" disabled={!note.trim()} onClick={() => { decide(refx, mode, note.trim()); setMode(null); setNote(""); }}>Kirim keputusan</Button><Button size="sm" variant="ghost" onClick={() => setMode(null)}>Batal</Button></div>
    </div>}
  </Box>;
}

function NotFound() {
  return <PageShell eyebrow="Aksi" title="Item tidak ditemukan" description="Item persetujuan ini tidak tersedia."><Link to="/aksi/persetujuan" className="text-primary hover:underline">Kembali ke Persetujuan</Link></PageShell>;
}

function Detail() {
  const { kind, id } = Route.useParams();
  const { productions, campaigns, orders } = useAksi();
  const crumbs = (title: string) => <Trail items={[<Link key="a" to="/aksi/produksi">Aksi</Link>, <Link key="p" to="/aksi/persetujuan">Persetujuan</Link>, title]} />;

  if (kind === "konten") {
    const p = productions.find((x) => x.id === id);
    if (!p) return <NotFound />;
    const checks = qualityChecks(p);
    return <PageShell eyebrow="Persetujuan Konten" title={p.title} description="Tinjau hasil akhir dan beri keputusan." actions={<Button asChild variant="outline"><Link to="/aksi/produksi/$id" params={{ id: p.id }}>Buka di Produksi</Link></Button>}>
      {crumbs(p.title)}
      <div className="mb-4 rounded-lg border border-border bg-card p-4"><Meta items={[["Jenis", p.type], ["Sumber", "Produksi"], ["Sumber Strategi", p.strategyTitle ?? "Produksi Manual"], ["Versi", `v${p.version}`], ["Pengaju", p.submittedBy ?? "—"], ["Diajukan", p.submittedAt ?? "—"], ["Status", <StatusPill key="s" value={label(p.approval)} />], ["Approver", APPROVER_ROLE]]} /></div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-4">
          <Box title="Preview Konten"><ContentPreview p={p} /></Box>
        </div>
        <div className="grid content-start gap-4">
          <Decision refx={{ kind: "Konten", id: p.id }} status={p.approval} after={<>Siap digunakan di <Link to={p.dest.includes("News") ? "/aksi/distribusi-news" : "/aksi/distribusi-sosial"} className="text-primary hover:underline">Distribusi {p.dest.includes("News") ? "News" : "Sosial"}</Link>. Ini bukan izin publish — distribusi tetap memerlukan Approval Distribusi.</>} />
          <Box title="Pesan Utama"><p className="text-xs leading-5">{p.brief.message}</p></Box>
          <Box title="Fakta & Sumber Pendukung"><ul className="grid gap-1.5 text-xs">{p.brief.points.map((x) => <li key={x}>• {x}</li>)}</ul><p className="mt-3 text-[11px] text-muted-foreground">Sumber: {SOURCES.map((s) => s.name).join(", ")}</p></Box>
          <Box title="Pemeriksaan Otomatis"><ChecksList checks={checks} /><p className="mt-2 text-[11px] text-muted-foreground">{checks.filter((c) => c.ok).length} lolos · {checks.filter((c) => !c.ok).length} perlu perhatian</p></Box>
          <Box title="Riwayat Keputusan"><Timeline records={p.approvals} /></Box>
        </div>
      </div>
    </PageShell>;
  }

  if (kind === "sosial") {
    const c = campaigns.find((x) => x.id === id);
    if (!c) return <NotFound />;
    const contents = c.contentIds.map((cid) => productions.find((p) => p.id === cid)).filter((p) => !!p);
    return <PageShell eyebrow="Persetujuan Distribusi · Sosial" title={c.name} description="Apa yang akan disebarkan, ke mana, berapa banyak, dan kapan." actions={<Button asChild variant="outline"><Link to="/aksi/distribusi-sosial/$id" params={{ id: c.id }}>Buka di Distribusi Sosial</Link></Button>}>
      {crumbs(c.name)}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-4">
          <Box title="Konten"><ul className="grid gap-2 text-xs">{contents.map((p) => <li key={p.id} className="flex items-center justify-between gap-2"><Link to="/aksi/persetujuan/$kind/$id" params={{ kind: "konten", id: p.id }} className="hover:underline">{p.title} <span className="text-muted-foreground">· {p.type}</span></Link><StatusPill value={p.approval === "Disetujui" ? "Approved" : label(p.approval)} /></li>)}</ul></Box>
          <Box title="Rencana Distribusi"><Meta items={[["Tujuan", c.purpose.join(", ")], ["Platform", c.platforms.join(", ")], ["Target Account", `${c.accounts.length} akun`], ["Periode", `${c.timing.mode === "Segera" ? "Segera setelah disetujui · " : ""}${periodLabel(c.timing)} · ${c.timing.from}–${c.timing.to}`], ["Pola Distribusi", c.staggered ? "Otomatis bertahap" : "Serentak"], ["Volume", `${c.posts.length} posting`]]} /></Box>
          <Box title="Volume & Content Matrix">
            <table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th className="py-1.5 font-medium">Platform</th><th className="py-1.5 font-medium">Posting</th><th className="py-1.5 font-medium">Konten</th></tr></thead>
              <tbody>{c.platforms.map((pl) => <tr key={pl} className="border-t border-border"><td className="py-2">{pl}</td><td className="py-2">{c.posts.filter((x) => x.platform === pl).length} posting</td><td className="py-2 text-muted-foreground">{[...new Set(c.posts.filter((x) => x.platform === pl).map((x) => x.assetType))].join(", ")}</td></tr>)}</tbody></table>
          </Box>
          <Box title="Paket Publikasi"><PostsBrowser posts={c.posts} productions={productions} editable={false} /></Box>
        </div>
        <div className="grid content-start gap-4">
          <Decision distribution refx={{ kind: "Distribusi Sosial", id: c.id }} status={c.approval} after={c.timing.mode === "Segera" ? "Distribusi langsung mulai dijalankan." : "Distribusi akan berstatus Dijadwalkan dan berjalan otomatis sesuai jadwal."} />
          <Box title="Riwayat Keputusan"><Timeline records={c.approvals ?? []} /></Box>
        </div>
      </div>
    </PageShell>;
  }

  const o = orders.find((x) => x.id === id);
  if (kind !== "news" || !o) return <NotFound />;
  const art = productions.find((p) => p.id === o.contentId);
  const national = o.channels.filter((ch) => ch.channel === "Nasional").length;
  const title = o.title ?? `Order ${o.id}`;
  return <PageShell eyebrow="Persetujuan Distribusi · News" title={title} description="Konten, kanal tujuan, jadwal, dan aturan adaptasi." actions={<Button asChild variant="outline"><Link to="/aksi/distribusi-news/$id" params={{ id: o.id }}>Buka di Distribusi News</Link></Button>}>
    {crumbs(title)}
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="grid content-start gap-4">
        <Box title="Konten"><div className="flex items-center justify-between gap-2 text-xs">{art ? <Link to="/aksi/persetujuan/$kind/$id" params={{ kind: "konten", id: art.id }} className="hover:underline">{art.title}</Link> : "—"}<span>Content Approval: <StatusPill value={label(art?.approval ?? null)} /></span></div></Box>
        <Box title="Target & Jadwal"><Meta items={[["Target", `${o.channels.length} dari 39 kanal`], ["Coverage", `${national} Nasional · ${o.channels.length - national} Wilayah`], ["Jadwal", o.schedule], ["Adaptasi", o.notes || "—"]]} /></Box>
        <Box title="Daftar Kanal"><div className="flex flex-wrap gap-1.5">{o.channels.map((ch) => <span key={ch.channel} className="rounded-sm bg-secondary px-2 py-1 text-[11px]">{newsChannelDomain(ch.channel)}</span>)}</div></Box>
      </div>
      <div className="grid content-start gap-4">
        <Decision distribution refx={{ kind: "Distribusi News", id: o.id }} status={o.approval} after="Order dapat dikirim ke pengelola kanal di Distribusi News." />
        <Box title="Riwayat Keputusan"><Timeline records={o.approvals ?? []} /></Box>
      </div>
    </div>
  </PageShell>;
}
