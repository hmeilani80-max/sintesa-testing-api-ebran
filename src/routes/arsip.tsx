import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Archive, ArrowDown, Download, ExternalLink, FileText, Lock, Play, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import heroImg from "@/assets/prod-hero.jpg";
import videoImg from "@/assets/prod-video.jpg";
import briefingImg from "@/assets/prod-briefing.jpg";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useArsip } from "@/features/arsip/context";
import { analyzeFieldReport, buildFieldReportItem, COMPLIANCE, JENIS, KLASIFIKASI, MODUL, PROVENANCE, search, suggestForUpload, type AiFieldAnalysis, type ArsipItem, type Filters, type Jenis, type Klasifikasi, type VerificationFinding } from "@/features/arsip/data";

export const Route = createFileRoute("/arsip")({
  head: () => ({
    meta: [
      { title: "Arsip & Pengetahuan — SINTESA" },
      { name: "description", content: "Temukan kembali dokumen, analisis, keputusan, hasil produksi, dan informasi pendukung dari seluruh proses." },
      { property: "og:title", content: "Arsip & Pengetahuan — SINTESA" },
      { property: "og:description", content: "Repositori pengetahuan institusional: asal, versi, pemilik, keputusan, dan hubungan antar-artifact." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Arsip,
});

const ALL: Filters = { jenis: "Semua", modul: "Semua", klasifikasi: "Semua", owner: "Semua" };
const klasTone = (k: Klasifikasi) => (k === "Rahasia" ? "text-chart-4 border-chart-4/40" : k === "Terbatas" ? "text-chart-3 border-chart-3/40" : "text-muted-foreground");

/** Tautan kembali ke artifact asal di modulnya. */
function SourceLink({ item, children }: { item: ArsipItem; children: ReactNode }) {
  const cls = "inline-flex items-center gap-1 text-primary hover:underline";
  switch (item.modul) {
    case "Situasi": return <Link to="/situasi/$slug" params={{ slug: item.ref ?? "demonstrasi-nasional" }} className={cls}>{children}</Link>;
    case "Strategi": return <Link to="/strategi/$slug" params={{ slug: item.ref ?? "" }} className={cls}>{children}</Link>;
    case "Produksi": return <Link to="/aksi/produksi/$id" params={{ id: item.ref ?? "" }} className={cls}>{children}</Link>;
    case "Persetujuan": return <Link to="/aksi/persetujuan/$kind/$id" params={{ kind: "konten", id: item.ref ?? "" }} className={cls}>{children}</Link>;
    case "Distribusi Sosial": return <Link to="/aksi/distribusi-sosial/$id" params={{ id: item.ref ?? "" }} className={cls}>{children}</Link>;
    case "Distribusi News": return <Link to="/aksi/distribusi-news/$id" params={{ id: item.ref ?? "" }} className={cls}>{children}</Link>;
    case "Dampak": return <Link to="/dampak" className={cls}>{children}</Link>;
    default: return <span className="text-muted-foreground">Upload manual</span>;
  }
}

function Arsip() {
  const { items, addItem } = useArsip();
  const [query, setQuery] = useState("");
  const [f, setF] = useState<Filters>(ALL);
  const [open, setOpen] = useState<ArsipItem | null>(null);
  const [choice, setChoice] = useState(false);
  const [upload, setUpload] = useState<null | Jenis>(null);
  const [fieldReport, setFieldReport] = useState(false);
  const results = useMemo(() => search(items, query, f), [items, query, f]);
  const owners = [...new Set(items.map((i) => i.owner))];
  const set = (k: keyof Filters) => (v: string) => setF({ ...f, [k]: v });

  return (
    <PageShell eyebrow="Learn" title="Arsip & Pengetahuan" description="Temukan kembali dokumen, analisis, keputusan, hasil produksi, dan informasi pendukung dari seluruh proses SINTESA."
      actions={<Button onClick={() => setChoice(true)}><Plus />Tambah Data / Dokumen</Button>}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Total Arsip", items.length], ["Dokumen Baru Bulan Ini", items.filter((i) => i.created.includes("Okt")).length], ["Menunggu Submission", COMPLIANCE.filter((c) => c.status !== "Submitted").length], ["Item Terbatas", items.filter((i) => i.klasifikasi !== "Internal").length]].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-border bg-card px-4 py-3"><p className="text-[11px] text-muted-foreground">{l}</p><p className="text-lg font-semibold tabular-nums">{v}</p></div>
        ))}
      </div>

      {/* A. Pencarian Pengetahuan */}
      <section className="mt-5 rounded-lg border border-border bg-card p-5 md:p-7">
        <h2 className="mb-3 text-sm font-semibold">Pencarian Pengetahuan</h2>
        <div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Cari pengetahuan" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari dokumen, situasi, strategi, aktor, narasi, keputusan, atau laporan..." className="h-12 bg-background pl-12" /></div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Coba:</span>{["Demonstrasi Nasional", "sentimen negatif turun 12 poin", "klaim kericuhan belum terverifikasi"].map((q) => <Button key={q} size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setQuery(q)}>{q}</Button>)}
          <span className="ml-auto">Pencarian isi, tag, dan metadata</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <FilterSelect label="Jenis" value={f.jenis} options={JENIS} onChange={set("jenis")} />
          <FilterSelect label="Sumber Modul" value={f.modul} options={MODUL} onChange={set("modul")} />
          <FilterSelect label="Unit / Owner" value={f.owner} options={owners} onChange={set("owner")} />
          <FilterSelect label="Klasifikasi" value={f.klasifikasi} options={KLASIFIKASI} onChange={set("klasifikasi")} />
        </div>
        {query.trim() && (
          <div className="mt-5 grid gap-3">
            <p className="text-xs text-muted-foreground">{results.length} hasil untuk “{query}”</p>
            {results.map((i) => (
              <article key={i.id} className="rounded-md border border-border bg-background/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="text-[10px] font-semibold uppercase text-primary">{i.label} · {i.modul}</p><h3 className="text-sm font-semibold">{i.title}</h3></div>
                  <Badge variant="outline" className={klasTone(i.klasifikasi)}>{i.klasifikasi}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Tanggal: {i.updated} · Versi: {i.version} · Owner: {i.owner}</p>
                <p className="mt-2 text-xs leading-5">{i.canAccess ? i.snippet : "Anda tidak memiliki akses terhadap isi dokumen ini."}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Button size="sm" variant="secondary" onClick={() => setOpen(i)}>Buka</Button>
                  {i.modul !== "Upload Manual" && <Button size="sm" variant="ghost" asChild><SourceLink item={i}>Lihat Sumber</SourceLink></Button>}
                  {i.downloadable && i.canAccess && <Button size="sm" variant="ghost" onClick={() => toast.success(`Unduhan ${i.title} ${i.version} disimulasikan`)}><Download />Download</Button>}
                </div>
              </article>
            ))}
            {!results.length && <Empty />}
          </div>
        )}
      </section>

      {/* B. Repository */}
      <section className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-baseline justify-between border-b border-border px-5 py-4"><h2 className="text-sm font-semibold">Repository</h2><span className="text-[11px] text-muted-foreground">{results.length} item · klik baris untuk detail</span></div>
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead className="text-muted-foreground"><tr className="border-b border-border text-left">{["Nama", "Jenis", "Sumber", "Owner", "Versi", "Klasifikasi", "Update"].map((h) => <th key={h} className="px-5 py-2 font-medium">{h}</th>)}</tr></thead>
          <tbody>{results.map((i) => (
            <tr key={i.id} onClick={() => setOpen(i)} className="cursor-pointer border-b border-border/60 hover:bg-accent/40">
              <td className="px-5 py-2.5 font-medium"><span className="inline-flex items-center gap-2">{!i.canAccess && <Lock className="size-3 text-muted-foreground" />}{i.title}</span></td>
              <td className="px-5 py-2.5">{i.label}</td><td className="px-5 py-2.5 text-muted-foreground">{i.modul}</td><td className="px-5 py-2.5">{i.owner}</td>
              <td className="px-5 py-2.5 tabular-nums">{i.version}</td><td className="px-5 py-2.5"><Badge variant="outline" className={klasTone(i.klasifikasi)}>{i.klasifikasi}</Badge></td>
              <td className="px-5 py-2.5 text-muted-foreground">{i.updated}</td>
            </tr>
          ))}</tbody>
        </table></div>
        {!results.length && <Empty />}
      </section>

      {/* C. Aktivitas & Kepatuhan */}
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Aktivitas Terbaru</h2>
          <ul className="grid gap-2 text-xs">{items.flatMap((i) => i.activity.map((a) => ({ ...a, item: i }))).slice(-7).reverse().map((a, k) => (
            <li key={k} className="flex gap-3"><span className="w-24 shrink-0 text-muted-foreground">{a.at}</span><span><strong className="font-medium">{a.who}</strong> — {a.what} · <button className="text-primary hover:underline" onClick={() => setOpen(a.item)}>{a.item.title} {a.v}</button></span></li>
          ))}</ul>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Kepatuhan Dokumen</h2>
          <ul className="divide-y divide-border text-xs">{COMPLIANCE.map((c) => (
            <li key={c.name} className="flex items-center justify-between py-2"><span>{c.name}</span><Badge variant="outline" className={c.status === "Submitted" ? "text-chart-2" : c.status === "Belum Dikirim" ? "text-chart-4" : "text-chart-3"}>{c.status}</Badge></li>
          ))}</ul>
          <p className="mt-3 text-[11px] text-muted-foreground">Retention mengikuti kebijakan per item: Simpan 5 tahun, Arsip permanen, atau tanggal review.</p>
        </div>
      </section>

      <p className="mt-5 text-center text-[11px] text-muted-foreground">Situasi → Strategi → Produksi → Persetujuan → Distribusi → Dampak → Arsip & Pengetahuan → kembali menjadi input Situasi, Strategi, dan Produksi baru.</p>

      {open && <DetailDialog item={open} items={items} onOpen={setOpen} onClose={() => setOpen(null)} />}
      <ChoiceDialog open={choice} onClose={() => setChoice(false)}
        onPick={(c) => { setChoice(false); if (c === "field") setFieldReport(true); else setUpload(c === "dataset" ? "Dataset" : "Dokumen"); }} />
      <UploadDialog open={!!upload} initialJenis={upload ?? "Dokumen"} onClose={() => setUpload(null)} onSave={(it) => { addItem(it); setUpload(null); toast.success("Tersimpan di Arsip"); }} />
      <FieldReportDialog open={fieldReport} onClose={() => setFieldReport(false)} onSave={(it) => { addItem(it); setFieldReport(false); toast.success("Laporan lapangan tersimpan di Arsip"); }} />
    </PageShell>
  );
}

function Empty() { return <div className="p-10 text-center"><Archive className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm">Tidak ada hasil yang sesuai.</p></div>; }

function VerifGroup({ label, tone, findings, byId, onOpen }: { label: string; tone: string; findings: VerificationFinding[]; byId: (id: string) => ArsipItem | undefined; onOpen: (i: ArsipItem) => void }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className={`text-xs font-semibold ${tone}`}>{label} ({findings.length})</p>
      <ul className="mt-2 space-y-1.5 text-[11px]">
        {findings.length ? findings.map((f, k) => {
          const src = f.sourceId ? byId(f.sourceId) : undefined;
          return <li key={k}>{f.text}{src && <> — <button className="inline-flex items-center gap-1 text-primary hover:underline" onClick={() => onOpen(src)}>buka sumber<ExternalLink className="size-3" /></button></>}</li>;
        }) : <li className="text-muted-foreground">Tidak ada.</li>}
      </ul>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return <div className="grid gap-1"><span className="text-[11px] text-muted-foreground">{label}</span>
    <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="h-9 bg-background"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="Semua">Semua</SelectItem>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>;
}

function Watermark({ k }: { k: Klasifikasi }) {
  if (k === "Internal") return null;
  return <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center text-4xl font-bold tracking-[0.3em] text-foreground/5 -rotate-12">{k.toUpperCase()}</span>;
}

function ContentPreview({ item }: { item: ArsipItem }) {
  if (!item.canAccess) return <div className="grid place-items-center rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground"><Lock className="mb-2 size-5" />Anda tidak memiliki akses terhadap isi dokumen ini.</div>;
  const body = (() => {
    switch (item.preview) {
      case "artikel": return <article><img src={heroImg} alt="Suasana aktivitas publik" className="aspect-video w-full rounded object-cover" /><h3 className="mt-3 text-sm font-semibold">{item.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.snippet}</p></article>;
      case "video": return <div className="relative mx-auto aspect-[9/16] max-w-[200px] overflow-hidden rounded"><img src={videoImg} alt={`Poster ${item.title}`} className="size-full object-cover" /><Play className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2" /></div>;
      case "visual": return <div className="grid grid-cols-3 gap-2">{[heroImg, briefingImg, videoImg].map((s, k) => <img key={k} src={s} alt={`Slide ${k + 1} ${item.title}`} className="aspect-[4/5] w-full rounded object-cover" />)}</div>;
      case "keputusan": return <dl className="grid grid-cols-2 gap-2 text-xs"><dt className="text-muted-foreground">Status</dt><dd className="text-chart-2">Approved ({item.version})</dd><dt className="text-muted-foreground">Approver</dt><dd>{item.owner}</dd><dt className="text-muted-foreground">Catatan</dt><dd>Klarifikasi sudah merujuk sumber resmi.</dd><dt className="text-muted-foreground">Timestamp</dt><dd>{item.versions.at(-1)?.at}</dd></dl>;
      case "strategi": return <div className="text-xs leading-5"><p className="font-semibold">Ringkasan strategi</p><p className="mt-1 text-muted-foreground">{item.snippet}</p><ul className="mt-2 list-disc pl-4"><li>Tujuan: informasi terverifikasi tersedia lebih awal</li><li>Kanal: resmi, sosial, jaringan news</li><li>Rencana aksi: artikel, carousel, video</li></ul></div>;
      case "laporan": return <div className="text-xs leading-5"><p className="text-[10px] font-semibold uppercase text-primary">Ringkasan Pimpinan</p><p className="mt-1 font-semibold">{item.title}</p><p className="mt-2 text-muted-foreground">{item.snippet}</p><p className="mt-2 text-[11px] text-muted-foreground">Perubahan dicatat pada periode yang sama, bukan klaim sebab-akibat.</p></div>;
      default: return <div className="text-xs leading-5"><FileText className="mb-2 size-5 text-primary" /><p className="font-semibold">{item.title}</p><p className="mt-1 text-muted-foreground">{item.snippet}</p></div>;
    }
  })();
  return <div className="relative overflow-hidden rounded-md border border-border bg-background p-4"><Watermark k={item.klasifikasi} />{body}</div>;
}

function DetailDialog({ item, items, onOpen, onClose }: { item: ArsipItem; items: ArsipItem[]; onOpen: (i: ArsipItem) => void; onClose: () => void }) {
  const [ver, setVer] = useState(item.version);
  const byId = (id: string) => items.find((i) => i.id === id);
  const related = item.related.map(byId).filter((x): x is ArsipItem => !!x);
  const words = new Set(item.content.split(/\s+/).filter((w) => w.length > 4));
  const suggested = items.filter((i) => i.id !== item.id && !item.related.includes(i.id))
    .map((i) => ({ i, s: i.content.split(/\s+/).filter((w) => words.has(w)).length }))
    .filter((x) => x.s > 1).sort((a, b) => b.s - a.s).slice(0, 4).map((x) => x.i);
  const reuse = (a: string) => toast.success(`${a}: ${item.title} ${item.version} ditautkan sebagai referensi (bukan salinan baru)`);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{item.title}</DialogTitle><DialogDescription>{item.label} · {item.modul} · {item.version}</DialogDescription></DialogHeader>
        <Tabs defaultValue="info">
          <TabsList><TabsTrigger value="info">Informasi</TabsTrigger><TabsTrigger value="versi">Versi</TabsTrigger><TabsTrigger value="aktivitas">Riwayat Aktivitas</TabsTrigger><TabsTrigger value="akses">Akses</TabsTrigger></TabsList>
          <TabsContent value="info" className="grid gap-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs md:grid-cols-3">
              {[["Jenis", item.label], ["Owner", item.owner], ["Unit", item.unit], ["Dibuat", item.created], ["Update terakhir", item.updated], ["Versi", item.version], ["Klasifikasi", item.klasifikasi], ["Retention", item.retention]].map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}
            </dl>
            <div><h3 className="mb-2 text-xs font-semibold">Preview Konten</h3><ContentPreview item={item} /></div>
            {item.verification && (
              <div>
                <h3 className="mb-2 text-xs font-semibold">Verifikasi & Keterkaitan Sumber</h3>
                <p className="mb-2 text-[11px] text-muted-foreground">Laporan/data internal tidak secara otomatis dianggap sebagai fakta yang sudah terverifikasi — status berikut adalah hasil perbandingan dengan sumber lain.</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <VerifGroup label="Didukung sumber lain" tone="text-chart-2" findings={item.verification.supported} byId={byId} onOpen={onOpen} />
                  <VerifGroup label="Berbeda / bertentangan" tone="text-chart-4" findings={item.verification.conflicting} byId={byId} onOpen={onOpen} />
                  <VerifGroup label="Belum terverifikasi" tone="text-chart-3" findings={item.verification.unverified} byId={byId} onOpen={onOpen} />
                </div>
                {item.verification.situationRef && <p className="mt-2 text-xs"><Link to="/situasi/$slug" params={{ slug: item.verification.situationRef }} className="inline-flex items-center gap-1 text-primary hover:underline">Lihat Situasi terkait<ExternalLink className="size-3" /></Link></p>}
              </div>
            )}
            <div><h3 className="mb-2 text-xs font-semibold">Provenance / Asal Informasi</h3>
              <ol className="grid gap-1 text-xs">{PROVENANCE.map((p, k) => { const node = byId(p.id)!; return (
                <li key={p.id} className="grid justify-items-start gap-1">
                  <button onClick={() => onOpen(node)} className={`rounded border px-3 py-1.5 text-left ${node.id === item.id ? "border-brand bg-brand/10" : "border-border hover:bg-accent/40"}`}><span className="text-[10px] text-muted-foreground">{p.modul}</span><br />{node.title}</button>
                  {k < PROVENANCE.length - 1 && <ArrowDown className="ml-4 size-3 text-muted-foreground" />}
                </li>); })}</ol>
              {item.modul !== "Upload Manual" && <p className="mt-2 text-xs"><SourceLink item={item}>Buka artifact asal di {item.modul}<ExternalLink className="size-3" /></SourceLink></p>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><h3 className="mb-2 text-xs font-semibold">Terkait dengan</h3><ul className="grid gap-1 text-xs">{related.map((r) => <li key={r.id}><button className="text-primary hover:underline" onClick={() => onOpen(r)}>{r.modul}: {r.title}</button></li>)}</ul></div>
              <div><h3 className="mb-2 flex items-center gap-1 text-xs font-semibold"><Sparkles className="size-3 text-primary" />Pengetahuan Terkait</h3><ul className="grid gap-1 text-xs">{suggested.length ? suggested.map((r) => <li key={r.id}><button className="text-primary hover:underline" onClick={() => onOpen(r)}>{r.title}</button></li>) : <li className="text-muted-foreground">Belum ada saran.</li>}</ul></div>
            </div>
            <div><h3 className="mb-2 text-xs font-semibold">Gunakan Ulang</h3><div className="flex flex-wrap gap-2">
              {["Gunakan sebagai Referensi Strategi", "Gunakan sebagai Sumber Produksi", "Gunakan untuk Laporan"].map((a) => <Button key={a} size="sm" variant="outline" disabled={!item.canAccess} onClick={() => reuse(a)}>{a}</Button>)}
              <Button size="sm" variant="outline" asChild><Link to="/situasi/$slug" params={{ slug: "demonstrasi-nasional" }}>Buka Situasi Terkait</Link></Button>
            </div></div>
          </TabsContent>
          <TabsContent value="versi">
            <ol className="grid gap-2 text-xs">{item.versions.map((v) => (
              <li key={v.v}><button onClick={() => setVer(v.v)} className={`w-full rounded border px-3 py-2 text-left ${ver === v.v ? "border-brand bg-brand/10" : "border-border hover:bg-accent/40"}`}>
                <strong>{v.v}</strong> · {v.label} · <span className="text-muted-foreground">{v.at}</span>{v.note && <p className="text-muted-foreground">{v.note}</p>}</button></li>
            ))}</ol>
            <p className="mt-3 text-[11px] text-muted-foreground">Menampilkan {ver}{ver !== item.version ? " (versi lama, hanya-baca)" : " (versi terkini)"}.</p>
          </TabsContent>
          <TabsContent value="aktivitas">
            <table className="w-full text-xs"><thead className="text-muted-foreground"><tr className="border-b border-border text-left"><th className="py-2 font-medium">Kapan</th><th className="py-2 font-medium">Siapa</th><th className="py-2 font-medium">Melakukan apa</th><th className="py-2 font-medium">Versi</th></tr></thead>
              <tbody>{item.activity.map((a, k) => <tr key={k} className="border-b border-border/60"><td className="py-2 text-muted-foreground">{a.at}</td><td className="py-2">{a.who}</td><td className="py-2">{a.what}</td><td className="py-2">{a.v}</td></tr>)}</tbody></table>
          </TabsContent>
          <TabsContent value="akses" className="text-xs">
            <p>Klasifikasi: <Badge variant="outline" className={klasTone(item.klasifikasi)}>{item.klasifikasi}</Badge></p>
            <p className="mt-3 font-medium">Akses:</p><ul className="mt-1 list-disc pl-4">{item.access.map((a) => <li key={a}>{a}</li>)}</ul>
            <p className="mt-3">Status akses Anda: {item.canAccess ? <span className="text-chart-2">Diizinkan</span> : <span className="text-chart-4">Anda tidak memiliki akses terhadap isi dokumen ini.</span>}</p>
            <p className="mt-1">Download: {item.downloadable && item.canAccess ? "Diizinkan" : "Tidak diizinkan"}</p>
            <p className="mt-3 text-muted-foreground">Retention: {item.retention}</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({ open, initialJenis, onClose, onSave }: { open: boolean; initialJenis: Jenis; onClose: () => void; onSave: (i: ArsipItem) => void }) {
  const empty = { file: "", title: "", jenis: initialJenis, owner: "", klas: "Internal" as Klasifikasi, tags: "", desc: "" };
  const [d, setD] = useState(empty);
  const [confirmRel, setConfirmRel] = useState(true);
  const s = suggestForUpload(`${d.title} ${d.desc}`);
  const save = () => {
    const tags = d.tags ? d.tags.split(",").map((t) => t.trim()).filter(Boolean) : s.tags;
    onSave({
      id: `ARS-${Date.now()}`, title: d.title, jenis: d.jenis, label: d.jenis, modul: "Upload Manual", owner: d.owner || "Pengguna", unit: d.owner || "Pengguna",
      created: "9 Okt 2026", updated: "9 Okt 2026", version: "v1", klasifikasi: d.klas, retention: "Simpan 5 tahun", access: ["Direktorat terkait"], canAccess: true, downloadable: true,
      tags, snippet: d.desc || s.summary, content: `${d.title} ${d.desc} ${tags.join(" ")}`, preview: "dokumen",
      related: confirmRel && s.related.length ? ["ARS-001", "ARS-002"] : [],
      versions: [{ v: "v1", label: "Diunggah", at: "9 Okt · sekarang", note: d.file }], activity: [{ who: d.owner || "Pengguna", what: "Dokumen diunggah", at: "9 Okt · sekarang", v: "v1" }],
    });
    setD(empty);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initialJenis === "Dataset" ? "Unggah Dataset" : "Unggah Dokumen"}</DialogTitle><DialogDescription>Unggah {initialJenis === "Dataset" ? "dataset" : "dokumen"} resmi/manual ke repository.</DialogDescription></DialogHeader>
        <div className="grid gap-3 text-xs">
          <div className="grid gap-1"><Label htmlFor="up-file">File</Label><Input id="up-file" type="file" onChange={(e) => setD({ ...d, file: e.target.files?.[0]?.name ?? "", title: d.title || (e.target.files?.[0]?.name.replace(/\.[^.]+$/, "") ?? "") })} /></div>
          <div className="grid gap-1"><Label htmlFor="up-title">Judul</Label><Input id="up-title" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1"><Label>Jenis</Label><Select value={d.jenis} onValueChange={(v) => setD({ ...d, jenis: v as Jenis })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{JENIS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-1"><Label>Klasifikasi</Label><Select value={d.klas} onValueChange={(v) => setD({ ...d, klas: v as Klasifikasi })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{KLASIFIKASI.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="grid gap-1"><Label htmlFor="up-owner">Owner / Unit</Label><Input id="up-owner" value={d.owner} onChange={(e) => setD({ ...d, owner: e.target.value })} /></div>
          <div className="grid gap-1"><Label htmlFor="up-tags">Tag (pisahkan koma)</Label><Input id="up-tags" value={d.tags} placeholder={`Saran: ${s.tags.join(", ")}`} onChange={(e) => setD({ ...d, tags: e.target.value })} /></div>
          <div className="grid gap-1"><Label htmlFor="up-desc">Deskripsi singkat</Label><Textarea id="up-desc" rows={2} value={d.desc} onChange={(e) => setD({ ...d, desc: e.target.value })} /></div>
          {(d.title || d.desc) && <div className="rounded-md border border-border bg-background/50 p-3">
            <p className="flex items-center gap-1 font-medium"><Sparkles className="size-3 text-primary" />Bantuan sistem</p>
            <p className="mt-1 text-muted-foreground">{s.summary}</p>
            {s.related.length > 0 && <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={confirmRel} onChange={(e) => setConfirmRel(e.target.checked)} />Related to: {s.related.join(" · ")}</label>}
          </div>}
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Batal</Button><Button disabled={!d.title.trim()} onClick={save}>Simpan ke Arsip</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceDialog({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (c: "doc" | "field" | "dataset") => void }) {
  const opts: { key: "doc" | "field" | "dataset"; title: string; desc: string }[] = [
    { key: "doc", title: "Unggah Dokumen", desc: "Dokumen resmi atau file manual lainnya." },
    { key: "field", title: "Input Laporan Lapangan", desc: "Laporan pengamatan langsung dengan bantuan AI." },
    { key: "dataset", title: "Unggah Dataset", desc: "Data terstruktur (ekspor/CSV, dsb.)." },
  ];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Tambah Data / Dokumen</DialogTitle><DialogDescription>Pilih jenis data yang ingin ditambahkan ke Arsip & Pengetahuan.</DialogDescription></DialogHeader>
        <div className="grid gap-2">
          {opts.map((o) => (
            <button key={o.key} onClick={() => onPick(o.key)} className="rounded-md border border-border p-3 text-left text-sm hover:border-brand hover:bg-accent/40">
              <p className="font-medium">{o.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{o.desc}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldReportDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (i: ArsipItem) => void }) {
  const empty = { title: "", content: "", fileName: "", date: "", location: "", klas: "Internal" as Klasifikasi };
  const [d, setD] = useState(empty);
  const ready = d.title.trim() && (d.content.trim() || d.fileName);
  const ai: AiFieldAnalysis | null = ready ? analyzeFieldReport({ title: d.title, content: d.content, location: d.location, date: d.date }) : null;
  const save = () => {
    if (!ai) return;
    onSave(buildFieldReportItem({ title: d.title, content: d.content, fileName: d.fileName, date: d.date, location: d.location, klasifikasi: d.klas }, ai));
    setD(empty);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader><DialogTitle>Input Laporan Lapangan</DialogTitle><DialogDescription>Owner/unit terisi otomatis berdasarkan pengguna yang login (simulasi).</DialogDescription></DialogHeader>
        <div className="grid gap-3 text-xs">
          <div className="grid gap-1"><Label htmlFor="fr-title">Judul laporan</Label><Input id="fr-title" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></div>
          <div className="grid gap-1"><Label htmlFor="fr-content">Isi laporan</Label><Textarea id="fr-content" rows={3} value={d.content} onChange={(e) => setD({ ...d, content: e.target.value })} placeholder="Tulis isi laporan, atau unggah file di bawah." /></div>
          <div className="grid gap-1"><Label htmlFor="fr-file">Atau unggah file</Label><Input id="fr-file" type="file" onChange={(e) => setD({ ...d, fileName: e.target.files?.[0]?.name ?? "" })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1"><Label htmlFor="fr-date">Tanggal kejadian</Label><Input id="fr-date" type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} /></div>
            <div className="grid gap-1"><Label htmlFor="fr-loc">Lokasi</Label><Input id="fr-loc" value={d.location} onChange={(e) => setD({ ...d, location: e.target.value })} /></div>
          </div>
          <div className="grid gap-1"><Label>Klasifikasi</Label><Select value={d.klas} onValueChange={(v) => setD({ ...d, klas: v as Klasifikasi })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{KLASIFIKASI.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select></div>
          <p className="text-[11px] text-muted-foreground">Owner/unit otomatis: <strong>Anda (Petugas Lapangan) · Direktorat Analisis</strong>.</p>
          {ai && <div className="rounded-md border border-primary/30 bg-background/50 p-3">
            <p className="flex items-center gap-1 font-medium"><Sparkles className="size-3 text-primary" />Bantuan AI (simulasi)</p>
            <p className="mt-1 text-muted-foreground">{ai.summary}</p>
            <dl className="mt-2 grid grid-cols-2 gap-1"><dt className="text-muted-foreground">Aktor</dt><dd>{ai.actors.join(", ")}</dd><dt className="text-muted-foreground">Lokasi/Waktu</dt><dd>{ai.location} · {ai.time}</dd><dt className="text-muted-foreground">Isu</dt><dd>{ai.issues.join(", ")}</dd><dt className="text-muted-foreground">Tag rekomendasi</dt><dd>{ai.tags.join(", ")}</dd><dt className="text-muted-foreground">Situasi relevan</dt><dd>{ai.relatedSituation}</dd></dl>
            <p className="mt-2 font-medium">Perbandingan dengan sumber lain</p>
            <ul className="mt-1 space-y-0.5">{ai.comparison.map((c) => <li key={c.label}><strong>{c.label}:</strong> {c.result}</li>)}</ul>
            <p className="mt-2 text-[11px] text-chart-3">Laporan ini akan tersimpan sebagai "belum terverifikasi" sampai ada proses verifikasi silang.</p>
          </div>}
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Batal</Button><Button disabled={!ready} onClick={save}>Simpan ke Arsip</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
