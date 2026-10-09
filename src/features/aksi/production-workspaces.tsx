import { CheckCircle2, CircleHelp, Info, Loader2, MapPin, Megaphone, Newspaper, Pause, Play, RefreshCw, Save, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";

import briefingImg from "@/assets/prod-briefing.jpg";
import heroImg from "@/assets/prod-hero.jpg";
import videoImg from "@/assets/prod-video.jpg";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { Box } from "./components";
import { AssetPreview } from "./asset-preview";
import { useAksi } from "./context";
import type { Check, ProductionContent, ProductionItem } from "./data";

const editableItem = (p: ProductionItem) => p.status === "Generated" && p.approval !== "Menunggu" && p.approval !== "Disetujui";

export function ChecksList({ checks }: { checks: Check[] }) {
  if (!checks.length) return <p className="text-xs text-muted-foreground">Pemeriksaan otomatis berjalan setelah konten selesai di-generate.</p>;
  return <ul className="grid gap-2 text-xs">{checks.map((c) => <li key={c.label} className="flex items-center gap-2">{c.ok ? <CheckCircle2 className="size-4 text-chart-2" /> : <TriangleAlert className="size-4 text-chart-3" />}{c.label}</li>)}</ul>;
}

function GeneratingState({ steps }: { steps: string[] }) {
  return <div className="grid place-items-center gap-3 rounded-md border border-dashed border-border py-10 text-center">
    <Loader2 className="size-6 animate-spin text-primary" />
    <p className="text-sm font-medium">Sistem sedang mengerjakan</p>
    <p className="max-w-md text-xs text-muted-foreground">{steps.join(" → ")}</p>
  </div>;
}

function Choice<T extends string | number | boolean>({ label, value, options, onChange, disabled, render }: { label: string; value: T; options: T[]; onChange: (v: T) => void; disabled?: boolean; render?: (v: T) => string }) {
  return <div className="grid gap-1.5"><Label>{label}</Label><div className="flex flex-wrap gap-1.5">{options.map((o) => <Button key={String(o)} type="button" size="sm" disabled={disabled} variant={o === value ? "secondary" : "outline"} aria-pressed={o === value} onClick={() => onChange(o)}>{render ? render(o) : String(o)}</Button>)}</div></div>;
}

const SLIDE_IMGS = [heroImg, briefingImg, videoImg];
const SLIDE_ICONS = [Newspaper, Info, ShieldCheck, CircleHelp, Megaphone];
const SLIDE_HEADS = ["", "Mengapa perlu verifikasi", "Fakta yang terkonfirmasi", "Perlu diperhatikan", "Rujuk sumber resmi"];
const firstLine = (s: string) => s.match(/[^.]+\./)?.[0] ?? s;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const WAVE = Array.from({ length: 64 }, (_, i) => 20 + Math.round(Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)) * 75));

function VideoPreview({ ratio, headline, subtitle, seconds }: { ratio: "9:16" | "16:9"; headline: string; subtitle: string; seconds: number }) {
  const [playing, setPlaying] = useState(false);
  return <div className={cn("relative overflow-hidden rounded-md border border-border bg-background", ratio === "9:16" ? "mx-auto aspect-[9/16] w-60" : "aspect-video w-full")}>
    <img src={videoImg} alt="Cuplikan video: lanskap kota" width={1024} height={1024} className="absolute inset-0 size-full object-cover opacity-80" />
    <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background/90" />
    <div className="absolute inset-x-3 top-3"><p className="text-[9px] font-semibold uppercase tracking-wider text-primary">Info Resmi · SINTESA</p><p className="mt-1 font-display text-sm font-semibold leading-snug">{headline}</p></div>
    <button type="button" aria-label={playing ? "Jeda" : "Putar"} onClick={() => setPlaying(!playing)} className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-background/70 backdrop-blur">{playing ? <Pause className="size-5" /> : <Play className="size-5" />}</button>
    <div className="absolute inset-x-3 bottom-3 grid gap-2"><p className="mx-auto rounded-sm bg-background/80 px-2 py-1 text-center text-[11px] leading-4">{subtitle}</p>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><span>{playing ? "0:04" : "0:00"}</span><div className="h-1 flex-1 rounded-full bg-muted"><div className={cn("h-full rounded-full bg-primary", playing ? "w-[8%]" : "w-0")} /></div><span>{fmt(seconds)}</span></div></div>
  </div>;
}

function AudioPreview({ label, seconds }: { label: string; seconds: number }) {
  const [playing, setPlaying] = useState(false);
  return <div className="flex items-center gap-4 rounded-md border border-border bg-card p-4">
    <Button size="icon" aria-label={playing ? "Jeda" : "Putar"} onClick={() => setPlaying(!playing)}>{playing ? <Pause /> : <Play />}</Button>
    <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{label}</p>
      <div className="mt-2 flex h-10 items-center gap-[2px]">{WAVE.map((h, i) => <span key={i} className={cn("flex-1 rounded-full", playing && i < 6 ? "bg-primary" : "bg-muted-foreground/40")} style={{ height: `${h}%` }} />)}</div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>{playing ? "0:03" : "0:00"}</span><span>{fmt(seconds)}</span></div></div>
  </div>;
}

/** Shared generate / regenerate action bar for automated output types. */
function GenerateBar({ p, label, settings, children }: { p: ProductionItem; label: string; settings?: Partial<ProductionContent>; children?: ReactNode }) {
  const { generate } = useAksi();
  const locked = p.approval === "Menunggu" || p.approval === "Disetujui";
  return <div className="flex flex-wrap items-center gap-2">
    {p.status === "Draft" && <Button onClick={() => generate(p.id, settings)}><Sparkles />{label}</Button>}
    {p.status === "Generated" && <Button variant="outline" disabled={locked} onClick={() => generate(p.id, settings)}><RefreshCw />Regenerate</Button>}
    {children}
    {locked && <span className="text-[11px] text-muted-foreground">{p.approval === "Menunggu" ? "Terkunci selama review." : "Terkunci — sudah approved."}</span>}
  </div>;
}

function ArticleWorkspace({ p }: { p: ProductionItem }) {
  const { saveContent } = useAksi();
  const [draft, setDraft] = useState(p.content);
  const [mode, setMode] = useState<"Edit" | "Preview">("Edit");
  const [note, setNote] = useState("");
  useEffect(() => setDraft(p.content), [p.content]);
  const editable = editableItem(p);
  const dirty = JSON.stringify(draft) !== JSON.stringify(p.content);
  const set = (k: keyof ProductionContent, v: string | string[]) => setDraft({ ...draft, [k]: v });
  const assist: Record<string, () => void> = {
    "Perbaiki Judul": () => { set("headline", `${p.brief.theme}: Fakta Terverifikasi dan Langkah Lanjutan`); setNote("Judul diperbaiki agar lebih jelas dan informatif."); },
    "Buat Alternatif Lead": () => { set("lead", `Pemerintah menyampaikan pembaruan terverifikasi terkait ${p.brief.theme.toLowerCase()}, sekaligus meluruskan informasi yang belum dikonfirmasi.`); setNote("Alternatif lead dibuat."); },
    Ringkas: () => { set("body", draft.body.split("\n\n").slice(0, 3).join("\n\n")); setNote("Body diringkas menjadi 3 paragraf."); },
    Perjelas: () => { set("lead", (draft.lead.match(/[^.]+\./)?.[0] ?? draft.lead).trim()); setNote("Lead diperjelas menjadi satu kalimat inti."); },
    "Sesuaikan Tone": () => { set("body", draft.body.replace(/!/g, ".")); setNote(`Tone disesuaikan: ${p.brief.style.join(", ") || "Tenang, Informatif"}.`); },
    "Cek Konsistensi Pesan": () => { const key = p.brief.message.split(" ").filter((w) => w.length > 6).slice(0, 4); const hit = key.filter((w) => `${draft.lead} ${draft.body}`.includes(w)).length; setNote(`Konsistensi pesan: ${hit}/${key.length} kata kunci Pesan Utama ditemukan.`); },
  };

  if (p.status === "Generating") return <GeneratingState steps={["Membaca brief", "Menyusun struktur", "Menulis draft", "Cek editorial"]} />;
  if (p.status === "Draft") return <GenerateBar p={p} label="Generate Draft" />;
  return <div className="grid gap-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="inline-flex rounded-md border border-border p-0.5">{(["Edit", "Preview"] as const).map((m) => <Button key={m} size="sm" variant={mode === m ? "secondary" : "ghost"} onClick={() => setMode(m)}>{m}</Button>)}</div>
      <GenerateBar p={p} label="Generate Draft">{editable && <Button disabled={!dirty} onClick={() => saveContent(p.id, draft)}><Save />Save</Button>}</GenerateBar>
    </div>
    {mode === "Edit" ? <div className="grid gap-3">
      {editable && <div className="flex flex-wrap gap-1.5">{Object.keys(assist).map((a) => <Button key={a} size="sm" variant="outline" onClick={assist[a]}><Sparkles className="size-3" />{a}</Button>)}</div>}
      {note && <p className="rounded-md bg-accent/50 px-3 py-2 text-[11px]">{note}</p>}
      {([["headline", "Judul"], ["subtitle", "Subjudul"]] as const).map(([k, l]) => <div key={k} className="grid gap-1.5"><Label htmlFor={k}>{l}</Label><Input id={k} disabled={!editable} value={draft[k]} onChange={(e) => set(k, e.target.value)} /></div>)}
      <div className="grid gap-1.5"><Label htmlFor="lead">Lead</Label><Textarea id="lead" disabled={!editable} value={draft.lead} onChange={(e) => set("lead", e.target.value)} /></div>
      <div className="grid gap-1.5"><Label htmlFor="body">Body</Label><Textarea id="body" disabled={!editable} className="min-h-48" value={draft.body} onChange={(e) => set("body", e.target.value)} /></div>
      <div className="grid gap-1.5"><Label htmlFor="tags">Tag / Metadata <span className="font-normal text-muted-foreground">(pisahkan dengan koma)</span></Label><Input id="tags" disabled={!editable} value={draft.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()))} /></div>
    </div> : <article className="mx-auto w-full max-w-2xl rounded-md border border-border bg-background p-5">
      <h1 className="font-display text-2xl font-semibold leading-tight">{draft.headline}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{draft.subtitle}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} · Info Resmi</p>
      <figure className="my-4"><img src={heroImg} alt="Suasana aktivitas publik di depan gedung pemerintahan" width={1536} height={864} className="aspect-[16/8] w-full rounded-md object-cover" /><figcaption className="mt-1.5 text-[10px] text-muted-foreground">Suasana aktivitas publik di pusat kota. (Ilustrasi)</figcaption></figure>
      <p className="text-sm font-medium leading-7">{draft.lead}</p>
      {draft.body.split("\n\n").map((para, i) => <p key={i} className="mt-3 text-sm leading-7 text-muted-foreground">{para}</p>)}
      <div className="mt-4 flex flex-wrap gap-1.5">{draft.tags.filter(Boolean).map((t) => <span key={t} className="rounded-sm bg-secondary px-2 py-0.5 text-[10px]">{t}</span>)}</div>
      <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">Sumber: Data SINTESA, Laporan Analyst, News Source</p>
    </article>}
  </div>;
}

function VideoWorkspace({ p }: { p: ProductionItem }) {
  const [s, setS] = useState({ duration: p.content.duration, format: p.content.format, voiceOver: p.content.voiceOver });
  const locked = p.approval === "Menunggu" || p.approval === "Disetujui" || p.status === "Generating";
  return <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
    <div className="grid content-start gap-3">
      <Choice label="Durasi" value={s.duration} options={[30, 45, 60]} render={(v) => `${v} detik`} disabled={locked} onChange={(duration) => setS({ ...s, duration })} />
      <Choice label="Format" value={s.format} options={["9:16", "16:9"] as const as ("9:16" | "16:9")[]} disabled={locked} onChange={(format) => setS({ ...s, format })} />
      <Choice label="Voice-over" value={s.voiceOver} options={[true, false]} render={(v) => (v ? "Ya" : "Tidak")} disabled={locked} onChange={(voiceOver) => setS({ ...s, voiceOver })} />
      <GenerateBar p={p} label="Generate Video" settings={s} />
      {p.status === "Generated" && <p className="text-[11px] text-muted-foreground">Regenerate membuat ulang video secara keseluruhan.</p>}
    </div>
    <div>
      {p.status === "Generating" ? <GeneratingState steps={["Script", "Scene Planning", "Visual Generation", "Voice-over", "Subtitle", "Final Video"]} />
        : p.status === "Draft" ? <p className="rounded-md border border-dashed border-border py-10 text-center text-xs text-muted-foreground">Atur durasi dan format, lalu Generate Video. Script, scene, visual, dan subtitle dikerjakan otomatis.</p>
        : <div className="grid gap-3"><VideoPreview ratio={p.content.format} headline={p.content.headline} subtitle={firstLine(p.brief.message)} seconds={p.content.duration} />
          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">{[["Durasi", `${p.content.duration} detik`], ["Aspect ratio", p.content.format], ["Subtitle", "Tersedia"], ["Voice-over", p.content.voiceOver ? "Tersedia" : "Tidak"]].map(([k, v]) => <div key={k} className="rounded-md border border-border p-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
          <details className="text-xs"><summary className="cursor-pointer text-muted-foreground">Lihat script yang dihasilkan</summary><p className="mt-2 whitespace-pre-line leading-6">{p.content.transcript}</p></details></div>}
    </div>
  </div>;
}

function TextEdit({ p, fields }: { p: ProductionItem; fields: { key: "headline" | "caption"; label: string }[] }) {
  const { saveContent } = useAksi();
  const [draft, setDraft] = useState(p.content);
  useEffect(() => setDraft(p.content), [p.content]);
  if (!editableItem(p)) return null;
  return <details className="rounded-md border border-border p-3 text-xs"><summary className="cursor-pointer font-medium">Edit teks ringan</summary>
    <div className="mt-3 grid gap-2">{fields.map((f) => <div key={f.key} className="grid gap-1.5"><Label htmlFor={`te-${f.key}`}>{f.label}</Label><Input id={`te-${f.key}`} value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} /></div>)}
      <Button size="sm" className="justify-self-start" disabled={JSON.stringify(draft) === JSON.stringify(p.content)} onClick={() => saveContent(p.id, draft)}><Save />Simpan teks</Button></div>
  </details>;
}

function InfographicWorkspace({ p }: { p: ProductionItem }) {
  if (p.status === "Generating") return <GeneratingState steps={["Hierarki informasi", "Headline", "Data highlight", "Layout", "Caption"]} />;
  if (p.status === "Draft") return <GenerateBar p={p} label="Generate Infografis" />;
  const pts = p.brief.points.filter(Boolean);
  const know = (pts.length ? pts : ["Situasi terpantau dan ditangani petugas", "Aktivitas publik berjalan normal", "Pembaruan disampaikan berkala"]).slice(0, 3);
  const unverified = pts.find((x) => /belum|klarifikasi|hoaks/i.test(x)) ?? "Kabar penutupan akses kota yang beredar di media sosial belum terkonfirmasi.";
  const icons = [MapPin, ShieldCheck, Megaphone];
  return <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-md border border-border bg-card">
      <div className="relative h-36"><img src={briefingImg} alt="" loading="lazy" width={1024} height={1024} className="size-full object-cover opacity-60" /><div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        <p className="absolute left-5 top-4 rounded-sm bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Info Resmi</p></div>
      <div className="-mt-8 relative px-5 pb-5">
        <h3 className="font-display text-xl font-semibold leading-tight">{p.content.headline}</h3>
        <p className="mt-3 border-l-2 border-primary pl-3 text-xs leading-5 text-muted-foreground">{firstLine(p.brief.message)}</p>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">3 hal yang perlu diketahui</p>
        <div className="mt-2 grid gap-2">{know.map((k, i) => { const I = icons[i] ?? Info; return <div key={k} className="flex items-start gap-3 rounded-md bg-secondary/60 p-2.5"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"><I className="size-3.5" /></span><p className="text-xs leading-5">{k}</p></div>; })}</div>
        <div className="mt-3 flex items-start gap-3 rounded-md border border-chart-3/40 p-2.5"><CircleHelp className="size-4 shrink-0 text-chart-3" /><div><p className="text-[10px] font-semibold uppercase text-chart-3">Belum terverifikasi</p><p className="text-xs leading-5">{unverified}</p></div></div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground"><span>Rujuk kanal informasi resmi pemerintah</span><span className="font-semibold text-foreground">SINTESA</span></div>
      </div>
    </div>
    <div className="grid content-start gap-3"><GenerateBar p={p} label="Generate Infografis" /><p className="text-[11px] text-muted-foreground">{p.content.caption}</p><TextEdit p={p} fields={[{ key: "headline", label: "Headline" }, { key: "caption", label: "Caption" }]} /></div>
  </div>;
}

function CarouselWorkspace({ p }: { p: ProductionItem }) {
  const { saveContent } = useAksi();
  const [sel, setSel] = useState<number[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [text, setText] = useState("");
  if (p.status === "Generating") return <GeneratingState steps={["Struktur slide", "Urutan pesan", "Headline", "Data highlight", "Visual layout"]} />;
  if (p.status === "Draft") return <GenerateBar p={p} label="Generate Carousel" />;
  const all = sel.length === p.content.slides.length;
  return <div className="grid gap-3">
    <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={() => setSel(all ? [] : p.content.slides.map((_, i) => i))}>{all ? "Batal pilih" : "Pilih semua"}</Button><span className="text-[11px] text-muted-foreground">{sel.length} dari {p.content.slides.length} slide dipilih</span><div className="ml-auto"><GenerateBar p={p} label="Generate Carousel" /></div></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{p.content.slides.map((s, i) => { const I = SLIDE_ICONS[i % 5] ?? Info; return (
      <div key={i} className={cn("flex aspect-[4/5] flex-col overflow-hidden rounded-md border bg-card", sel.includes(i) ? "border-brand" : "border-border")}>
        <div className="relative h-2/5 shrink-0"><img src={SLIDE_IMGS[i % 3]} alt="" loading="lazy" className="size-full object-cover opacity-55" /><div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          <div className="absolute inset-x-2 top-2 flex items-center justify-between text-[10px]"><span className="rounded-sm bg-background/80 px-1.5 py-0.5">{i + 1}/{p.content.slides.length} · {s.label}</span><Checkbox className="bg-background/80" aria-label={`Pilih slide ${i + 1}`} checked={sel.includes(i)} onCheckedChange={() => setSel((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]))} /></div>
          <span className="absolute bottom-1 left-3 grid size-7 place-items-center rounded-full bg-primary/20 text-primary"><I className="size-3.5" /></span></div>
        <div className="flex flex-1 flex-col p-3">
        {editing === i ? <><Textarea className="flex-1 text-xs" value={text} onChange={(e) => setText(e.target.value)} /><Button size="sm" className="mt-2" onClick={() => { saveContent(p.id, { ...p.content, slides: p.content.slides.map((x, j) => (j === i ? { ...x, text } : x)) }); setEditing(null); }}>Simpan</Button></>
          : <><p className="font-display text-sm font-semibold leading-snug">{i === 0 ? s.text : SLIDE_HEADS[i % 5]}</p>{i > 0 && <p className="mt-1.5 line-clamp-4 flex-1 text-[11px] leading-4 text-muted-foreground">{s.text}</p>}{i === 0 && <span className="flex-1" />}
            <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground"><span>SINTESA · Info Resmi</span>{editableItem(p) && <button type="button" className="text-primary hover:underline" onClick={() => { setEditing(i); setText(s.text); }}>Edit teks</button>}</div></>}
        </div>
      </div>); })}</div>
    <p className="text-[11px] text-muted-foreground">Caption: {p.content.caption}</p>
  </div>;
}

function AudioWorkspace({ p }: { p: ProductionItem }) {
  const [s, setS] = useState({ duration: p.content.duration, voice: p.content.voice });
  const locked = p.approval === "Menunggu" || p.approval === "Disetujui" || p.status === "Generating";
  return <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
    <div className="grid content-start gap-3">
      <Choice label="Durasi" value={s.duration} options={[60, 90, 120]} render={(v) => `${v} detik`} disabled={locked} onChange={(duration) => setS({ ...s, duration })} />
      <Choice label="Gaya suara" value={s.voice} options={["Formal", "Informatif", "Tenang"]} disabled={locked} onChange={(voice) => setS({ ...s, voice })} />
      <GenerateBar p={p} label="Generate Audio" settings={s} />
    </div>
    <div>{p.status === "Generating" ? <GeneratingState steps={["Script", "Voice-over", "Intro/Outro", "Transkrip"]} />
      : p.status === "Draft" ? <p className="rounded-md border border-dashed border-border py-10 text-center text-xs text-muted-foreground">Pilih durasi dan gaya suara, lalu Generate Audio.</p>
      : <div className="grid gap-3"><AudioPreview label={`${p.content.headline} · suara ${p.content.voice}`} seconds={p.content.duration} /><p className="text-[11px] text-muted-foreground">Voice-over: tersedia · Gaya {p.content.voice} · {fmt(p.content.duration)}</p><Box title="Transkrip"><p className="whitespace-pre-line text-xs leading-6">{p.content.transcript}</p></Box></div>}</div>
  </div>;
}

export function ProductionWorkspace({ p }: { p: ProductionItem }) {
  switch (p.type) {
    case "News Article": return <ArticleWorkspace p={p} />;
    case "Video Pendek": return <VideoWorkspace p={p} />;
    case "Infografis": return <InfographicWorkspace p={p} />;
    case "Carousel": return <CarouselWorkspace p={p} />;
    case "Audio / Podcast": return <AudioWorkspace p={p} />;
  }
}

/** Read-only final preview for approvers: no editor, no regenerate. */
export function ContentPreview({ p }: { p: ProductionItem }) {
  const c = p.content;
  if (p.status !== "Generated") return <p className="text-xs text-muted-foreground">Konten belum selesai dibuat.</p>;
  if (["Video Pendek", "Carousel", "Infografis"].includes(p.type)) return <AssetPreview p={p} />;
  switch (p.type) {
    case "News Article": return <article className="mx-auto w-full max-w-2xl rounded-md border border-border bg-background p-5">
      <h1 className="font-display text-2xl font-semibold leading-tight">{c.headline}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.subtitle}</p>
      <figure className="my-4"><img src={heroImg} alt="Suasana aktivitas publik di depan gedung pemerintahan" width={1536} height={864} className="aspect-[16/8] w-full rounded-md object-cover" /></figure>
      <p className="text-sm font-medium leading-7">{c.lead}</p>
      {c.body.split("\n\n").map((para, i) => <p key={i} className="mt-3 text-sm leading-7 text-muted-foreground">{para}</p>)}
      <div className="mt-4 flex flex-wrap gap-1.5">{c.tags.filter(Boolean).map((t) => <span key={t} className="rounded-sm bg-secondary px-2 py-0.5 text-[10px]">{t}</span>)}</div>
    </article>;
    case "Video Pendek": return <div className="grid gap-3"><VideoPreview ratio={c.format} headline={c.headline} subtitle={firstLine(p.brief.message)} seconds={c.duration} />
      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">{[["Durasi", `${c.duration} detik`], ["Format", c.format], ["Subtitle", "Tersedia"], ["Voice-over", c.voiceOver ? "Tersedia" : "Tidak"]].map(([k, v]) => <div key={k} className="rounded-md border border-border p-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl></div>;
    case "Audio / Podcast": return <div className="grid gap-3"><AudioPreview label={`${c.headline} · suara ${c.voice}`} seconds={c.duration} /><Box title="Transkrip"><p className="whitespace-pre-line text-xs leading-6">{c.transcript}</p></Box></div>;
    case "Infografis": return <div className="mx-auto w-full max-w-md overflow-hidden rounded-md border border-border bg-card">
      <img src={briefingImg} alt="" width={1024} height={1024} className="h-36 w-full object-cover opacity-60" />
      <div className="p-5"><h3 className="font-display text-xl font-semibold leading-tight">{c.headline}</h3>
        <p className="mt-3 border-l-2 border-primary pl-3 text-xs leading-5 text-muted-foreground">{firstLine(p.brief.message)}</p>
        <div className="mt-4 grid gap-2">{p.brief.points.filter(Boolean).slice(0, 3).map((k) => <p key={k} className="rounded-md bg-secondary/60 p-2.5 text-xs">{k}</p>)}</div>
        <p className="mt-4 border-t border-border pt-3 text-[10px] text-muted-foreground">{c.caption}</p></div>
    </div>;
    case "Carousel": return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{c.slides.map((s, i) => <div key={i} className="flex aspect-[4/5] flex-col overflow-hidden rounded-md border border-border bg-card">
      <img src={SLIDE_IMGS[i % 3]} alt="" loading="lazy" className="h-2/5 w-full object-cover opacity-55" />
      <div className="p-3"><span className="text-[10px] text-muted-foreground">{i + 1}/{c.slides.length} · {s.label}</span><p className="mt-1 font-display text-sm font-semibold leading-snug">{i === 0 ? s.text : SLIDE_HEADS[i % 5]}</p>{i > 0 && <p className="mt-1.5 line-clamp-4 text-[11px] leading-4 text-muted-foreground">{s.text}</p>}</div>
    </div>)}</div>;
  }
}
