import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stat, StatusPill, Trail } from "@/features/aksi/components";
import { useAksi } from "@/features/aksi/context";
import { ACCOUNT_ROLES, CONN_LABEL, groupsOf, labelsOf, PERMISSION_LABELS, ROLE_PERMISSIONS, type AccountRole, type SocialAccount } from "@/features/aksi/sosial";

export const Route = createFileRoute("/administrasi/akun-sosial")({
  head: () => ({ meta: [{ title: "Pengelolaan Akun Sosial — SINTESA" }, { name: "description", content: "Kelola akun resmi, pengelompokan, label, dan hak akses untuk Distribusi Sosial." }] }),
  component: AkunSosial,
});

function AkunSosial() {
  const { accounts, setAccountConnection, setAccountGroup, setAccountLabel, setAccountRoles } = useAksi();
  const [detail, setDetail] = useState<SocialAccount | null>(null);
  const groups = groupsOf(accounts);
  const total = accounts.length;
  const aktif = accounts.filter((a) => a.status === "Ready").length;
  const bermasalah = total - aktif;

  const toggleRole = (a: SocialAccount, role: AccountRole) => setAccountRoles(a.id, a.roles.includes(role) ? a.roles.filter((r) => r !== role) : [...a.roles, role]);
  const reconnect = (a: SocialAccount) => setAccountConnection(a.id, "Ready");

  return (
    <PageShell eyebrow="Administrasi" title="Pengelolaan Akun Sosial" description="Kelola akun resmi yang telah terhubung ke sistem — sumber pilihan akun untuk Distribusi Sosial → Target. PoC: akun dummy, koneksi disimulasikan.">
      <Trail items={["Administrasi", "Pengelolaan Akun Sosial"]} />
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Stat value={total} label="Total Akun" />
        <Stat value={aktif} label="Akun Aktif" />
        <Stat value={bermasalah} label="Akun Bermasalah" />
        <Stat value={groups.length} label="Account Group" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[920px] text-left text-xs">
          <thead className="border-b border-border text-muted-foreground"><tr>
            <th className="px-4 py-3 font-medium">Username</th><th className="px-4 py-3 font-medium">Platform</th><th className="px-4 py-3 font-medium">Account Group</th>
            <th className="px-4 py-3 font-medium">Label</th><th className="px-4 py-3 font-medium">Status Koneksi</th><th className="px-4 py-3 font-medium">Penanggung Jawab</th>
            <th className="px-4 py-3 font-medium">Hak Akses</th><th className="px-4 py-3 font-medium">Terakhir Diperbarui</th><th className="px-4 py-3" />
          </tr></thead>
          <tbody>{accounts.map((a) => (
            <tr key={a.id} className="border-b border-border last:border-0 hover:bg-accent/40">
              <td className="px-4 py-3 font-medium">{a.handle}</td>
              <td className="px-4 py-3">{a.platform}</td>
              <td className="px-4 py-3">{a.group}</td>
              <td className="px-4 py-3">{a.label}</td>
              <td className="px-4 py-3"><StatusPill value={a.status} />{" "}<span className="text-muted-foreground">{CONN_LABEL[a.status]}</span></td>
              <td className="px-4 py-3">{a.pic}</td>
              <td className="px-4 py-3">{a.roles.join(", ")}</td>
              <td className="px-4 py-3 text-muted-foreground">{a.updatedAt}</td>
              <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => setDetail(a)}>Detail Akun</Button></td>
            </tr>))}</tbody>
        </table>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-xl">
          {detail && <>
            <DialogHeader><DialogTitle>{detail.handle} · {detail.platform}</DialogTitle></DialogHeader>
            <div className="grid gap-4 text-xs">
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <span>Status Koneksi: <StatusPill value={detail.status} /> <span className="text-muted-foreground">({CONN_LABEL[detail.status]})</span></span>
                {detail.status !== "Ready" && <Button size="sm" onClick={() => { reconnect(detail); setDetail({ ...detail, status: "Ready" }); }}>Sambungkan Ulang</Button>}
              </div>
              <div className="grid gap-1.5"><span className="font-medium">Pengelompokan Akun</span>
                <Select value={detail.group} onValueChange={(v) => { setAccountGroup(detail.id, v); setDetail({ ...detail, group: v }); }}>
                  <SelectTrigger aria-label="Account Group"><SelectValue /></SelectTrigger>
                  <SelectContent>{groupsOf(accounts).map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5"><span className="font-medium">Pengaturan Label</span>
                <Select value={detail.label} onValueChange={(v) => { setAccountLabel(detail.id, v); setDetail({ ...detail, label: v }); }}>
                  <SelectTrigger aria-label="Label"><SelectValue /></SelectTrigger>
                  <SelectContent>{labelsOf(accounts).map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-2 font-medium">Pengaturan Kewenangan · Hak Akses Diberikan</p>
                <div className="flex flex-wrap gap-2">{ACCOUNT_ROLES.map((r) => <label key={r} className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5"><input type="checkbox" checked={detail.roles.includes(r)} onChange={() => { toggleRole(detail, r); setDetail({ ...detail, roles: detail.roles.includes(r) ? detail.roles.filter((x) => x !== r) : [...detail.roles, r] }); }} />{r}</label>)}</div>
              </div>
              <div>
                <p className="mb-2 font-medium">Matriks Hak Akses per Peran</p>
                <table className="w-full text-left text-[11px]"><thead className="text-muted-foreground"><tr><th className="py-1 font-medium">Peran</th>{Object.values(PERMISSION_LABELS).map((l) => <th key={l} className="py-1 font-medium">{l}</th>)}</tr></thead>
                  <tbody>{ACCOUNT_ROLES.map((r) => <tr key={r} className="border-t border-border"><td className="py-1.5 font-medium">{r}</td>{Object.keys(PERMISSION_LABELS).map((p) => <td key={p} className="py-1.5">{ROLE_PERMISSIONS[r][p as keyof typeof PERMISSION_LABELS] ? "✓" : "—"}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
