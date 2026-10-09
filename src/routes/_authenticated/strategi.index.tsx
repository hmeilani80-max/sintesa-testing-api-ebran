import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Database, PenLine, Plus } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSituations } from "@/features/situasi/context";
import { RiskLabel } from "@/features/situasi/components";
import { useStrategies } from "@/features/strategi/context";
import { PLATFORMS } from "@/features/strategi/data";
import { StatusBadge } from "@/features/strategi/components";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/strategi/")({
  head: () => ({ meta: [
    { title: "Strategi — SINTESA" },
    { name: "description", content: "Daftar strategi respons yang disusun dari situasi atau input manual." },
    { property: "og:title", content: "Strategi — SINTESA" },
    { property: "og:description", content: "Mengubah intelligence situasi menjadi rencana respons." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: StrategiList,
});

function StrategiList() {
  const { strategies } = useStrategies();
  const [open, setOpen] = useState(false);
  return (
    <PageShell eyebrow="Decide" title="Strategi" description="Strategi yang sedang disusun, siap dilaksanakan, atau sudah diteruskan menjadi aksi." actions={<Button onClick={() => setOpen(true)}><Plus />Buat Strategi</Button>}>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Strategi</TableHead><TableHead>Sumber</TableHead><TableHead>Situasi</TableHead><TableHead>Status</TableHead><TableHead>Terakhir Diperbarui</TableHead></TableRow></TableHeader>
          <TableBody>
            {strategies.map((s) => (
              <TableRow key={s.slug}>
                <TableCell className="font-medium"><Link to="/strategi/$slug" params={{ slug: s.slug }} className="hover:text-primary">{s.title}</Link></TableCell>
                <TableCell>{s.source === "Situasi" ? "Situasi" : "Manual"}</TableCell>
                <TableCell>{s.situationName ?? "—"}</TableCell>
                <TableCell><StatusBadge status={s.status} /></TableCell>
                <TableCell className="text-muted-foreground">{s.updated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <CreateStrategyDialog open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}

function CreateStrategyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState<"choose" | "situation" | "manual">("choose");
  const { findings, topics } = useSituations();
  const { addStrategy } = useStrategies();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", context: "", objective: "", audience: "", region: "", reference: "" });
  const [platforms, setPlatforms] = useState<string[]>([]);
  const list = [...findings, ...topics].filter((item, i, arr) => arr.findIndex((c) => c.slug === item.slug) === i);

  const close = (o: boolean) => { onOpenChange(o); if (!o) setStep("choose"); };
  const go = (slug: string) => { close(false); navigate({ to: "/strategi/$slug", params: { slug } }); };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{step === "choose" ? "Bagaimana Anda ingin memulai?" : step === "situation" ? "Pilih Situasi" : "Buat Strategi Baru"}</DialogTitle>
          <DialogDescription>{step === "situation" ? "Konteks analisis akan diambil otomatis dari Situasi." : step === "manual" ? "Masukkan konteks dan kebutuhan strategi." : "Pilih sumber konteks penyusunan strategi."}</DialogDescription>
        </DialogHeader>
        {step === "choose" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setStep("situation")} className="rounded-lg border border-border bg-secondary/40 p-4 text-left transition-colors hover:border-primary">
              <Database className="size-5 text-primary" /><p className="mt-3 text-sm font-semibold">Pilih dari Situasi</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Gunakan hasil monitoring dan analisis SINTESA sebagai konteks penyusunan strategi.</p>
            </button>
            <button type="button" onClick={() => setStep("manual")} className="rounded-lg border border-border bg-secondary/40 p-4 text-left transition-colors hover:border-primary">
              <PenLine className="size-5 text-primary" /><p className="mt-3 text-sm font-semibold">Buat Strategi Baru</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Masukkan konteks dan kebutuhan secara manual.</p>
            </button>
          </div>
        )}
        {step === "situation" && (
          <div className="space-y-2">
            {list.map((s) => (
              <button key={s.slug} type="button" className="flex w-full items-center justify-between gap-3 rounded-md border border-border p-3 text-left hover:border-primary" onClick={() => go(addStrategy({ title: `Respons Informasi ${s.name}`, source: "Situasi", situationSlug: s.slug, situationName: s.name, objective: `Meningkatkan ketersediaan informasi terverifikasi terkait ${s.name}.`, platforms: s.platforms.filter((p) => (PLATFORMS as readonly string[]).includes(p)), region: s.regionScope }))}>
                <span><span className="block text-sm font-medium">{s.name}</span><span className="text-xs text-muted-foreground">{s.source}</span></span>
                {s.risk ? <RiskLabel value={s.risk} /> : <span className="rounded-sm bg-secondary px-2 py-1 text-[10px] font-semibold">{s.status}</span>}
              </button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setStep("choose")}><ArrowLeft />Kembali</Button>
          </div>
        )}
        {step === "manual" && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!form.title.trim() || !form.context.trim()) return; go(addStrategy({ title: form.title.trim(), source: "Input Manual", context: form.context, objective: form.objective || "Tujuan komunikasi belum ditentukan.", audience: form.audience, region: form.region || undefined, platforms: platforms.length ? platforms : ["News"] })); }}>
            <Field label="Judul Strategi"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Konteks / Permasalahan"><Textarea required value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} /></Field>
            <Field label="Tujuan Komunikasi"><Input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} /></Field>
            <Field label="Target Audiens"><Input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} /></Field>
            <Field label="Wilayah (opsional)"><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></Field>
            <Field label="Platform / Kanal (opsional)">
              <div className="flex flex-wrap gap-1.5">{PLATFORMS.map((p) => <button key={p} type="button" onClick={() => setPlatforms((c) => c.includes(p) ? c.filter((x) => x !== p) : [...c, p])} className={cn("rounded-md border px-2.5 py-1 text-xs", platforms.includes(p) ? "border-brand bg-brand/15 text-foreground" : "border-border text-muted-foreground")}>{p}</button>)}</div>
            </Field>
            <Field label="Data atau Referensi Pendukung (opsional)"><Textarea value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></Field>
            <div className="flex justify-between pt-2"><Button type="button" variant="ghost" onClick={() => setStep("choose")}><ArrowLeft />Kembali</Button><Button type="submit">Analisis Konteks</Button></div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
