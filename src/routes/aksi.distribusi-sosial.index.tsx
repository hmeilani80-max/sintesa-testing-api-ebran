import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { StatusPill, Stat, Trail } from "@/features/aksi/components";
import { useAksi } from "@/features/aksi/context";
import { aksiHead } from "@/features/aksi/meta";
import { dayList, periodLabel, SOCIAL_PLATFORMS } from "@/features/aksi/sosial";
import { selectCls } from "@/features/aksi/sosial-components";

export const Route = createFileRoute("/aksi/distribusi-sosial/")({
  head: aksiHead("Distribusi Sosial", "Kelola penyebaran konten yang telah disetujui ke akun media sosial yang terhubung."),
  component: DistribusiSosial,
});

const STATUSES = ["Draft", "Menunggu Persetujuan", "Perlu Perubahan", "Dijadwalkan", "Sedang Berjalan", "Selesai", "Ditolak", "Dibatalkan"];

function DistribusiSosial() {
  const { campaigns, productions } = useAksi();
  const navigate = useNavigate();
  const [f, setF] = useState({ status: "", platform: "", date: "", content: "" });
  const contentLabel = (ids: string[]) => {
    const types = ids.map((id) => productions.find((p) => p.id === id)?.type);
    return ids.length === 1 && types[0] === "Video Pendek" ? "1 video" : `${ids.length} asset`;
  };
  const dates = [...new Set(campaigns.flatMap((c) => dayList(c.timing)))].sort();
  const sources = productions.filter((p) => campaigns.some((c) => c.contentIds.includes(p.id)));
  const list = campaigns.filter((c) => (!f.status || c.status === f.status) && (!f.platform || c.platforms.includes(f.platform)) && (!f.date || dayList(c.timing).includes(f.date)) && (!f.content || c.contentIds.includes(f.content)));
  const count = (s: string) => campaigns.filter((c) => c.status === s).length;

  return (
    <PageShell eyebrow="Aksi" title="Distribusi Sosial" description="Kelola penyebaran konten yang telah disetujui ke akun media sosial yang terhubung."
      actions={<Button asChild><Link to="/aksi/distribusi-sosial/baru"><Plus />Buat Distribusi</Link></Button>}>
      <Trail items={["Aksi", "Distribusi Sosial"]} />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {["Draft", "Menunggu Persetujuan", "Dijadwalkan", "Sedang Berjalan", "Selesai"].map((s) => <Stat key={s} value={count(s)} label={s} />)}
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <select aria-label="Status" className={selectCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">Status: Semua</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Platform" className={selectCls} value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })}><option value="">Platform: Semua</option>{SOCIAL_PLATFORMS.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Tanggal" className={selectCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })}><option value="">Tanggal: Semua</option>{dates.map((d) => <option key={d} value={d}>{periodLabel({ start: d, end: d })}</option>)}</select>
        <select aria-label="Konten sumber" className={selectCls} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })}><option value="">Konten sumber: Semua</option>{sources.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Nama Distribusi</th><th className="px-4 py-3 font-medium">Konten</th><th className="px-4 py-3 font-medium">Platform</th><th className="px-4 py-3 text-right font-medium">Akun</th><th className="px-4 py-3 font-medium">Periode</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
          <tbody>{list.map((c) => (
            <tr key={c.id} onClick={() => navigate({ to: "/aksi/distribusi-sosial/$id", params: { id: c.id } })} className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/40">
              <td className="px-4 py-3"><Link to="/aksi/distribusi-sosial/$id" params={{ id: c.id }} className="font-medium hover:underline">{c.name}</Link><span className="block text-[10px] text-muted-foreground">{c.id}</span></td>
              <td className="px-4 py-3">{contentLabel(c.contentIds)}</td><td className="px-4 py-3">{c.platforms.join(", ")}</td><td className="px-4 py-3 text-right">{c.accounts.length}</td>
              <td className="px-4 py-3 text-muted-foreground">{periodLabel(c.timing)}</td><td className="px-4 py-3"><StatusPill value={c.status} /></td>
            </tr>))}
            {!list.length && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Tidak ada distribusi yang cocok dengan filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
