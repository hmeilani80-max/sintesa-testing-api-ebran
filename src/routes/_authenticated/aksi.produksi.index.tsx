import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, Sparkles, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill, Stat, Trail } from "@/features/aksi/components";
import { useAksi, type Origin } from "@/features/aksi/context";
import { approvalLabel, DEMO_BRIEF, OUTPUT_TYPES, STYLE_OPTIONS, type OutputType, type ProductionBrief } from "@/features/aksi/data";
import { aksiHead } from "@/features/aksi/meta";
import { getAiProviderStatus, verifyAiProvider } from "@/features/aksi/ai-model-hub.functions";
import { useStrategies } from "@/features/strategi/context";
import type { Strategy } from "@/features/strategi/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/aksi/produksi/")({
  head: aksiHead("Produksi", "Kelola pembuatan konten berbasis strategi dan brief, dari generation hingga siap diajukan untuk persetujuan."),
  component: Produksi,
});

const FAMILIES = ["Semua Tipe", "News", "Visual", "Video", "Audio"] as const;
const STATUSES = ["Semua Status", "Draft", "Generating", "Generated", "Belum Diajukan", "Menunggu Review", "Perlu Revisi", "Approved"];

function briefFromStrategy(s: Strategy): ProductionBrief {
  if (s.situationSlug === "demonstrasi-nasional") return { ...DEMO_BRIEF, theme: s.title };
  return { theme: s.title, message: s.objective, points: [s.context, s.audience && `Audiens: ${s.audience}`, s.region && `Wilayah: ${s.region}`].filter((x): x is string => !!x), style: ["Faktual", "Informatif"], audience: s.audience, region: s.region, channels: s.platforms };
}
const EMPTY_BRIEF: ProductionBrief = { theme: "", message: "", points: [], style: [] };

function Produksi() {
  const { productions, createProductions } = useAksi();
  const { strategies, handoffs } = useStrategies();
  const navigate = useNavigate();
  const [family, setFamily] = useState<(typeof FAMILIES)[number]>("Semua Tipe");
  const [status, setStatus] = useState("Semua Status");
  const [source, setSource] = useState("Semua Sumber");

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [origin, setOrigin] = useState<Origin>({ source: "Manual" });
  const [brief, setBrief] = useState<ProductionBrief>(EMPTY_BRIEF);
  const [types, setTypes] = useState<OutputType[]>([]);
  const [models, setModels] = useState<Record<"News" | "Visual" | "Video" | "Audio", string>>({
    News: "gemini-2.5-flash", Visual: "visual-current", Video: "gemini-2.5-flash", Audio: "gemini-2.5-flash",
  });
  const [modelDialog, setModelDialog] = useState(false);
  const [modelFamily, setModelFamily] = useState<"News" | "Visual" | "Video" | "Audio">("News");
  const [provider, setProvider] = useState("Gemini");
  const [providerModel, setProviderModel] = useState("gemini-2.5-flash");
  const [providerStatus, setProviderStatus] = useState<Awaited<ReturnType<typeof getAiProviderStatus>> | null>(null);
  const [verification, setVerification] = useState<{ ok: boolean; status: string; message: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const start = (s?: Strategy) => {
    setOpen(true); setTypes([]);
    if (s) { setOrigin({ source: "Strategi", strategySlug: s.slug, strategyTitle: s.title, situationSlug: s.situationSlug, situationName: s.situationName }); setBrief(briefFromStrategy(s)); setStep(2); }
    else { setOrigin({ source: "Manual" }); setBrief(EMPTY_BRIEF); setStep(1); }
  };
  const pickStrategy = (slug: string) => { const s = strategies.find((x) => x.slug === slug); if (s) start(s); };
  const generate = () => { createProductions(brief, types, origin); setOpen(false); };

  const rows = productions.filter((p) => (family === "Semua Tipe" || p.family === family) && (source === "Semua Sumber" || p.source === source) && (status === "Semua Status" || p.status === status || approvalLabel(p.approval) === status));
  const pending = handoffs.filter((h) => !productions.some((p) => p.strategySlug === h.strategySlug));

  return (
    <PageShell eyebrow="Aksi" title="Produksi" description="Kelola pembuatan konten berbasis strategi dan brief, dari generation hingga siap diajukan untuk persetujuan." actions={<Button onClick={() => start()}><Plus />Buat Produksi</Button>}>
      <Trail items={["Aksi", "Produksi"]} />
      <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Stat value={productions.length} label="Item produksi" />
        <Stat value={productions.filter((p) => p.status === "Generating").length} label="Sedang di-generate" />
        <Stat value={productions.filter((p) => p.approval === "Menunggu").length} label="Menunggu review" />
        <Stat value={productions.filter((p) => p.approval === "Disetujui").length} label="Approved, siap distribusi" />
      </div>

      {pending.map((h) => (
        <section key={h.strategySlug} className="mb-4 flex flex-col gap-3 rounded-lg border border-primary/40 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[11px] font-semibold uppercase text-primary">Brief baru dari Strategi</p><h2 className="mt-1 text-sm font-semibold">{h.title}</h2><p className="mt-1 text-xs text-muted-foreground">Brief terisi otomatis — cukup pilih output lalu Generate.</p></div>
          <Button onClick={() => pickStrategy(h.strategySlug)}><Sparkles />Mulai Produksi</Button>
        </section>
      ))}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">{FAMILIES.map((f) => <Button key={f} size="sm" variant={family === f ? "secondary" : "ghost"} className={cn(family === f && "border border-border")} onClick={() => setFamily(f)}>{f}</Button>)}</div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Status" className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={source} onValueChange={setSource}><SelectTrigger aria-label="Sumber" className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger><SelectContent>{["Semua Sumber", "Strategi", "Manual"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-border text-muted-foreground"><tr>{["Judul", "Tipe", "Sumber", "Status Produksi", "Approval", "Tujuan"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{rows.map((p) => (
            <tr key={p.id} tabIndex={0} onClick={() => navigate({ to: "/aksi/produksi/$id", params: { id: p.id } })} onKeyDown={(e) => e.key === "Enter" && navigate({ to: "/aksi/produksi/$id", params: { id: p.id } })} className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/40">
              <td className="px-4 py-3"><span className="font-medium">{p.title}</span><span className="block text-[10px] text-muted-foreground">{p.id}{p.version ? ` · v${p.version}` : ""}</span></td>
              <td className="px-4 py-3">{p.type}</td>
              <td className="px-4 py-3">{p.source}</td>
              <td className="px-4 py-3"><StatusPill value={p.status} /></td>
              <td className="px-4 py-3"><StatusPill value={approvalLabel(p.approval)} /></td>
              <td className="px-4 py-3 text-muted-foreground">{p.dest.join(", ")}</td>
            </tr>))}
            {!rows.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Tidak ada item yang cocok dengan filter.</td></tr>}</tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>Buat Produksi · Langkah {step} dari 3</DialogTitle></DialogHeader>
          {step === 1 && <div className="grid gap-3">
            <p className="text-xs text-muted-foreground">Pilih sumber brief.</p>
            <div className="rounded-md border border-border p-3"><p className="text-sm font-medium">Dari Strategi</p><p className="mb-2 text-xs text-muted-foreground">Pesan utama, poin pendukung, audience, wilayah, kanal, dan sumber terbawa otomatis.</p>
              <Select onValueChange={pickStrategy}><SelectTrigger aria-label="Pilih strategi"><SelectValue placeholder="Pilih strategi…" /></SelectTrigger><SelectContent>{strategies.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.title}</SelectItem>)}</SelectContent></Select></div>
            <button type="button" onClick={() => setStep(2)} className="rounded-md border border-border p-3 text-left hover:bg-accent/40"><p className="text-sm font-medium">Manual</p><p className="text-xs text-muted-foreground">Buat produksi tanpa Strategi.</p></button>
          </div>}

          {step === 2 && <div className="grid gap-3">
            {origin.source === "Strategi" && <p className="rounded-md bg-accent/50 px-3 py-2 text-[11px] text-muted-foreground">Terisi dari Strategi <strong className="text-foreground">{origin.strategyTitle}</strong>{brief.audience ? ` · Audiens: ${brief.audience}` : ""}{brief.region ? ` · Wilayah: ${brief.region}` : ""}{brief.channels ? ` · Kanal: ${brief.channels.join(", ")}` : ""}. Cukup review/edit.</p>}
            <div className="grid gap-1.5"><Label htmlFor="bt">Judul / Tema</Label><Input id="bt" value={brief.theme} onChange={(e) => setBrief({ ...brief, theme: e.target.value })} placeholder="Respons Informasi Demonstrasi Nasional" /></div>
            <div className="grid gap-1.5"><Label htmlFor="bm">Pesan Utama</Label><Textarea id="bm" value={brief.message} onChange={(e) => setBrief({ ...brief, message: e.target.value })} placeholder="Inti pesan yang harus konsisten." /></div>
            <div className="grid gap-1.5"><Label htmlFor="bp">Poin / Fakta Pendukung <span className="font-normal text-muted-foreground">(satu per baris)</span></Label><Textarea id="bp" value={brief.points.join("\n")} onChange={(e) => setBrief({ ...brief, points: e.target.value.split("\n") })} /></div>
            <div className="grid gap-1.5"><Label>Arahan Gaya <span className="font-normal text-muted-foreground">(opsional)</span></Label><div className="flex flex-wrap gap-1.5">{STYLE_OPTIONS.map((s) => { const on = brief.style.includes(s); return <Button key={s} type="button" size="sm" variant={on ? "secondary" : "outline"} aria-pressed={on} onClick={() => setBrief({ ...brief, style: on ? brief.style.filter((x) => x !== s) : [...brief.style, s] })}>{s}</Button>; })}</div></div>
          </div>}

          {step === 3 && <div className="grid gap-3">
            <p className="text-xs text-muted-foreground">Pilih satu atau beberapa output. Setiap output menjadi item Produksi terpisah dengan approval masing-masing.</p>
            <div className="grid gap-3 sm:grid-cols-2">{(["News", "Visual", "Video", "Audio"] as const).map((f) => (
              <fieldset key={f} className="rounded-md border border-border p-3"><legend className="px-1 text-[11px] font-semibold uppercase text-muted-foreground">{f}</legend>
                {OUTPUT_TYPES.filter((o) => o.family === f).map((o) => <label key={o.type} className="flex items-center gap-2 py-1 text-sm"><Checkbox checked={types.includes(o.type)} onCheckedChange={() => setTypes((cur) => (cur.includes(o.type) ? cur.filter((x) => x !== o.type) : [...cur, o.type]))} />{o.type}</label>)}
                <div className="mt-3 border-t border-border pt-3">
                  <Label className="text-xs">Model AI untuk {f}</Label>
                  <Select value={models[f]} onValueChange={(value) => setModels((current) => ({ ...current, [f]: value }))}>
                    <SelectTrigger aria-label="Model AI" className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {f === "Visual" ? <SelectItem value="visual-current">Gemini · Carousel; Luma · Infografis</SelectItem> : <SelectItem value="gemini-2.5-flash">Gemini · gemini-2.5-flash</SelectItem>}
                    </SelectContent>
                  </Select>
                  <button type="button" className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline" onClick={() => { setModelFamily(f); setProvider(f === "Visual" ? "Luma" : "Gemini"); setProviderModel(f === "Visual" ? "photon-1" : "gemini-2.5-flash"); setVerification(null); setModelDialog(true); void getAiProviderStatus().then(setProviderStatus).catch(() => setProviderStatus(null)); }}>
                    + Tambahkan Model AI
                  </button>
                </div>
              </fieldset>))}</div>
          </div>}

          <DialogFooter className="gap-2">
            {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Kembali</Button>}
            {step === 2 && <Button disabled={!brief.theme.trim() || !brief.message.trim()} onClick={() => setStep(3)}>Lanjut pilih output</Button>}
            {step === 3 && <Button disabled={!types.length} onClick={generate}><Sparkles />Generate Produksi{types.length ? ` (${types.length})` : ""}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={modelDialog} onOpenChange={setModelDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Tambahkan Model AI · {modelFamily}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">Model baru tidak akan muncul sebagai siap pakai sebelum kredensial server diverifikasi dan uji generasi end-to-end berhasil.</p>
            <div className="grid gap-1.5"><Label>Provider</Label>
              <Select value={provider} onValueChange={(value) => { setProvider(value); setProviderModel(value === "Luma" ? "photon-1" : value === "Gemini" ? "gemini-2.5-flash" : value === "OpenAI" ? "gpt-4.1-mini" : value === "Anthropic" ? "claude-sonnet-4-5" : "grok-3-mini"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="Gemini">Google Gemini</SelectItem><SelectItem value="Luma">Luma AI</SelectItem><SelectItem value="OpenAI">OpenAI</SelectItem><SelectItem value="Anthropic">Anthropic Claude</SelectItem><SelectItem value="Grok">xAI Grok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Model</Label>
              <Select value={providerModel} onValueChange={setProviderModel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {(provider === "Gemini" ? [["gemini-2.5-flash","gemini-2.5-flash"]] : provider === "Luma" ? [["photon-1","photon-1"]] : provider === "OpenAI" ? [["gpt-4.1-mini","gpt-4.1-mini"]] : provider === "Anthropic" ? [["claude-sonnet-4-5","claude-sonnet-4-5"]] : [["grok-3-mini","grok-3-mini"]]).map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent></Select>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
              <p className="flex items-center gap-2 font-medium"><ShieldCheck className="size-4" />Kunci API tetap di server</p>
              <p className="mt-1 text-muted-foreground">Tambahkan secret provider di Vercel → Project → Settings → Environment Variables (Preview terlebih dahulu). Jangan masukkan API key ke form ini atau simpan di browser/Supabase.</p>
              <p className="mt-2 text-muted-foreground">Status secret server: {providerStatus?.providers.find((item) => item.name === provider)?.configured ? "tersedia" : providerStatus ? "belum diatur" : "belum dapat dibaca"}.
                {providerStatus?.providers.find((item) => item.name === provider)?.envName ? " Nama variabel: " + providerStatus.providers.find((item) => item.name === provider)?.envName + "." : ""}
              </p>
              <p className="mt-1 text-muted-foreground">Kemampuan output yang didukung backend saat ini: Gemini untuk News/Visual/Video/Audio; Luma untuk Visual. OpenAI, Claude, dan Grok belum memiliki adapter produksi, jadi tidak akan lolos uji kemampuan.</p>
            </div>
            {verification && <div role="status" className={"rounded-md border p-3 text-xs " + (verification.ok ? "border-emerald-600/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5")}>
              <p className="font-medium">{verification.ok ? "Uji provider berhasil" : "Uji provider belum berhasil"} · {verification.status}</p>
              <p className="mt-1">{verification.message}</p>
            </div>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModelDialog(false)}>Tutup</Button>
            <Button disabled={verifying} onClick={async () => {
              setVerifying(true); setVerification(null);
              try {
                const result = await verifyAiProvider({ data: { provider: provider as "Gemini" | "Luma" | "OpenAI" | "Anthropic" | "Grok", model: providerModel, family: modelFamily } });
                setVerification({ ok: result.ok, status: result.status, message: result.message });
                void getAiProviderStatus().then(setProviderStatus).catch(() => setProviderStatus(null));
              } catch {
                setVerification({ ok: false, status: "request-error", message: "Permintaan verifikasi gagal. Pastikan sesi login aktif dan periksa log server tanpa membuka secret." });
              } finally { setVerifying(false); }
            }}>{verifying ? "Menguji provider…" : "Uji koneksi & kemampuan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {productions.some((p) => p.status === "Generating") && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />Sistem sedang menyiapkan konten…</p>}
    </PageShell>
  );
}
