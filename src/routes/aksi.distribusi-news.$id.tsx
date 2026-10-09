import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, Send, Truck } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Box, Lineage, StatusPill, Trail } from "@/features/aksi/components";
import { findOutput, useAksi } from "@/features/aksi/context";
import { distributionReadiness, newsChannelDomain } from "@/features/aksi/data";
import { aksiHead } from "@/features/aksi/meta";

export const Route = createFileRoute("/aksi/distribusi-news/$id")({
  head: aksiHead("Detail Order Distribusi", "Kanal tujuan, approval distribusi, pengiriman order, dan verifikasi URL tayang."),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { orders, productions, submitOrder, sendOrder, setChannel } = useAksi();
  const o = orders.find((x) => x.id === id);
  if (!o) return <PageShell title="Order tidak ditemukan" description="Item ini tidak tersedia."><Button asChild variant="outline"><Link to="/aksi/distribusi-news"><ArrowLeft />Kembali</Link></Button></PageShell>;
  const found = findOutput(productions, o.contentId);
  const prod = found?.production;
  const readiness = distributionReadiness(found?.output.approval ?? null, o.approval);
  const sent = !["Draft Order", "Menunggu Approval", "Approved", "Ditolak"].includes(o.status);

  return (
    <PageShell eyebrow="Aksi · Distribusi News" title={`Order ${o.id}`} description={`${found?.output.type ?? "Konten"} · ${o.channels.length} kanal · ${o.schedule}`} actions={<Button asChild variant="outline"><Link to="/aksi/distribusi-news"><ArrowLeft />Kembali ke list</Link></Button>}>
      <Trail items={["Aksi", <Link key="l" to="/aksi/distribusi-news">Distribusi News</Link>, `Order ${o.id}`]} />
      <div className="grid gap-4">
        {o.deadline && <p className="text-xs text-muted-foreground">Deadline publikasi: <span className="font-medium text-foreground">{o.deadline}</span></p>}
        <Lineage steps={[
          ...(prod?.situationName ? [{ label: "Situasi", value: prod.situationSlug ? <Link to="/situasi/$slug" params={{ slug: prod.situationSlug }}>{prod.situationName}</Link> : prod.situationName }] : []),
          ...(prod?.strategySlug ? [{ label: "Strategi", value: <Link to="/strategi/$slug" params={{ slug: prod.strategySlug }}>{prod.strategyTitle}</Link> }] : []),
          ...(prod ? [{ label: "Produksi", value: <Link to="/aksi/produksi/$id" params={{ id: prod.id }}>{prod.title} · v{prod.version}</Link> }] : []),
          { label: "Distribusi News", value: `Order #${o.id}` },
          { label: "Kanal", value: `${o.channels.length} kanal` },
        ]} />
        <Box title="Approval & Pengiriman" action={<StatusPill value={sent ? o.status : readiness} />}>
          <dl className="mb-4 grid gap-3 text-xs sm:grid-cols-3">
            <div><dt className="text-muted-foreground">Content Approval</dt><dd className="mt-1">{found?.output.approval ? <StatusPill value={found.output.approval} /> : "—"}</dd></div>
            <div><dt className="text-muted-foreground">Distribution Approval</dt><dd className="mt-1">{o.approval ? <StatusPill value={o.approval} /> : "Belum diajukan"}</dd></div>
            <div><dt className="text-muted-foreground">Status order</dt><dd className="mt-1"><StatusPill value={o.status} /></dd></div>
          </dl>
          {!sent && <div className="flex flex-wrap items-center gap-2">
            {o.status === "Draft Order" && <Button variant="outline" onClick={() => submitOrder(o.id)}><Send />Ajukan Approval Distribusi</Button>}
            <Button disabled={readiness !== "Siap Eksekusi"} onClick={() => sendOrder(o.id)}><Truck />Kirim Order</Button>
            {readiness !== "Siap Eksekusi" && <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Lock className="size-3.5" />Order hanya dapat dikirim setelah disetujui di <Link to="/aksi/persetujuan" className="text-primary hover:underline">Persetujuan</Link>.</span>}
          </div>}
        </Box>
        <Box title={`Kanal Tujuan · ${o.channels.filter((c) => c.status === "Selesai").length}/${o.channels.length} selesai`}>
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs">
            <thead className="text-muted-foreground"><tr><th className="py-2 font-medium">Kanal</th><th className="py-2 font-medium">Rekomendasi Tayang</th><th className="py-2 font-medium">Status</th><th className="py-2 font-medium">URL tayang</th><th className="py-2" /></tr></thead>
            <tbody>{o.channels.map((c) => (
              <tr key={c.channel} className="border-t border-border">
                <td className="py-2.5 font-medium">{newsChannelDomain(c.channel)}</td><td className="text-muted-foreground">{c.schedule ?? o.schedule}</td><td><StatusPill value={c.status} /></td>
                <td className="max-w-64 truncate">{c.url ? <a href={c.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{c.url}</a> : "—"}</td>
                <td className="text-right">{c.status === "Menunggu Verifikasi" && <div className="flex justify-end gap-1.5"><Button size="sm" onClick={() => setChannel(o.id, c.channel, "Selesai")}>Verifikasi</Button><Button size="sm" variant="outline" onClick={() => setChannel(o.id, c.channel, "Perlu Revisi")}>Minta Revisi</Button></div>}</td>
              </tr>))}</tbody>
          </table></div>
        </Box>
      </div>
    </PageShell>
  );
}
