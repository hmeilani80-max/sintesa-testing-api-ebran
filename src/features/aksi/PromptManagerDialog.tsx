import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const OUTPUTS = [
  { type: "News Article", family: "News" },
  { type: "Infografis", family: "Visual" },
  { type: "Carousel", family: "Visual" },
  { type: "Video Pendek", family: "Video" },
  { type: "Audio / Podcast", family: "Audio" },
  { type: "Distribusi Sosial", family: "Social" },
] as const;
type OutputType = (typeof OUTPUTS)[number]["type"];
type PromptRow = { id: string; output_type: OutputType; output_family: string; prompt_text: string; version: number; updated_at: string };

export function PromptManagerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [rows, setRows] = useState<PromptRow[]>([]);
  const [selected, setSelected] = useState<OutputType>("News Article");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const current = useMemo(() => rows.find((row) => row.output_type === selected), [rows, selected]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setStatus("");
    void supabase.from("production_prompt_templates").select("id,output_type,output_family,prompt_text,version,updated_at").order("output_family").then(({ data, error }) => {
      if (cancelled) return;
      if (error) setStatus("Gagal memuat prompt. Pastikan login aktif dan migration Supabase sudah diterapkan.");
      else {
        const loaded = (data ?? []) as PromptRow[];
        setRows(loaded);
        const first = loaded.find((row) => row.output_type === selected);
        if (first) setDraft(first.prompt_text);
        else setStatus("Prompt belum tersedia untuk tipe ini. Simpan prompt baru untuk membuatnya.");
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (current) setDraft(current.prompt_text);
    else if (open && rows.length) setDraft("");
  }, [selected, current, open, rows.length]);

  const save = async () => {
    if (draft.trim().length < 20) {
      setStatus("Prompt minimal 20 karakter.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setStatus("Sesi login tidak ditemukan. Silakan login ulang.");
        return;
      }
      const output = OUTPUTS.find((item) => item.type === selected)!;
      const nextVersion = (current?.version ?? 0) + 1;
      const { data, error } = await supabase.from("production_prompt_templates").upsert({
        output_type: selected,
        output_family: output.family,
        prompt_text: draft.trim(),
        version: nextVersion,
        updated_by: authData.user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "output_type" }).select("id,output_type,output_family,prompt_text,version,updated_at").single();
      if (error) {
        setStatus("Gagal menyimpan prompt. Periksa hak akses Supabase dan coba lagi.");
        return;
      }
      const row = data as PromptRow;
      setRows((previous) => [...previous.filter((item) => item.output_type !== selected), row]);
      setStatus(`Prompt tersimpan · versi ${row.version}. Generasi berikutnya akan memakai prompt ini.`);
    } catch {
      setStatus("Terjadi kesalahan saat menyimpan prompt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Prompt Manager · Sintesa</DialogTitle>
          <DialogDescription>Ubah instruksi AI langsung di aplikasi. Perubahan disimpan ke Supabase dan dipakai oleh generasi berikutnya. Jangan masukkan API key atau secret.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Tipe output</Label>
            <Select value={selected} onValueChange={(value) => setSelected(value as OutputType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{OUTPUTS.map((item) => <SelectItem key={item.type} value={item.type}>{item.family} · {item.type}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            Placeholder tersedia: <code>{"{{theme}}"}</code>, <code>{"{{message}}"}</code>, <code>{"{{points}}"}</code>, <code>{"{{style}}"}</code>, <code>{"{{audience}}"}</code>, <code>{"{{region}}"}</code>, <code>{"{{channels}}"}</code>.
            {current && <p className="mt-1">Versi tersimpan: {current.version} · Diperbarui: {new Date(current.updated_at).toLocaleString("id-ID")}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prompt-editor">Instruksi prompt</Label>
            <Textarea id="prompt-editor" value={draft} onChange={(event) => setDraft(event.target.value)} rows={14} maxLength={20000} placeholder="Tulis instruksi AI dan gunakan placeholder brief..." disabled={loading} className="font-mono text-xs" />
            <p className="text-right text-xs text-muted-foreground">{draft.length.toLocaleString("id-ID")} / 20.000 karakter</p>
          </div>
          {status && <p role="status" className="rounded-md border border-border p-3 text-sm">{status}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Tutup</Button>
          <Button onClick={() => void save()} disabled={loading || saving || draft.trim().length < 20}>{saving ? "Menyimpan…" : "Simpan Prompt"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
