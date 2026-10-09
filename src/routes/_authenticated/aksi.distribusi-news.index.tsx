import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Sparkles } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusPill, Stat, Trail } from "@/features/aksi/components";
import { findOutput, useAksi } from "@/features/aksi/context";
import { deadlineFor, isEligible, NATIONAL_CHANNEL, NEWS_CHANNELS, newsChannelDomain, recommendedScheduleFor, REGIONAL_CHANNELS, type NewsStatus } from "@/features/aksi/data";
import { aksiHead } from "@/features/aksi/meta";

export const Route = createFileRoute("/aksi/distribusi-news/")({
  head: aksiHead("Distribusi News", "Order distribusi konten News ke jaringan 38 kanal wilayah dan 1 kanal nasional."),
  component: DistribusiNews,
});

function DistribusiNews() {
  const { orders } = useAksi();
  return (
    <PageShell eyebrow="Aksi" title="Distribusi News" description="SINTESA membuat order, pengelola kanal menerima dan mempublikasikan, lalu mengirim URL tayang untuk diverifikasi.">
      <Trail items={["Aksi", "Distribusi News"]} />
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Stat value="39" label="Kanal jaringan (38 wilayah + 1 nasional)" />
        <Stat value={orders.length} label="Order distribusi" />
        <Stat value={orders.filter((o) => o.status === "Menunggu Approval").length} label="Menunggu approval" />
        <Stat value={orders.flatMap((o) => o.channels).filter((c) => c.status === "Menunggu Verifikasi").length} label="URL menunggu verifikasi" />
      </div>
      <Tabs defaultValue="pemesan">
        <TabsList className="mb-4"><TabsTrigger value="pemesan">View Pemesan</TabsTrigger><TabsTrigger value="penerima">View Penerima Kanal</TabsTrigger></TabsList>
        <TabsContent value="pemesan"><Pemesan /></TabsContent>
        <TabsContent value="penerima"><Penerima /></TabsContent>
      </Tabs>
    </PageShell>
  );
}

function Pemesan() {
  const { orders, productions, createOrder } = useAksi();
  const navigate = useNavigate();
  const eligible = productions.filter((o) => isEligible(o, "News")).map((o) => ({ p: o, o }));
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [channels, setChannels] = useState<string[]>([NATIONAL_CHANNEL]);
  const [schedule, setSchedule] = useState("Besok, 07:00 WIB");
  const [channelSchedules, setChannelSchedules] = useState<Record<string, string>>({});
  const flip = (v: string) => setChannels((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  const applyRecommended = () => setChannelSchedules(Object.fromEntries(channels.map((c) => [c, recommendedScheduleFor(c)])));

  return <>
    <div className="mb-3 flex justify-end">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button><Plus />Buat Order Distribusi</Button></DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Buat Order Distribusi</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5"><Label>Approved News Content</Label>
              <Select value={content} onValueChange={setContent}><SelectTrigger aria-label="Konten"><SelectValue placeholder={eligible.length ? "Pilih konten" : "Belum ada konten News yang disetujui"} /></SelectTrigger>
                <SelectContent>{eligible.map(({ p, o }) => <SelectItem key={o.id} value={o.id}>{o.type} v{o.version} · {p.title}</SelectItem>)}</SelectContent></Select></div>
            <div>
              <div className="mb-2 flex items-center justify-between"><p className="text-xs font-medium">Kanal tujuan · {channels.length} dipilih</p><Button size="sm" variant="ghost" onClick={() => setChannels(channels.length === NEWS_CHANNELS.length ? [] : NEWS_CHANNELS)}>{channels.length === NEWS_CHANNELS.length ? "Kosongkan" : "Pilih semua 39"}</Button></div>
              <label className="mb-2 flex items-center gap-2 text-xs font-medium"><Checkbox checked={channels.includes(NATIONAL_CHANNEL)} onCheckedChange={() => flip(NATIONAL_CHANNEL)} />{newsChannelDomain(NATIONAL_CHANNEL)}</label>
              <div className="grid max-h-56 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-border p-2 sm:grid-cols-3">{REGIONAL_CHANNELS.map((r) => <label key={r} className="flex items-center gap-2 text-xs"><Checkbox checked={channels.includes(r)} onCheckedChange={() => flip(r)} /><span className="truncate" title={newsChannelDomain(r)}>{newsChannelDomain(r)}</span></label>)}</div>
            </div>
            <div className="grid gap-1.5"><Label htmlFor="sch">Jadwal tayang (umum)</Label><Input id="sch" value={schedule} onChange={(e) => setSchedule(e.target.value)} /></div>
            <div>
              <div className="mb-2 flex items-center justify-between"><p className="text-xs font-medium">Rekomendasi Jadwal Tayang per Wilayah</p><Button size="sm" variant="outline" onClick={applyRecommended}><Sparkles />Terapkan Rekomendasi ke Semua Kanal</Button></div>
              <p className="mb-2 text-[11px] text-muted-foreground">Berdasarkan wilayah kanal, zona waktu setempat, pola kunjungan audiens, jenis artikel, dan SLA kanal — estimasi berbasis data simulasi pada PoC.</p>
              <div className="max-h-40 overflow-y-auto rounded-md border border-border">
                <table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th className="px-2 py-1.5 font-medium">Kanal</th><th className="px-2 py-1.5 font-medium">Rekomendasi Tayang</th></tr></thead>
                  <tbody>{channels.map((c) => <tr key={c} className="border-t border-border"><td className="px-2 py-1.5">{newsChannelDomain(c)}</td><td className="px-2 py-1.5">{channelSchedules[c] ?? recommendedScheduleFor(c)}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter><Button disabled={!content || !channels.length} onClick={() => { const pr = findOutput(productions, content); if (!pr) return; const chans = channels.map((c) => ({ channel: c, schedule: channelSchedules[c] ?? recommendedScheduleFor(c) })); const id = createOrder({ productionId: pr.production.id, contentId: content, channels: chans, schedule, deadline: deadlineFor(channels[0] ?? NATIONAL_CHANNEL), notes: "" }); setOpen(false); navigate({ to: "/aksi/distribusi-news/$id", params: { id } }); }}>Buat Order</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Order</th><th className="px-4 py-3 font-medium">Konten</th><th className="px-4 py-3 font-medium">Kanal</th><th className="px-4 py-3 font-medium">Progres</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
        <tbody>{orders.map((o) => (
          <tr key={o.id} className="border-b border-border last:border-0 hover:bg-accent/40">
            <td className="px-4 py-3"><Link to="/aksi/distribusi-news/$id" params={{ id: o.id }} className="font-medium hover:underline">Order {o.id}</Link><span className="block text-[10px] text-muted-foreground">{o.schedule}</span></td>
            <td className="px-4 py-3">{findOutput(productions, o.contentId)?.output.type ?? "—"}</td>
            <td className="px-4 py-3">{o.channels.length} kanal</td>
            <td className="px-4 py-3 text-muted-foreground">{o.channels.filter((c) => c.status === "Selesai").length}/{o.channels.length} selesai</td>
            <td className="px-4 py-3"><StatusPill value={o.status} /></td>
          </tr>))}</tbody>
      </table>
    </div>
  </>;
}

function Penerima() {
  const { orders, productions, setChannel } = useAksi();
  const sent = orders.filter((o) => o.approval === "Disetujui" && o.status !== "Approved");
  const channelOptions = Array.from(new Set(sent.flatMap((o) => o.channels.map((c) => c.channel))));
  const [channel, setCh] = useState(channelOptions[0] ?? "Jawa Barat");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const inbox = sent.flatMap((o) => o.channels.filter((c) => c.channel === channel).map((c) => ({ o, c })));
  const act = (id: string, status: NewsStatus, url?: string) => setChannel(id, channel, status, url);

  return <>
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs"><span className="text-muted-foreground">Masuk sebagai pengelola kanal</span>
      <Select value={channel} onValueChange={setCh}><SelectTrigger aria-label="Kanal" className="w-[250px]"><SelectValue>{newsChannelDomain(channel)}</SelectValue></SelectTrigger><SelectContent>{channelOptions.map((c) => <SelectItem key={c} value={c}>{newsChannelDomain(c)}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid gap-3">
      {!inbox.length && <p className="rounded-lg border border-border bg-card p-6 text-center text-xs text-muted-foreground">Tidak ada order masuk untuk kanal ini.</p>}
      {inbox.map(({ o, c }) => (
        <section key={o.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div><p className="text-[11px] text-muted-foreground">Order {o.id} · Rekomendasi tayang: {c.schedule ?? o.schedule}{o.deadline ? ` · Deadline: ${o.deadline}` : ""}</p><h3 className="text-sm font-semibold">{findOutput(productions, o.contentId)?.output.type} · {productions.find((p) => p.id === o.productionId)?.title}</h3>{c.url && <p className="mt-1 truncate text-[11px] text-primary">{c.url}</p>}</div>
          <div className="flex flex-wrap items-center gap-2"><StatusPill value={c.status} />
            {c.status === "Dikirim" && <><Button size="sm" onClick={() => act(o.id, "Diterima Kanal")}>Terima</Button><Button size="sm" variant="ghost" onClick={() => act(o.id, "Ditolak")}>Tolak</Button></>}
            {(c.status === "Diterima Kanal" || c.status === "Perlu Revisi") && <Button size="sm" onClick={() => act(o.id, "Dalam Pengerjaan")}>Mulai Pengerjaan</Button>}
            {c.status === "Dalam Pengerjaan" && <Button size="sm" onClick={() => act(o.id, "Tayang")}>Tandai Tayang</Button>}
            {c.status === "Tayang" && <><Input aria-label="URL tayang" className="h-8 w-72" placeholder={`https://${newsChannelDomain(channel)}/berita/…`} value={urls[o.id] ?? ""} onChange={(e) => setUrls({ ...urls, [o.id]: e.target.value })} /><Button size="sm" disabled={!urls[o.id]?.startsWith("http")} onClick={() => act(o.id, "Menunggu Verifikasi", urls[o.id])}>Submit URL</Button></>}
          </div>
        </section>))}
    </div>
  </>;
}
