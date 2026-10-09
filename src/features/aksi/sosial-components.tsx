import { CheckCircle2, Eye, Pencil, RefreshCw, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { StatusPill } from "./components";
import type { ProductionItem } from "./data";
import { AssetPreview } from "./asset-preview";
import { dateLabel, type Post, type ReadyCheck } from "./sosial";

export const selectCls = "h-8 rounded-md border border-input bg-background px-2 text-xs";

export function AssetThumb({ asset, className }: { asset: ProductionItem; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[210px]", className)}><AssetPreview p={asset} compact /></div>;
}

export function ChecksView({ checks }: { checks: ReadyCheck[] }) {
  return <ul className="grid gap-1.5 text-xs">{checks.map((c) => <li key={c.label} className={cn("flex items-center gap-2", c.ok ? "text-chart-2" : "text-chart-3")}>{c.ok ? <CheckCircle2 className="size-3.5" /> : <TriangleAlert className="size-3.5" />}<span className="text-foreground">{c.label}</span></li>)}</ul>;
}

/** Mock of how the post will appear on its platform. */
export function PostMock({ post, asset }: { post: Post; asset?: ProductionItem | undefined }) {
  return <div className="rounded-md border border-border bg-background p-3">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-[11px]"><span className="font-semibold">{post.handle}</span><span className="text-muted-foreground">{post.platform} · {dateLabel(post.date)} {post.time}</span></div>
    {asset && <AssetThumb asset={asset} />}
    <p className="mt-2 whitespace-pre-line text-xs leading-5">{post.caption}</p>
    <p className="mt-1 text-[11px] text-primary">{post.hashtags.join(" ")}</p>
  </div>;
}

type BrowserProps = { posts: Post[]; productions: ProductionItem[]; editable: boolean; showExec?: boolean; onEdit?: (postId: string, caption: string) => void; onRegenerate?: (postId: string) => void };

export function PostsBrowser({ posts, productions, editable, showExec, onEdit, onRegenerate }: BrowserProps) {
  const [f, setF] = useState({ platform: "", account: "", asset: "", date: "", status: "" });
  const [open, setOpen] = useState<{ id: string; mode: "preview" | "edit" } | null>(null);
  const [draft, setDraft] = useState("");
  const uniq = (k: keyof Post) => [...new Set(posts.map((p) => String(p[k])))];
  const list = posts.filter((p) => (!f.platform || p.platform === f.platform) && (!f.account || p.handle === f.account) && (!f.asset || p.assetTitle === f.asset) && (!f.date || p.date === f.date) && (!f.status || (showExec ? p.exec : p.prep) === f.status));
  const current = posts.find((p) => p.id === open?.id);
  const asset = current && productions.find((p) => p.id === current.assetId);
  const sel = (key: keyof typeof f, label: string, opts: string[], fmt = (v: string) => v) => <select aria-label={label} className={selectCls} value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })}><option value="">{label}: Semua</option>{opts.map((o) => <option key={o} value={o}>{fmt(o)}</option>)}</select>;

  return <div>
    <div className="mb-3 flex flex-wrap gap-2">
      {sel("platform", "Platform", uniq("platform"))}{sel("account", "Akun", uniq("handle"))}{sel("asset", "Asset", uniq("assetTitle"))}{sel("date", "Tanggal", uniq("date"), dateLabel)}{sel("status", "Status", uniq(showExec ? "exec" : "prep"))}
      <span className="self-center text-[11px] text-muted-foreground">{list.length} dari {posts.length} posting</span>
    </div>
    <div className="overflow-x-auto rounded-md border border-border"><table className="w-full min-w-[720px] text-left text-xs">
      <thead className="border-b border-border text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Akun</th><th className="px-3 py-2 font-medium">Platform</th><th className="px-3 py-2 font-medium">Asset</th><th className="px-3 py-2 font-medium">Jadwal</th><th className="px-3 py-2 font-medium">Caption</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2" /></tr></thead>
      <tbody>{list.map((p) => <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/40">
        <td className="px-3 py-2 font-medium">{p.handle}</td><td className="px-3 py-2">{p.platform}</td><td className="px-3 py-2"><Button variant="ghost" className="h-auto max-w-[260px] justify-start gap-2 whitespace-normal p-0 text-left" aria-label={`Preview asset ${p.id}`} onClick={() => setOpen({ id: p.id, mode: "preview" })}><span className="block h-16 w-10 shrink-0 overflow-hidden rounded-sm" aria-hidden="true"><span className="block w-[210px] origin-top-left scale-[.19]">{productions.find((a) => a.id === p.assetId) && <AssetThumb asset={productions.find((a) => a.id === p.assetId) as ProductionItem} />}</span></span><span className="grid gap-0.5 text-xs"><span>{p.assetTitle}</span><span className="text-[10px] text-muted-foreground">{p.assetType}</span></span></Button></td>
        <td className="px-3 py-2 whitespace-nowrap">{dateLabel(p.date)} · {p.time}</td>
        <td className="max-w-[260px] truncate px-3 py-2 text-muted-foreground">{p.caption || "—"}</td>
        <td className="px-3 py-2"><StatusPill value={showExec ? p.exec : p.prep} /></td>
        <td className="px-3 py-2"><div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" aria-label={`Preview ${p.id}`} onClick={() => setOpen({ id: p.id, mode: "preview" })}><Eye /></Button>
          {editable && <><Button size="sm" variant="ghost" aria-label={`Edit ${p.id}`} onClick={() => { setDraft(p.caption); setOpen({ id: p.id, mode: "edit" }); }}><Pencil /></Button>
            <Button size="sm" variant="ghost" aria-label={`Regenerate ${p.id}`} onClick={() => onRegenerate?.(p.id)}><RefreshCw /></Button></>}
        </div></td>
      </tr>)}</tbody>
    </table></div>
    <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{open?.mode === "edit" ? "Edit Caption" : "Preview Paket Publikasi"} · {current?.handle} · {current?.platform}</DialogTitle></DialogHeader>
        {current && (open?.mode === "edit" ? <div className="grid gap-3">
          <Textarea rows={7} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Caption" />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(null)}>Batal</Button><Button onClick={() => { onEdit?.(current.id, draft); setOpen(null); }}>Simpan</Button></div>
        </div> : <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          <div><p className="mb-2 text-xs font-semibold">Bentuk Post · {current.platform}</p><PostMock post={current} asset={asset} /></div>
          <div><p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">Asset asli · {current.assetTitle}</p>{asset ? <AssetPreview p={asset} /> : null}</div>
        </div>)}
      </DialogContent>
    </Dialog>
  </div>;
}
