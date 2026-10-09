import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { StrategyStatus } from "./data";
import type { BahanTanggapan, FaqItem, PesanTanggapan } from "./bahan";

export function StatusBadge({ status }: { status: StrategyStatus }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-sm px-2 py-1 text-[10px] font-semibold",
    status === "Siap Dilaksanakan" ? "bg-chart-2/15 text-chart-2" : status === "Diteruskan ke Aksi" ? "bg-primary/15 text-primary" : status === "Dalam Penyusunan" ? "bg-chart-3/15 text-chart-3" : "bg-secondary text-secondary-foreground")}>{status}</span>;
}

function SubPanel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>{action}</div>
      {children}
    </div>
  );
}

/**
 * Paket Bahan Tanggapan (Revisi 8 / S51). Bahan dibentuk otomatis via buildBahanTanggapan (lihat bahan.ts)
 * dan dapat diedit ringan di sini sebelum diteruskan ke Produksi. AI tidak menetapkan juru bicara secara final.
 */
export function BahanTanggapanPanel({
  bahan, onChange, onRegenerate, onLihatSumber, onTeruskan, onSimpanArsip,
}: {
  bahan: BahanTanggapan;
  onChange: (next: BahanTanggapan) => void;
  onRegenerate: () => void;
  onLihatSumber: () => void;
  onTeruskan: () => void;
  onSimpanArsip: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  const setPesan = (idx: number, text: string) => {
    const next: PesanTanggapan[] = bahan.pesan.map((p, i) => (i === idx ? { ...p, text } : p));
    onChange({ ...bahan, pesan: next });
  };
  const setTalkingPoint = (idx: number, text: string) => {
    const next = bahan.talkingPoints.map((t, i) => (i === idx ? text : t));
    onChange({ ...bahan, talkingPoints: next });
  };
  const setFaq = (idx: number, patch: Partial<FaqItem>) => {
    const next = bahan.faq.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    onChange({ ...bahan, faq: next });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Paket Bahan Tanggapan</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Dibuat otomatis dari Kajian, Pesan Utama, dan data Situasi. Dapat diedit ringan sebelum diteruskan ke Produksi.</p>
        </div>
        <span className="rounded-sm bg-secondary px-2 py-1 text-[10px] font-semibold text-secondary-foreground">Simulasi</span>
      </div>

      <SubPanel title="A. Pilihan Pesan">
        <div className="grid gap-3 md:grid-cols-3">
          {bahan.pesan.map((p, i) => (
            <div key={p.kind} className="rounded-md border border-border p-3">
              <div className="mb-1.5 flex items-center justify-between"><p className="text-xs font-semibold text-primary">Pesan {p.kind}</p>
                <Button variant="ghost" size="sm" className="h-auto px-1.5 py-0.5 text-[10px]" onClick={() => setEditing(editing === `pesan-${i}` ? null : `pesan-${i}`)}>{editing === `pesan-${i}` ? "Selesai" : "Edit"}</Button>
              </div>
              {editing === `pesan-${i}` ? <Textarea aria-label={`Pesan ${p.kind}`} value={p.text} onChange={(e) => setPesan(i, e.target.value)} /> : <p className="text-xs leading-5">{p.text}</p>}
            </div>
          ))}
        </div>
      </SubPanel>

      <SubPanel title="B. Talking Points" action={<Button variant="ghost" size="sm" className="h-auto px-1.5 py-0.5 text-[10px]" onClick={() => setEditing(editing === "tp" ? null : "tp")}>{editing === "tp" ? "Selesai" : "Edit"}</Button>}>
        <ul className="space-y-2">
          {bahan.talkingPoints.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-xs leading-5">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              {editing === "tp" ? <Input aria-label={`Talking point ${i + 1}`} className="h-7 text-xs" value={t} onChange={(e) => setTalkingPoint(i, e.target.value)} /> : <span>{t}</span>}
            </li>
          ))}
        </ul>
      </SubPanel>

      <SubPanel title="C. Fakta Pendukung" action={<Button variant="link" size="sm" className="h-auto px-0 text-[10px]" onClick={onLihatSumber}>Lihat Sumber</Button>}>
        <div className="space-y-2">
          {bahan.fakta.map((f, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-secondary/40 px-3 py-2 text-xs">
              <span><span className="font-semibold text-primary">{f.pesan}</span> — {f.fakta}</span>
              <span className="text-[10px] text-muted-foreground">{f.sumber}</span>
            </div>
          ))}
        </div>
      </SubPanel>

      <SubPanel title="D. FAQ">
        <div className="space-y-3">
          {bahan.faq.map((f, i) => (
            <div key={i} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold">Q: {f.question}</p>
                <Button variant="ghost" size="sm" className="h-auto px-1.5 py-0.5 text-[10px]" onClick={() => setEditing(editing === `faq-${i}` ? null : `faq-${i}`)}>{editing === `faq-${i}` ? "Selesai" : "Edit"}</Button>
              </div>
              {editing === `faq-${i}` ? <Textarea aria-label={`Jawaban FAQ ${i + 1}`} className="mt-1.5" value={f.answer} onChange={(e) => setFaq(i, { answer: e.target.value })} /> : <p className="mt-1 text-xs leading-5 text-muted-foreground">A: {f.answer}</p>}
            </div>
          ))}
        </div>
      </SubPanel>

      <SubPanel title="E. Juru Bicara" action={<Button variant="ghost" size="sm" className="h-auto px-1.5 py-0.5 text-[10px]" onClick={() => setEditing(editing === "jubir" ? null : "jubir")}>{editing === "jubir" ? "Selesai" : "Edit"}</Button>}>
        {editing === "jubir" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Input aria-label="Nama/Jabatan" className="h-8 text-xs" value={bahan.juruBicara.nama} onChange={(e) => onChange({ ...bahan, juruBicara: { ...bahan.juruBicara, nama: e.target.value } })} placeholder="Nama / Jabatan" />
            <Input aria-label="Unit" className="h-8 text-xs" value={bahan.juruBicara.unit} onChange={(e) => onChange({ ...bahan, juruBicara: { ...bahan.juruBicara, unit: e.target.value } })} placeholder="Unit" />
            <Input aria-label="Status Penetapan" className="h-8 text-xs" value={bahan.juruBicara.statusPenetapan} onChange={(e) => onChange({ ...bahan, juruBicara: { ...bahan.juruBicara, statusPenetapan: e.target.value } })} placeholder="Status Penetapan" />
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Nama/Jabatan", bahan.juruBicara.nama], ["Unit", bahan.juruBicara.unit], ["Status Penetapan", bahan.juruBicara.statusPenetapan], ["Materi", bahan.juruBicara.materi.length ? bahan.juruBicara.materi.join(", ") : "Belum Ditetapkan"]].map(([l, v]) => (
              <div key={l}><dt className="text-[10px] uppercase text-muted-foreground">{l}</dt><dd className="mt-1 text-xs font-medium">{v}</dd></div>
            ))}
          </dl>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">Penetapan juru bicara merupakan keputusan pimpinan, bukan keputusan sistem AI.</p>
      </SubPanel>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
        <Button variant="outline" size="sm" onClick={onRegenerate}><RefreshCw />Generate Ulang Bahan</Button>
        <Button variant="outline" size="sm" onClick={onLihatSumber}>Lihat Sumber</Button>
        <Button variant="outline" size="sm" onClick={onSimpanArsip}>Simpan ke Arsip</Button>
        <Button size="sm" onClick={onTeruskan}>Teruskan ke Produksi</Button>
      </div>
    </div>
  );
}
