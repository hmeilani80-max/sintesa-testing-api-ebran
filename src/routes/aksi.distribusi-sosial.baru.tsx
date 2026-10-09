import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Save, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Box, Flow, StatusPill, Trail } from "@/features/aksi/components";
import { useAksi } from "@/features/aksi/context";
import { isEligible } from "@/features/aksi/data";
import { aksiHead } from "@/features/aksi/meta";
import { buildPosts, canSubmitDistribution, groupsOf, labelsOf, PLATFORM_WINDOWS, recommendedPlatforms, recommendedWindowsFor, spreadPotential, periodLabel, PURPOSES, readinessChecks, regeneratePost, scale, selectable, SOCIAL_PLATFORMS, type Post, type Timing } from "@/features/aksi/sosial";
import { AssetThumb, ChecksView, PostMock, PostsBrowser } from "@/features/aksi/sosial-components";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aksi/distribusi-sosial/baru")({
  head: aksiHead("Buat Distribusi", "Rencana, target, paket publikasi, dan review sebelum persetujuan distribusi sosial."),
  component: NewDistribution,
});

const STEPS = ["Rencana", "Target", "Paket Publikasi", "Review & Approval"];
const flip = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const chip = (on: boolean) => cn("rounded-md border px-2.5 py-1 text-xs transition-colors", on ? "border-brand bg-brand/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground");

function NewDistribution() {
  const { productions, createCampaign, accounts: SOCIAL_ACCOUNTS } = useAksi();
  const navigate = useNavigate();
  const approved = productions.filter((p) => isEligible(p, "Sosial"));
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [contentIds, setContentIds] = useState<string[]>([]);
  const [purpose, setPurpose] = useState<string[]>(["Diseminasi Informasi"]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [direction, setDirection] = useState("");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [timing, setTiming] = useState<Timing>({ mode: "Jadwal", start: "2026-10-09", end: "2026-10-10", from: "09:00", to: "18:00" });
  const [staggered, setStaggered] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsKey, setPostsKey] = useState("");
  const [notice, setNotice] = useState("");

  const assets = approved.filter((p) => contentIds.includes(p.id));
  const suggested = recommendedPlatforms(assets.map((a) => a.type));
  const [platformOverride, setPlatformOverride] = useState(false);
  const selectContent = (id: string) => { const ids = flip(contentIds, id); setContentIds(ids); if (!platformOverride) setPlatforms(recommendedPlatforms(approved.filter((a) => ids.includes(a.id)).map((a) => a.type))); };
  const GROUPS = groupsOf(SOCIAL_ACCOUNTS);
  const LABELS = labelsOf(SOCIAL_ACCOUNTS);
  const pool = SOCIAL_ACCOUNTS.filter((a) => platforms.includes(a.platform));
  const chosen = SOCIAL_ACCOUNTS.filter((a) => accounts.includes(a.id) && platforms.includes(a.platform));
  const key = JSON.stringify([contentIds, chosen.map((a) => a.id), timing, staggered, purpose]);
  const planned = useMemo(() => buildPosts(assets, chosen, purpose, timing, staggered).length, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const stale = posts.length > 0 && postsKey !== key;
  const draft = { contentIds, accounts: chosen.map((a) => a.id), posts: stale ? [] : posts, timing, platforms };
  const checks = readinessChecks(draft, productions);
  const sc = scale(draft, planned);
  const addAll = (fn: (a: (typeof pool)[number]) => boolean) => setAccounts((cur) => [...new Set([...cur, ...pool.filter((a) => fn(a) && selectable(a)).map((a) => a.id)])]);
  const prepare = () => { const p = buildPosts(assets, chosen, purpose, timing, staggered); setPosts(p); setPostsKey(key); setNotice(`${p.length} posting berhasil disiapkan.`); };
  const canNext = step === 0 ? !!name.trim() && contentIds.length > 0 && platforms.length > 0 && purpose.length > 0 : step === 1 ? chosen.length > 0 && planned > 0 : step === 2 ? posts.length > 0 && !stale : true;
  const finish = (submit: boolean) => {
    const id = createCampaign({ name: name.trim(), productionId: contentIds[0] ?? "", contentIds, purpose, direction, platforms: [...new Set(chosen.map((a) => a.platform))], accounts: chosen.map((a) => a.id), timing, staggered, posts: stale ? [] : posts }, submit);
    navigate({ to: "/aksi/distribusi-sosial/$id", params: { id } });
  };
  const potential = spreadPotential(draft);
  const Summary = () => <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
    {([[sc.assets, "approved asset"], [sc.accounts, "akun"], [sc.platforms, "platform"], [sc.days, "hari"], [sc.posts, "posting direncanakan"]] as const).map(([v, l]) => <div key={l} className="rounded-md border border-border px-3 py-2"><dt className="font-display text-lg font-semibold">{v}</dt><dd className="text-muted-foreground">{l}</dd></div>)}
  </dl>;

  return (
    <PageShell eyebrow="Aksi · Distribusi Sosial" title={step > 0 ? name.trim() : "Buat Distribusi"} description="Tentukan tujuan, target, dan waktu. Sistem menyiapkan sisanya secara otomatis." actions={<Button asChild variant="outline"><Link to="/aksi/distribusi-sosial"><ArrowLeft />Kembali</Link></Button>}>
      <Trail items={["Aksi", <Link key="l" to="/aksi/distribusi-sosial">Distribusi Sosial</Link>, "Buat Distribusi"]} />
      <div className="mb-4"><Flow steps={STEPS} current={step} /></div>

      {step === 0 && <div className="grid gap-4">
        <Box title="Nama Distribusi"><Input aria-label="Nama distribusi" placeholder="Respons Informasi Demonstrasi Nasional" value={name} onChange={(e) => setName(e.target.value)} /></Box>
        <Box title="Pilih Approved Content" action={<span className="flex items-center gap-1 text-xs font-semibold text-primary"><CheckCircle2 className="size-4" />{contentIds.length} konten dipilih</span>}>
          {!approved.length ? <p className="text-xs text-muted-foreground">Belum ada konten sosial yang disetujui.</p> : <div className="grid gap-3 sm:grid-cols-3">
            {approved.map((p) => { const on = contentIds.includes(p.id); return <div key={p.id} className={cn("relative rounded-lg border-2 p-3 transition-colors", on ? "border-brand bg-brand/10" : "border-border")}>
              <label className="mb-3 flex cursor-pointer items-center justify-between gap-2 text-xs font-medium"><Checkbox checked={on} onCheckedChange={() => selectContent(p.id)} aria-label={`Pilih ${p.title}`} /><span>{on ? "Dipilih" : "Pilih konten"}</span>{on && <CheckCircle2 className="size-4 text-primary" />}</label>
              <AssetThumb asset={p} />
              <p className="mt-2 text-xs font-medium">{p.title}</p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground"><span>{p.type} · v{p.version}</span><StatusPill value="Approved" /></div>
            </div>; })}
          </div>}
        </Box>
        <Box title="Tujuan Distribusi"><div className="flex flex-wrap gap-2">{PURPOSES.map((x) => <Button variant="outline" key={x} type="button" className={chip(purpose.includes(x))} onClick={() => setPurpose(flip(purpose, x))}>{x}</Button>)}</div></Box>
        <Box title="Platform Target" action={suggested.length ? <Button size="sm" variant="ghost" onClick={() => { setPlatforms(suggested); setPlatformOverride(false); }}><Sparkles />Gunakan saran</Button> : undefined}>
          <div className="flex flex-wrap gap-2">{SOCIAL_PLATFORMS.map((pl) => <Button variant="outline" key={pl} type="button" aria-pressed={platforms.includes(pl)} className={chip(platforms.includes(pl))} onClick={() => { setPlatforms(flip(platforms, pl)); setPlatformOverride(true); }}>{pl}{suggested.includes(pl) && <span className="ml-1.5 text-[10px] text-primary">Disarankan</span>}</Button>)}</div>
        </Box>
        <Box title="Arahan Tambahan (opsional)"><Textarea rows={2} aria-label="Arahan tambahan" placeholder="Gunakan bahasa ringkas, faktual, dan arahkan audiens ke sumber informasi terverifikasi." value={direction} onChange={(e) => setDirection(e.target.value)} /></Box>
      </div>}

      {step === 1 && <div className="grid gap-4">
        <Box title="Pilih Akun" action={<span className="text-[11px] text-muted-foreground">{chosen.length} akun dipilih · hanya akun Ready yang dapat dipilih</span>}>
          <div className="mb-3 grid gap-2 text-xs">
            {([["Account Group", GROUPS, (v: string) => (a: (typeof pool)[number]) => a.group === v], ["Label", LABELS, (v: string) => (a: (typeof pool)[number]) => a.label === v], ["Platform", platforms, (v: string) => (a: (typeof pool)[number]) => a.platform === v]] as const).map(([lbl, opts, mk]) =>
              <div key={lbl} className="flex flex-wrap items-center gap-2"><span className="w-28 text-muted-foreground">{lbl}</span>{opts.map((o) => <Button variant="outline" key={o} type="button" className={chip(false)} onClick={() => addAll(mk(o))}>+ {o}</Button>)}</div>)}
            {accounts.length > 0 && <Button variant="ghost" type="button" className="w-fit text-[11px] text-muted-foreground hover:text-foreground" onClick={() => setAccounts([])}>Kosongkan pilihan</Button>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{pool.map((a) => { const ok = selectable(a); return <label key={a.id} className={cn("flex items-start gap-2 rounded-md border border-border p-3 text-xs", !ok && "opacity-50", accounts.includes(a.id) && "border-brand bg-brand/5")}>
            <Checkbox disabled={!ok} checked={accounts.includes(a.id)} onCheckedChange={() => setAccounts(flip(accounts, a.id))} aria-label={`${a.handle} ${a.platform}`} />
            <span className="grid flex-1 gap-0.5"><span className="flex items-center justify-between gap-2 font-medium">{a.handle}<StatusPill value={a.status} /></span><span className="text-muted-foreground">{a.platform} · {a.group} · {a.label}</span></span>
          </label>; })}</div>
        </Box>
        <Box title="Rekomendasi Jadwal Publikasi" action={<Button size="sm" variant="outline" disabled={!chosen.length} onClick={() => { setTiming({ ...timing, from: "09:00", to: "21:00", windows: recommendedWindowsFor([...new Set(chosen.map((a) => a.platform))]) }); setStaggered(true); }}><Sparkles />Gunakan Jadwal Rekomendasi</Button>}>
          <p className="mb-3 text-[11px] text-muted-foreground">Rekomendasi waktu per platform berdasarkan pola aktivitas audiens, histori performa akun, dan tipe konten — estimasi berbasis data simulasi pada PoC.</p>
          <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead className="text-muted-foreground"><tr><th className="py-1.5 font-medium">Platform</th><th className="py-1.5 font-medium">Rekomendasi Waktu</th></tr></thead>
            <tbody>{PLATFORM_WINDOWS.map((w) => <tr key={w.platform} className="border-t border-border"><td className="py-2 font-medium">{w.platform}</td><td className="py-2">{w.from}–{w.to}</td></tr>)}</tbody>
          </table></div>
          {timing.windows && <p className="mt-3 text-xs text-chart-2">Jadwal rekomendasi digunakan — dapat diubah pada jam aktif di bawah.</p>}
        </Box>
        <Box title="Waktu Distribusi">
          <div className="mb-3 flex gap-2">{(["Segera", "Jadwal"] as const).map((m) => <Button variant="outline" key={m} type="button" className={chip(timing.mode === m)} onClick={() => setTiming({ ...timing, mode: m })}>{m === "Segera" ? "Segera Setelah Disetujui" : "Jadwalkan"}</Button>)}</div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="grid gap-1.5"><Label htmlFor="ds">Tanggal mulai</Label><Input id="ds" type="date" value={timing.start} onChange={(e) => setTiming({ ...timing, start: e.target.value })} /></div>
            {timing.mode === "Jadwal" && <div className="grid gap-1.5"><Label htmlFor="de">Tanggal selesai</Label><Input id="de" type="date" value={timing.end} onChange={(e) => setTiming({ ...timing, end: e.target.value })} /></div>}
            <div className="grid gap-1.5"><Label htmlFor="hf">Jam aktif mulai</Label><Input id="hf" type="time" value={timing.from} onChange={(e) => setTiming({ ...timing, from: e.target.value, windows: undefined })} /></div>
            <div className="grid gap-1.5"><Label htmlFor="ht">Jam aktif selesai</Label><Input id="ht" type="time" value={timing.to} onChange={(e) => setTiming({ ...timing, to: e.target.value, windows: undefined })} /></div>
          </div>
          <label className="mt-4 flex items-start gap-3 text-xs"><Switch checked={staggered} onCheckedChange={setStaggered} aria-label="Atur waktu posting otomatis" /><span><span className="font-medium">Atur waktu posting otomatis</span><span className="block text-muted-foreground">Sistem membagi waktu posting antar akun secara otomatis agar distribusi tidak dilakukan serentak.</span></span></label>
        </Box>
        <Box title="Rekomendasi Distribusi"><p className="mb-3 text-sm font-semibold text-primary">Sistem menyarankan {planned} paket publikasi</p><Summary /></Box>
      </div>}

      {step === 2 && <Box title="Paket Publikasi" action={<Button onClick={prepare}><Sparkles />{posts.length ? "Siapkan Ulang Semua" : "Siapkan Semua Paket Publikasi"}</Button>}>
        <p className="mb-3 text-xs text-muted-foreground">Approved Content + Akun + Platform + Jadwal = unit posting siap tayang. Caption disesuaikan otomatis per karakter platform dan divariasikan antar akun, tetap mengacu pada Pesan Utama yang sama.</p>
        {notice && !stale && <p className="mb-3 flex items-center gap-2 text-xs text-chart-2"><CheckCircle2 className="size-4" />{notice}</p>}
        {stale && <p className="mb-3 text-xs text-chart-3">Rencana atau target berubah — siapkan ulang paket publikasi.</p>}
        {posts.length > 0 && !stale ? <PostsBrowser posts={posts} productions={productions} editable
          onEdit={(id, caption) => setPosts((cur) => cur.map((p) => (p.id === id ? { ...p, caption, prep: "Diedit" } : p)))}
          onRegenerate={(id) => setPosts((cur) => cur.map((p) => { const a = productions.find((x) => x.id === p.assetId); return p.id === id && a ? regeneratePost(p, a, purpose) : p; }))} />
          : !stale && <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">{planned} posting direncanakan. Klik “Siapkan Semua Paket Publikasi”.</p>}
      </Box>}

      {step === 3 && <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-4">
          <Box title="Ringkasan"><dl className="grid gap-3 text-xs sm:grid-cols-2">
            {[["Nama Distribusi", name.trim()], ["Approved Content", assets.map((a) => a.title).join(", ")], ["Tujuan", purpose.join(", ")], ["Platform", [...new Set(chosen.map((a) => a.platform))].join(", ")], ["Target Akun", `${chosen.length} akun`], ["Planned Posts", `${posts.length} planned posts`], ["Periode", timing.mode === "Segera" ? "Segera setelah disetujui" : `${periodLabel(timing)} 2026`], ["Waktu", timing.windows?.map((w) => `${w.from}–${w.to}`).join(", ") ?? `${timing.from}–${timing.to}`], ["Pola Penyebaran", staggered ? "Otomatis bertahap" : "Serentak"], ["Potensi Penyebaran", potential]].map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>)}
          </dl></Box>
          <Box title="Preview Sampel" action={<Button size="sm" variant="ghost" onClick={() => setStep(2)}>Lihat Semua Paket Publikasi</Button>}>
            <div className="grid gap-3 sm:grid-cols-3">{["X", "Instagram", "TikTok"].map((pl) => posts.find((p) => p.platform === pl && (pl !== "Instagram" || p.assetType === "Carousel")) ?? posts.find((p) => p.platform === pl)).filter((p): p is Post => !!p).map((p) => <PostMock key={p.id} post={p} asset={productions.find((a) => a.id === p.assetId)} />)}</div>
          </Box>
        </div>
        <div className="grid content-start gap-4">
          <Box title="Potensi Penyebaran"><p className="text-lg font-semibold text-primary">{potential}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Kombinasi konten, akun, platform, dan jadwal mendukung potensi penyebaran {potential.toLowerCase()}. Hasil aktual tetap bergantung pada respons audiens.</p></Box>
          <Box title="Readiness Check"><ChecksView checks={checks} />
            {!canSubmitDistribution(checks) && <p className="mt-3 text-[11px] text-chart-3">Selesaikan masalah di atas sebelum mengajukan.</p>}
          </Box>
          <Button disabled={!canSubmitDistribution(checks)} onClick={() => finish(true)}><Send />Ajukan Persetujuan Distribusi</Button>
          <Button variant="outline" onClick={() => finish(false)}><Save />Simpan sebagai Draft</Button>
        </div>
      </div>}

      <div className="mt-5 flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft />Sebelumnya</Button>
        {step < 3 && <Button disabled={!canNext} onClick={() => setStep(step + 1)}>Lanjut: {STEPS[step + 1]}<ArrowRight /></Button>}
      </div>
    </PageShell>
  );
}
