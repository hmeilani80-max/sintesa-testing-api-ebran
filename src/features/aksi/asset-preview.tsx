import { useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/prod-hero.jpg";
import videoImg from "@/assets/prod-video.jpg";
import briefingImg from "@/assets/prod-briefing.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductionItem } from "./data";

/** A single read-only asset renderer shared by distribution and approval previews. */
export function AssetPreview({ p, compact = false }: { p: ProductionItem; compact?: boolean }) {
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(false);
  const c = p.content;
  const title = c.headline || p.title;
  const message = p.brief.message;
  const duration = `${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, "0")}`;
  const frame = "overflow-hidden rounded-md border border-border bg-background";
  if (p.type === "Video Pendek") return <div className={cn(frame, "relative mx-auto aspect-[9/16] w-full", !compact && "max-w-[280px]")}>
    <img src={videoImg} alt={`Poster ${p.title}: aktivitas publik di kota`} className="absolute inset-0 size-full object-cover" />
    <div className="absolute inset-x-0 top-0 bg-background/85 p-3"><p className="text-[9px] font-semibold text-primary">SINTESA · INFORMASI PUBLIK</p><p className="mt-1 text-sm font-semibold leading-snug">{title}</p></div>
    {compact ? <Play className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2" /> : <Button variant="secondary" size="icon" aria-label={playing ? "Jeda preview video" : "Putar preview video"} onClick={() => setPlaying(!playing)} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full">{playing ? <Pause /> : <Play />}</Button>}
    <div className="absolute inset-x-0 bottom-0 bg-background/85 p-3"><p className="text-[11px] leading-4">{message}</p><div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground"><span>{playing ? "0:04" : "0:00"}</span><div className="h-1 flex-1 bg-muted"><div className={cn("h-full bg-primary", playing ? "w-1/5" : "w-0")} /></div><span>{duration} · 9:16</span></div></div>
  </div>;
  if (p.type === "Infografis") return <div className={cn(frame, "mx-auto max-w-md")}>
    <img src={briefingImg} alt="Aktivitas publik dan informasi resmi" className="h-24 w-full object-cover" />
    <div className="p-3"><p className="text-[9px] font-semibold text-primary">SINTESA · INFORMASI PUBLIK</p><h3 className="mt-1 text-sm font-semibold leading-snug">{title}</h3><p className="mt-2 text-[11px] leading-4 text-muted-foreground">{message}</p>
      <ol className="mt-3 grid gap-2">{p.brief.points.slice(0, 3).map((point, i) => <li key={i} className="flex gap-2 text-[11px] leading-4"><ShieldCheck className="size-3.5 shrink-0 text-chart-2" />{point}</li>)}</ol>
      <div className="mt-3 border-l-2 border-chart-3 pl-2 text-[10px] leading-4"><strong className="text-chart-3">Klarifikasi</strong><p>{p.brief.points.find((x) => /\bbelum\b|klarifikasi/i.test(x)) ?? "Informasi yang belum dikonfirmasi tidak boleh dianggap sebagai fakta."}</p></div>
      <p className="mt-3 border-t border-border pt-2 text-[10px] text-primary">Rujuk kanal resmi untuk pembaruan terverifikasi.</p>
    </div></div>;
  if (p.type === "Carousel") {
    const current = c.slides[slide] ?? c.slides[0];
    return <div className="mx-auto w-full max-w-md"><div className={cn(frame, "flex aspect-[4/5] flex-col")}>
      <img src={[heroImg, briefingImg, videoImg][slide % 3]} alt={`${p.title} — ${current?.label ?? "Headline"}`} className="h-2/5 w-full object-cover" />
      <div className="flex flex-1 flex-col p-3"><div className="flex justify-between text-[10px] text-primary"><span>SINTESA</span><span>{slide + 1}/{c.slides.length} · {current?.label}</span></div><h3 className="mt-3 text-sm font-semibold leading-snug">{slide === 0 ? current?.text : current?.label}</h3>{slide > 0 && <p className="mt-2 text-xs leading-5">{current?.text}</p>}<p className="mt-auto pt-3 text-[10px] text-muted-foreground">Informasi publik · Sumber terverifikasi</p></div></div>
      {compact ? <p className="mt-1 text-[10px] text-muted-foreground">{c.slides.length} slides · Headline / Konteks / Fakta / Klarifikasi / Penutup</p> : <div className="mt-2 flex items-center justify-between"><Button size="icon" variant="outline" disabled={slide === 0} aria-label="Slide sebelumnya" onClick={() => setSlide(slide - 1)}><ArrowLeft /></Button><span className="text-xs">{slide + 1} / {c.slides.length}</span><Button size="icon" variant="outline" disabled={slide >= c.slides.length - 1} aria-label="Slide berikutnya" onClick={() => setSlide(slide + 1)}><ArrowRight /></Button></div>}
    </div>;
  }
  if (p.type === "News Article") return <article className={frame}><img src={heroImg} alt="Suasana aktivitas publik" className="aspect-video w-full object-cover" /><div className="p-3"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{c.lead}</p></div></article>;
  return <div className={cn(frame, "p-4")}><img src={briefingImg} alt="Cover ringkasan audio" className="aspect-video w-full rounded-sm object-cover" /><p className="mt-3 text-sm font-semibold">{title}</p><div className="mt-3 flex h-10 items-center gap-1">{Array.from({ length: 24 }, (_, i) => <span key={i} className={cn("flex-1 bg-primary/60", i % 3 === 0 ? "h-8" : i % 2 === 0 ? "h-5" : "h-3")} />)}</div><p className="mt-1 text-xs text-muted-foreground">{duration} · Audio</p></div>;
}