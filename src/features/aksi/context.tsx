import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateProductionContent } from "./ai-writer.functions";
import { saveProductionItem } from "./production.functions";

import { field, useCloudState } from "@/hooks/use-cloud-state";
import {
  applyDecision, applySubmit, buildItems, canSubmit, invalidateApproval, generateContent, initialOrders, initialProductions,
  type ApprovalStatus, type Campaign, type ChannelOrder, type HistoryEntry, type NewsOrder, type NewsStatus, type OutputType, type ProductionBrief, type ProductionContent, type ProductionItem,
} from "./data";
import { advanceExecution, executionDone, initialCampaigns, regeneratePost, retry, SOCIAL_ACCOUNTS, statusAfterDecision, type AccountRole, type AccountStatus, type Post, type SocialAccount } from "./sosial";

export type ApprovalKind = "Konten" | "Distribusi Sosial" | "Distribusi News";
export type ApprovalRef = { kind: ApprovalKind; id: string };
export type QueueItem = { key: string; ref: ApprovalRef; title: string; group: "Konten" | "Distribusi"; subtype: string; source: string; status: ApprovalStatus; version?: number | undefined; submittedBy: string; submittedAt: string; submittedDay: string };
export type LogEntry = { at: string; text: string };
export type Origin = Pick<ProductionItem, "source" | "strategySlug" | "strategyTitle" | "situationSlug" | "situationName">;

type Value = {
  productions: ProductionItem[]; campaigns: Campaign[]; orders: NewsOrder[]; queue: QueueItem[]; log: LogEntry[];
  createProductions: (brief: ProductionBrief, types: OutputType[], origin: Origin) => string[];
  generate: (id: string, settings?: Partial<ProductionContent>) => void;
  saveContent: (id: string, content: ProductionContent) => void;
  submit: (id: string) => void;
  decide: (ref: ApprovalRef, decision: Exclude<ApprovalStatus, "Menunggu">, note?: string) => void;
  createCampaign: (c: Omit<Campaign, "id" | "status" | "approval" | "history" | "approvals">, submit: boolean) => string;
  updatePost: (id: string, postId: string, patch: Partial<Post>) => void;
  regenerate: (id: string, postId: string) => void;
  submitCampaign: (id: string) => void;
  advanceCampaign: (id: string) => boolean;
  retryPost: (id: string, postId: string) => void;
  cancelCampaign: (id: string) => void;
  createOrder: (o: Omit<NewsOrder, "id" | "status" | "approval" | "channels"> & { channels: (string | ChannelOrder | { channel: string; schedule: string })[] }) => string;
  submitOrder: (id: string) => void;
  sendOrder: (id: string) => boolean;
  setChannel: (id: string, channel: string, status: NewsStatus, url?: string) => void;
  accounts: SocialAccount[];
  setAccountConnection: (id: string, status: AccountStatus) => void;
  setAccountGroup: (id: string, group: string) => void;
  setAccountLabel: (id: string, label: string) => void;
  setAccountRoles: (id: string, roles: AccountRole[]) => void;
};

const g = globalThis as unknown as { __spektraAksiCtx?: React.Context<Value | undefined> };
const Ctx = g.__spektraAksiCtx ?? (g.__spektraAksiCtx = createContext<Value | undefined>(undefined));

const now = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
const GENERATION_MS = 1400;

export function AksiProvider({ children }: { children: ReactNode }) {
  const [cloud, setCloud] = useCloudState("aksi", {
    productions: initialProductions, campaigns: initialCampaigns, orders: initialOrders, accounts: SOCIAL_ACCOUNTS,
    log: [{ at: "10:05", text: "Publikasi Artikel Demonstrasi diajukan oleh Tim Media" }] as LogEntry[],
  });
  const { productions, campaigns, orders, accounts, log } = cloud;
  const [databaseReady, setDatabaseReady] = useState(false);

  // Relational Produksi becomes the operational source after loading succeeds.
  // Keep app_state/useCloudState intact as a compatibility fallback during rollout.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("production_items")
          .select("id,snapshot,updated_at")
          .order("updated_at", { ascending: false });
        if (error) throw error;
        if (cancelled) return;
        if (data?.length) {
          const restored = data
            .map((row) => row.snapshot as unknown as ProductionItem)
            .filter((item) => item && typeof item.id === "string" && typeof item.title === "string");
          if (restored.length) setCloud((current) => ({ ...current, productions: restored }));
        }
      } catch (error) {
        console.error("[Produksi] Gagal memuat database relasional; memakai app_state sementara.", error);
      } finally {
        if (!cancelled) {
          setDatabaseReady(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [setCloud]);

  useEffect(() => {
    if (!databaseReady) return;
    let cancelled = false;
    void (async () => {
      for (const item of productions) {
        if (cancelled) return;
        const snapshot = item as unknown as import("@/integrations/supabase/types").Json;
        const { error } = await supabase.from("production_items").upsert({
          id: item.id,
          title: item.title,
          output_type: item.type,
          output_family: item.family,
          destinations: item.dest as unknown as import("@/integrations/supabase/types").Json,
          source: item.source,
          strategy_slug: item.strategySlug ?? null,
          strategy_title: item.strategyTitle ?? null,
          situation_slug: item.situationSlug ?? null,
          situation_name: item.situationName ?? null,
          production_status: item.status,
          approval_status: item.approval,
          active_version: item.version,
          variant: item.variant,
          brief: item.brief as unknown as import("@/integrations/supabase/types").Json,
          content: item.content as unknown as import("@/integrations/supabase/types").Json,
          review_note: item.reviewNote ?? null,
          submitted_by: item.submittedBy ?? null,
          submitted_at: item.submittedAt ?? null,
          submitted_day: item.submittedDay ?? null,
          snapshot,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
        if (error) {
          console.error("[Produksi] Gagal menyimpan item", item.id, error);
          continue;
        }
        if (item.version > 0) {
          // Keep version snapshots immutable: never overwrite an existing version.
          const { data: existingVersion, error: lookupVersionError } = await supabase
            .from("production_item_versions")
            .select("id")
            .eq("production_id", item.id)
            .eq("version_number", item.version)
            .maybeSingle();
          if (lookupVersionError) {
            console.error("[Produksi] Gagal memeriksa versi", item.id, lookupVersionError);
          } else if (!existingVersion) {
            const { error: versionError } = await supabase.from("production_item_versions").insert({
              production_id: item.id,
              version_number: item.version,
              snapshot,
              change_label: item.history[item.history.length - 1]?.label ?? "Snapshot",
              created_by: item.submittedBy ?? null,
            });
            if (versionError) console.error("[Produksi] Gagal menyimpan versi", item.id, versionError);
          }
        }
        for (const [index, event] of (item.approvals ?? []).entries()) {
          const eventKey = item.id + ":" + index + ":" + event.decision + ":" + event.at;
          const { error: eventError } = await supabase.from("production_approval_events").upsert({
            production_id: item.id,
            version_number: event.version ?? null,
            decision: event.decision,
            actor: event.actor,
            note: event.note ?? null,
            occurred_at: event.at,
            event_key: eventKey,
          }, { onConflict: "event_key" });
          if (eventError) console.error("[Produksi] Gagal menyimpan event approval", item.id, eventError);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [productions, databaseReady]);

  const setProductions = field(setCloud, "productions");
  const setCampaigns = field(setCloud, "campaigns");
  const setOrders = field(setCloud, "orders");
  const setAccounts = field(setCloud, "accounts");
  const setLog = field(setCloud, "log");
  const audit = (text: string) => setLog((cur) => [{ at: now(), text }, ...cur].slice(0, 30));
  const patch = (id: string, fn: (p: ProductionItem) => ProductionItem) => setProductions((cur) => cur.map((p) => (p.id === id ? { ...fn(p), updated: "Baru saja" } : p)));
  const editCampaign = (id: string, fn: (c: Campaign) => Campaign) => setCampaigns((cur) => cur.map((c) => (c.id === id ? fn(c) : c)));
  const hist = (p: ProductionItem, label: HistoryEntry["label"], version = p.version): HistoryEntry[] => [...p.history, { version, label, at: now() }];

  const runGeneration = async (id: string, settings?: Partial<ProductionContent>, suppliedItem?: ProductionItem) => {
    const current = suppliedItem ?? productions.find((item) => item.id === id);
    if (!current) return;
    patch(id, (p) => ({ ...p, status: "Generating" }));
    try {
      // No local/dummy fallback: a missing or failed Gemini configuration must fail visibly.
      const aiContent = await generateProductionContent({ data: { type: current.type, brief: current.brief } });
      const variant = current.version === 0 ? 0 : current.variant + 1;
      const version = current.version + 1;
      const content: ProductionContent = { ...aiContent, ...settings };
      const next: ProductionItem = {
        ...invalidateApproval(current, now(), current.version, version),
        status: "Generated", approval: current.approval === "Disetujui" ? null : current.approval,
        variant, version, content,
        history: [...current.history, { version, label: current.version === 0 ? "Generated" : "Regenerated", at: now() }],
        updated: "Baru saja",
      };
      // Persist before presenting the item as successfully generated.
      await saveProductionItem({ data: next });
      setProductions((items) => items.map((item) => item.id === id ? next : item));
      audit(`${next.title} v${version} berhasil dibuat oleh Gemini AI`);
    } catch (error) {
      console.error("[Produksi] AI generation/persistence failed", error);
      patch(id, (p) => ({ ...p, status: "Draft" }));
      audit(`Generate ${current.title} gagal; konten tidak ditandai Generated. Periksa konfigurasi AI atau koneksi database.`);
      throw error;
    }
  };

  const value = useMemo<Value>(() => {
    const queue: QueueItem[] = [];
    const meta = (x: { submittedBy?: string | undefined; submittedAt?: string | undefined; submittedDay?: string | undefined }) => ({ submittedBy: x.submittedBy ?? "—", submittedAt: x.submittedAt ?? "—", submittedDay: x.submittedDay ?? "Hari ini" });
    const sub: Record<string, string> = { "News Article": "News", "Video Pendek": "Video", "Audio / Podcast": "Audio", Infografis: "Infografis", Carousel: "Carousel" };
    for (const p of productions) if (p.approval) queue.push({ key: `c-${p.id}`, ref: { kind: "Konten", id: p.id }, title: p.title, group: "Konten", subtype: sub[p.type] ?? p.type, source: "Produksi", status: p.approval, version: p.version, ...meta(p) });
    for (const c of campaigns) if (c.approval) queue.push({ key: `s-${c.id}`, ref: { kind: "Distribusi Sosial", id: c.id }, title: c.name, group: "Distribusi", subtype: "Sosial", source: "Distribusi Sosial", status: c.approval, ...meta(c) });
    for (const o of orders) if (o.approval) queue.push({ key: `n-${o.id}`, ref: { kind: "Distribusi News", id: o.id }, title: o.title ?? `Publikasi ${o.channels.length} Kanal`, group: "Distribusi", subtype: "News", source: "Distribusi News", status: o.approval, ...meta(o) });

    return {
      productions, campaigns, orders, queue, log, accounts,
      createProductions: (brief, types, origin) => {
        const items = buildItems(brief, types, origin, 21 + productions.length);
        setProductions((cur) => [...items, ...cur]);
        audit(`${items.length} item Produksi dibuat dari ${origin.source === "Strategi" ? `Strategi “${origin.strategyTitle}”` : "brief manual"}`);
        for (const it of items) void runGeneration(it.id, undefined, it).catch(() => undefined);
        return items.map((i) => i.id);
      },
      generate: (id, settings) => { void runGeneration(id, settings).catch(() => undefined); },
      saveContent: (id, content) => patch(id, (p) => { const at = now(); const nextVersion = p.version + 1; return { ...invalidateApproval(p, at, p.version, nextVersion), content, version: nextVersion, history: hist(p, "Edited", nextVersion) }; }),
      submit: (id) => {
        const p = productions.find((x) => x.id === id);
        if (!p || !canSubmit(p)) return;
        patch(id, (x) => ({ ...applySubmit(x, x.submittedBy ?? (x.type === "News Article" ? "Tim Editorial" : "Tim Produksi"), now(), x.version), reviewNote: undefined, history: hist(x, "Diajukan") }));
        audit(`${p.title} v${p.version} diajukan ke Persetujuan`);
      },
      decide: (ref, decision, note) => {
        const at = now();
        if (ref.kind === "Konten") patch(ref.id, (p) => ({ ...applyDecision(p, decision, at, p.version, note), reviewNote: note, history: hist(p, decision === "Disetujui" ? "Approved" : decision) }));
        if (ref.kind === "Distribusi Sosial") setCampaigns((cur) => cur.map((c) => {
          if (c.id !== ref.id) return c;
          const status = statusAfterDecision(decision, c.timing.mode);
          return { ...applyDecision(c, decision, at, undefined, note), status, posts: decision === "Disetujui" ? c.posts.map((p) => ({ ...p, exec: "Scheduled" as const })) : c.posts, history: [{ at, text: decision === "Disetujui" ? `Distribusi Disetujui — ${status}` : `${status}${note ? ` — “${note}”` : ""}` }, ...c.history] };
        }));
        if (ref.kind === "Distribusi News") setOrders((cur) => cur.map((o) => (o.id === ref.id ? { ...applyDecision(o, decision, at, undefined, note), status: decision === "Disetujui" ? "Approved" : decision === "Ditolak" ? "Ditolak" : "Draft Order" } : o)));
        audit(`${ref.kind} ${ref.id}: ${decision}${note ? ` — “${note}”` : ""}`);
      },
      createCampaign: (c, submit) => {
        const id = `CMP-${String(16 + campaigns.length - 2).padStart(3, "0")}`;
        const at = now();
        const history = [{ at, text: "Distribusi dibuat" }, { at, text: `${c.contentIds.length} approved asset dipilih` }, { at, text: `${c.accounts.length} akun target dipilih` }, { at, text: `${c.posts.length} Paket Publikasi disiapkan oleh sistem` }].reverse();
        const base: Campaign = { ...c, id, status: "Draft", approval: null, approvals: [], history };
        const item = submit ? { ...applySubmit(base, "Tim Digital", at), status: "Menunggu Persetujuan" as const, history: [{ at, text: "Diajukan untuk Persetujuan Distribusi" }, ...history] } : base;
        setCampaigns((cur) => [item, ...cur]);
        audit(`Distribusi ${id} dibuat${submit ? " dan diajukan" : ""}`);
        return id;
      },
      updatePost: (id, postId, p) => editCampaign(id, (c) => ({ ...c, posts: c.posts.map((x) => (x.id === postId ? { ...x, ...p, prep: "Diedit" } : x)) })),
      regenerate: (id, postId) => editCampaign(id, (c) => {
        return { ...c, posts: c.posts.map((x) => { const a = productions.find((p) => p.id === x.assetId); return x.id === postId && a ? regeneratePost(x, a, c.purpose) : x; }) };
      }),
      submitCampaign: (id) => {
        const at = now();
        editCampaign(id, (c) => ({ ...applySubmit(c, c.submittedBy ?? "Tim Digital", at), status: "Menunggu Persetujuan", history: [{ at, text: c.status === "Perlu Perubahan" ? "Diajukan kembali" : "Diajukan untuk Persetujuan Distribusi" }, ...c.history] }));
        audit(`Distribusi ${id} diajukan untuk Persetujuan Distribusi`);
      },
      advanceCampaign: (id) => {
        const c = campaigns.find((x) => x.id === id);
        if (!c || c.approval !== "Disetujui" || (c.status !== "Dijadwalkan" && c.status !== "Sedang Berjalan")) return false;
        const at = now();
        editCampaign(id, (x) => {
          const posts = advanceExecution(x.posts);
          const done = executionDone(posts);
          return { ...x, posts, status: done ? "Selesai" : "Sedang Berjalan", history: [...(done ? [{ at, text: "Distribusi selesai" }] : []), { at, text: x.status === "Dijadwalkan" ? "Eksekusi dimulai" : "Gelombang posting diproses" }, ...x.history] };
        });
        return true;
      },
      retryPost: (id, postId) => editCampaign(id, (c) => {
        const posts = c.posts.map((p) => (p.id === postId && p.exec === "Failed" ? retry(p) : p));
        return { ...c, posts, status: executionDone(posts) ? "Selesai" : c.status, history: [{ at: now(), text: `Posting ${postId} dicoba ulang` }, ...c.history] };
      }),
      cancelCampaign: (id) => editCampaign(id, (c) => ({ ...c, status: "Dibatalkan", posts: c.posts.map((p) => (p.exec === "Published" ? p : { ...p, exec: "Cancelled" })), history: [{ at: now(), text: "Distribusi dibatalkan" }, ...c.history] })),
      createOrder: ({ channels, ...o }) => {
        const id = `DN-${String(13 + orders.length - 2).padStart(3, "0")}`;
        const resolved: ChannelOrder[] = channels.map((c) => (typeof c === "string" ? { channel: c, status: "Draft Order" } : { ...c, status: "Draft Order" }));
        setOrders((cur) => [{ ...o, id, channels: resolved, status: "Draft Order", approval: null }, ...cur]);
        audit(`Order ${id} dibuat untuk ${resolved.length} kanal`);
        return id;
      },
      submitOrder: (id) => { setOrders((cur) => cur.map((o) => (o.id === id ? { ...applySubmit(o, o.submittedBy ?? "Tim Media", now()), status: "Menunggu Approval" } : o))); audit(`Order ${id} diajukan untuk Approval Distribusi`); },
      sendOrder: (id) => {
        const o = orders.find((x) => x.id === id);
        if (!o || o.approval !== "Disetujui") return false;
        setOrders((cur) => cur.map((x) => (x.id === id ? { ...x, status: "Dikirim", channels: x.channels.map((ch) => ({ ...ch, status: "Dikirim" })) } : x)));
        audit(`Order ${id} dikirim ke ${o.channels.length} kanal`);
        return true;
      },
      setChannel: (id, channel, status, url) => {
        setOrders((cur) => cur.map((o) => {
          if (o.id !== id) return o;
          const channels = o.channels.map((ch) => (ch.channel === channel ? { ...ch, status, url: url ?? ch.url } : ch));
          const done = channels.every((ch) => ch.status === "Selesai" || ch.status === "Ditolak");
          return { ...o, channels, status: done ? "Selesai" : o.status };
        }));
        audit(`Order ${id} · ${channel}: ${status}`);
      },
      setAccountConnection: (id, status) => { setAccounts((cur) => cur.map((a) => (a.id === id ? { ...a, status, updatedAt: "Baru saja" } : a))); audit(`Akun ${id}: status koneksi diubah menjadi ${status === "Ready" ? "Terhubung" : status === "Busy" ? "Perlu Autentikasi Ulang" : "Terputus"}`); },
      setAccountGroup: (id, group) => setAccounts((cur) => cur.map((a) => (a.id === id ? { ...a, group, updatedAt: "Baru saja" } : a))),
      setAccountLabel: (id, label) => setAccounts((cur) => cur.map((a) => (a.id === id ? { ...a, label, updatedAt: "Baru saja" } : a))),
      setAccountRoles: (id, roles) => setAccounts((cur) => cur.map((a) => (a.id === id ? { ...a, roles, updatedAt: "Baru saja" } : a))),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productions, campaigns, orders, log, accounts]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAksi() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAksi must be used within AksiProvider");
  return c;
}

/** Each Produksi item is itself one output; kept as {production, output} for distribution pages. */
export function findOutput(productions: ProductionItem[], outputId: string) {
  const p = productions.find((x) => x.id === outputId);
  return p ? { production: p, output: p } : undefined;
}
