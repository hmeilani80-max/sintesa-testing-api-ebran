import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateProductionContent } from "./ai-writer.functions";
import { generateSocialCaption } from "./social-ai.functions";
import { getLumaInfographicStatus, startLumaInfographic } from "./luma.functions";
import { saveProductionItem } from "./production.functions";

import { field, useCloudState } from "@/hooks/use-cloud-state";
import {
  applyDecision, applySubmit, buildItems, canSubmit, invalidateApproval, initialOrders, initialProductions,
  type ApprovalStatus, type Campaign, type ChannelOrder, type HistoryEntry, type NewsOrder, type NewsStatus, type OutputType, type ProductionBrief, type ProductionContent, type ProductionItem,
} from "./data";
import {
  advanceExecution,
  executionDone,
  initialCampaigns,
  retry,
  SOCIAL_ACCOUNTS,
  statusAfterDecision,
  type AccountRole,
  type AccountStatus,
  type Post,
  type SocialAccount,
} from "./sosial";

export type ApprovalKind =
  | "Konten"
  | "Distribusi Sosial"
  | "Distribusi News";

export type ApprovalRef = {
  kind: ApprovalKind;
  id: string;
};

export type QueueItem = {
  key: string;
  ref: ApprovalRef;
  title: string;
  group: "Konten" | "Distribusi";
  subtype: string;
  source: string;
  status: ApprovalStatus;
  version?: number | undefined;
  submittedBy: string;
  submittedAt: string;
  submittedDay: string;
};

export type LogEntry = {
  at: string;
  text: string;
};

export type Origin = Pick<
  ProductionItem,
  | "source"
  | "strategySlug"
  | "strategyTitle"
  | "situationSlug"
  | "situationName"
>;

type Value = {
  productions: ProductionItem[];
  campaigns: Campaign[];
  orders: NewsOrder[];
  queue: QueueItem[];
  log: LogEntry[];

  createProductions: (
    brief: ProductionBrief,
    types: OutputType[],
    origin: Origin,
  ) => string[];

  generate: (
    id: string,
    settings?: Partial<ProductionContent>,
  ) => void;

  saveContent: (id: string, content: ProductionContent) => void;
  submit: (id: string) => void;

  decide: (
    ref: ApprovalRef,
    decision: Exclude<ApprovalStatus, "Menunggu">,
    note?: string,
  ) => void;

  createCampaign: (
    c: Omit<
      Campaign,
      "id" | "status" | "approval" | "history" | "approvals"
    >,
    submit: boolean,
  ) => string;

  updatePost: (id: string, postId: string, patch: Partial<Post>) => void;
  regenerate: (id: string, postId: string) => void;
  submitCampaign: (id: string) => void;
  advanceCampaign: (id: string) => boolean;
  retryPost: (id: string, postId: string) => void;
  cancelCampaign: (id: string) => void;

  createOrder: (
    o: Omit<NewsOrder, "id" | "status" | "approval" | "channels"> & {
      channels: (
        | string
        | ChannelOrder
        | { channel: string; schedule: string }
      )[];
    },
  ) => string;

  submitOrder: (id: string) => void;
  sendOrder: (id: string) => boolean;

  setChannel: (
    id: string,
    channel: string,
    status: NewsStatus,
    url?: string,
  ) => void;

  accounts: SocialAccount[];
  setAccountConnection: (id: string, status: AccountStatus) => void;
  setAccountGroup: (id: string, group: string) => void;
  setAccountLabel: (id: string, label: string) => void;
  setAccountRoles: (id: string, roles: AccountRole[]) => void;
};

const g = globalThis as unknown as {
  __spektraAksiCtx?: React.Context<Value | undefined>;
};

const Ctx =
  g.__spektraAksiCtx ??
  (g.__spektraAksiCtx = createContext<Value | undefined>(undefined));

const now = () =>
  new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });



export function AksiProvider({ children }: { children: ReactNode }) {
  const [cloud, setCloud] = useCloudState("aksi", {
    productions: initialProductions,
    campaigns: initialCampaigns,
    orders: initialOrders,
    accounts: SOCIAL_ACCOUNTS,
    log: [
      {
        at: "10:05",
        text: "Publikasi Artikel Demonstrasi diajukan oleh Tim Media",
      },
    ] as LogEntry[],
  });

  const { productions, campaigns, orders, accounts, log } = cloud;
  const [databaseReady, setDatabaseReady] = useState(false);
  const productionsRef = useRef(productions);
  const databaseReadyRef = useRef(databaseReady);
  const activeLumaPolls = useRef(new Set<string>());
  productionsRef.current = productions;
  databaseReadyRef.current = databaseReady;

  // Tracks the result of the relational database read.
  // This flag does not trigger writes to Supabase.
  const [databaseLoadStatus, setDatabaseLoadStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");

  // Load relational Produksi records only.
  // Never upsert the entire frontend state during initialization.
  useEffect(() => {
    let cancelled = false;

    async function loadProductions() {
      try {
        const { data, error } = await supabase
          .from("production_items")
          .select("id,snapshot,updated_at")
          .order("updated_at", { ascending: false });

        if (error) throw error;
        if (cancelled) return;

        const restored = (data ?? [])
          .map((row) => row.snapshot as unknown as ProductionItem)
          .filter(
            (item) =>
              item &&
              typeof item.id === "string" &&
              typeof item.title === "string",
          );

        // An empty database must remain empty.
        // Do not replace it with demo productions.
        setCloud((current) => ({
          ...current,
          productions: restored,
        }));

        setDatabaseLoadStatus("loaded");
        setDatabaseReady(true);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "[Produksi] Gagal memuat database relasional.",
          error,
        );

        // Do not write fallback/demo data to the relational database.
        setDatabaseLoadStatus("error");
        setDatabaseReady(false);
      }
    }

    void loadProductions();

    return () => {
      cancelled = true;
    };
  }, [setCloud]);

  // Poll Luma jobs independently from unrelated dashboard state updates.
  useEffect(() => {
    const timer = setInterval(() => {
      if (!databaseReadyRef.current) return;
      const jobs = productionsRef.current.filter((item) => item.type === "Infografis" && item.status === "Generating" && item.content.assetGenerationId);
      for (const item of jobs) {
        const generationId = item.content.assetGenerationId!;
        if (activeLumaPolls.current.has(generationId)) continue;
        activeLumaPolls.current.add(generationId);
        void (async () => {
          try {
            const status = await getLumaInfographicStatus({ data: { generationId } });
            const current = productionsRef.current.find((candidate) => candidate.id === item.id);
            if (!current || current.status !== "Generating" || current.content.assetGenerationId !== generationId) return;
            if (status.state === "completed" && status.assetUrl) {
              const version = current.version + 1;
              const points = current.brief.points.filter(Boolean).slice(0, 6);
              const next: ProductionItem = {
                ...invalidateApproval(current, now(), current.version, version),
                status: "Generated", approval: current.approval === "Disetujui" ? null : current.approval,
                version, variant: current.version === 0 ? 0 : current.variant + 1,
                content: { ...current.content, headline: current.title, subtitle: "", lead: current.brief.message, body: "", tags: [], slides: [],
                  highlights: points.map((point) => ({ value: "•", label: point })), caption: current.brief.message, duration: 0, format: "9:16",
                  voiceOver: false, voice: "Informatif", transcript: "", assetUrl: status.assetUrl, assetGenerationId: generationId },
                history: [...current.history, { version, label: current.version === 0 ? "Generated" : "Regenerated", at: now() }],
                updated: "Baru saja",
              };
              await saveProductionItem({ data: next });
              setProductions((items) => items.map((candidate) => candidate.id === current.id ? next : candidate));
              audit(`${next.title} v${version} berhasil dibuat oleh Luma AI`);
            } else if (status.state === "failed") {
              const { assetGenerationId: _jobId, assetUrl: _assetUrl, ...cleanContent } = current.content;
              const failed: ProductionItem = { ...current, status: "Draft", content: cleanContent, updated: "Gagal dibuat" };
              await saveProductionItem({ data: failed });
              setProductions((items) => items.map((candidate) => candidate.id === current.id ? failed : candidate));
              audit(`Generasi Luma untuk ${current.title} gagal; item dikembalikan ke Draft.`);
            }
          } catch (error) {
            console.error("[Produksi] Luma status polling failed", { id: item.id, message: error instanceof Error ? error.message : "unknown" });
          } finally {
            activeLumaPolls.current.delete(generationId);
          }
        })();
      }
    }, 2500);
    return () => clearInterval(timer);
  }, []);

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
      // Infografis uses Luma as an asynchronous job; do not mark it Generated before the asset exists.
      if (current.type === "Infografis") {
        const job = await startLumaInfographic({ data: {
          title: current.title, theme: current.brief.theme, message: current.brief.message,
          points: current.brief.points, style: current.brief.style,
          audience: current.brief.audience, region: current.brief.region,
        } });
        const pending: ProductionItem = {
          ...current, status: "Generating",
          content: { ...current.content, headline: current.title, lead: current.brief.message,
            caption: current.brief.message, format: "9:16", voiceOver: false, duration: 0,
            assetGenerationId: job.generationId, assetUrl: undefined },
          updated: "Luma AI sedang membuat visual",
        };
        await saveProductionItem({ data: pending });
        setProductions((items) => items.map((item) => item.id === id ? pending : item));
        audit(`${current.title}: job visual Luma ${job.generationId} dimulai`);
        return;
      }
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
      audit(`${next.title} v${version} berhasil dibuat oleh ${next.type === "Infografis" ? "Luma AI" : "Gemini AI"}`);
    } catch (error) {
      console.error("[Produksi] AI generation/persistence failed", error);
      patch(id, (p) => ({ ...p, status: "Draft" }));
      audit(`Generate ${current.title} gagal; konten tidak ditandai Generated. Periksa konfigurasi AI atau koneksi database.`);
      throw error;
    }
  };

  const value = useMemo<Value>(() => {
    const queue: QueueItem[] = [];

    const meta = (item: {
      submittedBy?: string;
      submittedAt?: string;
      submittedDay?: string;
    }) => ({
      submittedBy: item.submittedBy ?? "—",
      submittedAt: item.submittedAt ?? "—",
      submittedDay: item.submittedDay ?? "Hari ini",
    });

    const subtypeByOutput: Record<string, string> = {
      "News Article": "News",
      "Video Pendek": "Video",
      "Audio / Podcast": "Audio",
      Infografis: "Infografis",
      Carousel: "Carousel",
    };

    for (const production of productions) {
      if (!production.approval) continue;

      queue.push({
        key: `c-${production.id}`,
        ref: { kind: "Konten", id: production.id },
        title: production.title,
        group: "Konten",
        subtype: subtypeByOutput[production.type] ?? production.type,
        source: "Produksi",
        status: production.approval,
        version: production.version,
        ...meta(production),
      });
    }

    for (const campaign of campaigns) {
      if (!campaign.approval) continue;

      queue.push({
        key: `s-${campaign.id}`,
        ref: { kind: "Distribusi Sosial", id: campaign.id },
        title: campaign.name,
        group: "Distribusi",
        subtype: "Sosial",
        source: "Distribusi Sosial",
        status: campaign.approval,
        ...meta(campaign),
      });
    }

    for (const order of orders) {
      if (!order.approval) continue;

      queue.push({
        key: `n-${order.id}`,
        ref: { kind: "Distribusi News", id: order.id },
        title: order.title ?? `Publikasi ${order.channels.length} Kanal`,
        group: "Distribusi",
        subtype: "News",
        source: "Distribusi News",
        status: order.approval,
        ...meta(order),
      });
    }

    return {
      productions,
      campaigns,
      orders,
      queue,
      log,
      accounts,

      createProductions: (brief, types, origin) => {
        if (databaseLoadStatus !== "loaded") {
          console.error(
            "[Produksi] Pembuatan item diblokir karena status database belum siap.",
          );
          return [];
        }

        const items = buildItems(brief, types, origin, 21 + productions.length);
        setProductions((cur) => [...items, ...cur]);
        audit(`${items.length} item Produksi dibuat dari ${origin.source === "Strategi" ? `Strategi “${origin.strategyTitle}”` : "brief manual"}`);
        for (const it of items) void runGeneration(it.id, undefined, it).catch(() => undefined);
        return items.map((i) => i.id);
      },
      generate: (id, settings) => {
        if (databaseLoadStatus !== "loaded") return;
        void runGeneration(id, settings).catch(() => undefined);
      },
      saveContent: (id, content) => {
        if (databaseLoadStatus !== "loaded") return;
        patch(id, (p) => {
          const at = now();
          const nextVersion = p.version + 1;
          return {
            ...invalidateApproval(p, at, p.version, nextVersion),
            content,
            version: nextVersion,
            history: hist(p, "Edited", nextVersion),
          };
        });
      },
      submit: (id) => {
        if (databaseLoadStatus !== "loaded") return;

        const production = productions.find((item) => item.id === id);
        if (!production || !canSubmit(production)) return;

        patch(id, (item) => ({
          ...applySubmit(
            item,
            item.submittedBy ??
              (item.type === "News Article"
                ? "Tim Editorial"
                : "Tim Produksi"),
            now(),
            item.version,
          ),
          reviewNote: undefined,
          history: hist(item, "Diajukan"),
        }));

        audit(
          `${production.title} v${production.version} diajukan ke Persetujuan`,
        );
      },

      decide: (ref, decision, note) => {
        if (ref.kind === "Konten" && databaseLoadStatus !== "loaded") return;

        const at = now();

        if (ref.kind === "Konten") {
          patch(ref.id, (production) => ({
            ...applyDecision(
              production,
              decision,
              at,
              production.version,
              note,
            ),
            reviewNote: note,
            history: hist(
              production,
              decision === "Disetujui" ? "Approved" : decision,
            ),
          }));
        }

        if (ref.kind === "Distribusi Sosial") {
          setCampaigns((current) =>
            current.map((campaign) => {
              if (campaign.id !== ref.id) return campaign;

              const status = statusAfterDecision(
                decision,
                campaign.timing.mode,
              );

              return {
                ...applyDecision(campaign, decision, at, undefined, note),
                status,
                posts:
                  decision === "Disetujui"
                    ? campaign.posts.map((post) => ({
                        ...post,
                        exec: "Scheduled" as const,
                      }))
                    : campaign.posts,
                history: [
                  {
                    at,
                    text:
                      decision === "Disetujui"
                        ? `Distribusi Disetujui — ${status}`
                        : `${status}${note ? ` — “${note}”` : ""}`,
                  },
                  ...campaign.history,
                ],
              };
            }),
          );
        }

        if (ref.kind === "Distribusi News") {
          setOrders((current) =>
            current.map((order) =>
              order.id === ref.id
                ? {
                    ...applyDecision(order, decision, at, undefined, note),
                    status:
                      decision === "Disetujui"
                        ? "Approved"
                        : decision === "Ditolak"
                          ? "Ditolak"
                          : "Draft Order",
                  }
                : order,
            ),
          );
        }

        audit(
          `${ref.kind} ${ref.id}: ${decision}${
            note ? ` — “${note}”` : ""
          }`,
        );
      },

      createCampaign: (campaign, submit) => {
        const id = `CMP-${String(16 + campaigns.length - 2).padStart(3, "0")}`;
        const at = now();

        const history = [
          { at, text: "Distribusi dibuat" },
          { at, text: `${campaign.contentIds.length} approved asset dipilih` },
          { at, text: `${campaign.accounts.length} akun target dipilih` },
          {
            at,
            text: `${campaign.posts.length} Paket Publikasi disiapkan oleh sistem`,
          },
        ].reverse();

        const base: Campaign = {
          ...campaign,
          id,
          status: "Draft",
          approval: null,
          approvals: [],
          history,
        };

        const item = submit
          ? {
              ...applySubmit(base, "Tim Digital", at),
              status: "Menunggu Persetujuan" as const,
              history: [
                { at, text: "Diajukan untuk Persetujuan Distribusi" },
                ...history,
              ],
            }
          : base;

        setCampaigns((current) => [item, ...current]);

        audit(`Distribusi ${id} dibuat${submit ? " dan diajukan" : ""}`);

        return id;
      },

      updatePost: (id, postId, postPatch) =>
        editCampaign(id, (campaign) => ({
          ...campaign,
          posts: campaign.posts.map((post) =>
            post.id === postId
              ? { ...post, ...postPatch, prep: "Diedit" }
              : post,
          ),
        })),

      regenerate: (id, postId) => {
        const campaign = campaigns.find((item) => item.id === id);
        const post = campaign?.posts.find((item) => item.id === postId);
        const asset = post && productions.find((item) => item.id === post.assetId);
        if (!campaign || !post || !asset) return;
        void generateSocialCaption({ data: {
          platform: post.platform as "X" | "Instagram" | "TikTok" | "Facebook" | "Threads" | "YouTube",
          handle: post.handle,
          assetTitle: asset.title,
          assetType: asset.type,
          headline: asset.content.headline || asset.title,
          message: asset.brief.message,
          facts: asset.brief.points,
          purpose: campaign.purpose,
          direction: campaign.direction,
          previousVariant: post.variant,
        } }).then(({ caption }) => {
          editCampaign(id, (current) => ({
            ...current,
            posts: current.posts.map((item) => item.id === postId
              ? { ...item, caption, variant: item.variant + 1, prep: "Siap", reason: undefined }
              : item),
          }));
          audit("Caption AI " + post.platform + " untuk " + asset.title + " berhasil dibuat; menunggu review editor.");
        }).catch((error: unknown) => {
          console.error("[Distribusi Sosial] AI caption generation failed", error);
          audit("Generate caption AI untuk " + post.platform + " gagal. Caption lama dipertahankan; periksa konfigurasi AI.");
        });
      },

      submitCampaign: (id) => {
        const at = now();

        editCampaign(id, (campaign) => ({
          ...applySubmit(campaign, campaign.submittedBy ?? "Tim Digital", at),
          status: "Menunggu Persetujuan",
          history: [
            {
              at,
              text:
                campaign.status === "Perlu Perubahan"
                  ? "Diajukan kembali"
                  : "Diajukan untuk Persetujuan Distribusi",
            },
            ...campaign.history,
          ],
        }));

        audit(`Distribusi ${id} diajukan untuk Persetujuan Distribusi`);
      },

      advanceCampaign: (id) => {
        const campaign = campaigns.find((item) => item.id === id);

        if (
          !campaign ||
          campaign.approval !== "Disetujui" ||
          (campaign.status !== "Dijadwalkan" &&
            campaign.status !== "Sedang Berjalan")
        ) {
          return false;
        }

        const at = now();

        editCampaign(id, (item) => {
          const posts = advanceExecution(item.posts);
          const done = executionDone(posts);

          return {
            ...item,
            posts,
            status: done ? "Selesai" : "Sedang Berjalan",
            history: [
              ...(done ? [{ at, text: "Distribusi selesai" }] : []),
              {
                at,
                text:
                  item.status === "Dijadwalkan"
                    ? "Eksekusi dimulai"
                    : "Gelombang posting diproses",
              },
              ...item.history,
            ],
          };
        });

        return true;
      },

      retryPost: (id, postId) =>
        editCampaign(id, (campaign) => {
          const posts = campaign.posts.map((post) =>
            post.id === postId && post.exec === "Failed"
              ? retry(post)
              : post,
          );

          return {
            ...campaign,
            posts,
            status: executionDone(posts) ? "Selesai" : campaign.status,
            history: [
              { at: now(), text: `Posting ${postId} dicoba ulang` },
              ...campaign.history,
            ],
          };
        }),

      cancelCampaign: (id) =>
        editCampaign(id, (campaign) => ({
          ...campaign,
          status: "Dibatalkan",
          posts: campaign.posts.map((post) =>
            post.exec === "Published"
              ? post
              : { ...post, exec: "Cancelled" },
          ),
          history: [
            { at: now(), text: "Distribusi dibatalkan" },
            ...campaign.history,
          ],
        })),

      createOrder: ({ channels, ...order }) => {
        const id = `DN-${String(13 + orders.length - 2).padStart(3, "0")}`;

        const resolved: ChannelOrder[] = channels.map((channel) =>
          typeof channel === "string"
            ? { channel, status: "Draft Order" }
            : { ...channel, status: "Draft Order" },
        );

        setOrders((current) => [
          {
            ...order,
            id,
            channels: resolved,
            status: "Draft Order",
            approval: null,
          },
          ...current,
        ]);

        audit(`Order ${id} dibuat untuk ${resolved.length} kanal`);

        return id;
      },

      submitOrder: (id) => {
        setOrders((current) =>
          current.map((order) =>
            order.id === id
              ? {
                  ...applySubmit(
                    order,
                    order.submittedBy ?? "Tim Media",
                    now(),
                  ),
                  status: "Menunggu Approval",
                }
              : order,
          ),
        );

        audit(`Order ${id} diajukan untuk Approval Distribusi`);
      },

      sendOrder: (id) => {
        const order = orders.find((item) => item.id === id);

        if (!order || order.approval !== "Disetujui") return false;

        setOrders((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "Dikirim",
                  channels: item.channels.map((channel) => ({
                    ...channel,
                    status: "Dikirim",
                  })),
                }
              : item,
          ),
        );

        audit(`Order ${id} dikirim ke ${order.channels.length} kanal`);

        return true;
      },

      setChannel: (id, channel, status, url) => {
        setOrders((current) =>
          current.map((order) => {
            if (order.id !== id) return order;

            const channels = order.channels.map((item) =>
              item.channel === channel
                ? { ...item, status, url: url ?? item.url }
                : item,
            );

            const done = channels.every(
              (item) =>
                item.status === "Selesai" || item.status === "Ditolak",
            );

            return {
              ...order,
              channels,
              status: done ? "Selesai" : order.status,
            };
          }),
        );

        audit(`Order ${id} · ${channel}: ${status}`);
      },

      setAccountConnection: (id, status) => {
        setAccounts((current) =>
          current.map((account) =>
            account.id === id
              ? { ...account, status, updatedAt: "Baru saja" }
              : account,
          ),
        );

        audit(
          `Akun ${id}: status koneksi diubah menjadi ${
            status === "Ready"
              ? "Terhubung"
              : status === "Busy"
                ? "Perlu Autentikasi Ulang"
                : "Terputus"
          }`,
        );
      },

      setAccountGroup: (id, group) =>
        setAccounts((current) =>
          current.map((account) =>
            account.id === id
              ? { ...account, group, updatedAt: "Baru saja" }
              : account,
          ),
        ),

      setAccountLabel: (id, label) =>
        setAccounts((current) =>
          current.map((account) =>
            account.id === id
              ? { ...account, label, updatedAt: "Baru saja" }
              : account,
          ),
        ),

      setAccountRoles: (id, roles) =>
        setAccounts((current) =>
          current.map((account) =>
            account.id === id
              ? { ...account, roles, updatedAt: "Baru saja" }
              : account,
          ),
        ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productions,
    campaigns,
    orders,
    log,
    accounts,
    databaseLoadStatus,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAksi() {
  const context = useContext(Ctx);

  if (!context) {
    throw new Error("useAksi must be used within AksiProvider");
  }

  return context;
}

/** Each Produksi item is itself one output; kept as {production, output} for distribution pages. */
export function findOutput(
  productions: ProductionItem[],
  outputId: string,
) {
  const production = productions.find((item) => item.id === outputId);

  return production
    ? { production, output: production }
    : undefined;
}