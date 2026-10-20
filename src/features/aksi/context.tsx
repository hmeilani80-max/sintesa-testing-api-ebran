import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

import { field, useCloudState } from "@/hooks/use-cloud-state";
import {
  applyDecision,
  applySubmit,
  buildItems,
  canSubmit,
  invalidateApproval,
  generateContent,
  initialOrders,
  initialProductions,
  type ApprovalStatus,
  type Campaign,
  type ChannelOrder,
  type HistoryEntry,
  type NewsOrder,
  type NewsStatus,
  type OutputType,
  type ProductionBrief,
  type ProductionContent,
  type ProductionItem,
} from "./data";
import {
  advanceExecution,
  executionDone,
  initialCampaigns,
  regeneratePost,
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

const GENERATION_MS = 1400;

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

  const setProductions = field(setCloud, "productions");
  const setCampaigns = field(setCloud, "campaigns");
  const setOrders = field(setCloud, "orders");
  const setAccounts = field(setCloud, "accounts");
  const setLog = field(setCloud, "log");

  const audit = (text: string) =>
    setLog((current) => [{ at: now(), text }, ...current].slice(0, 30));

  const patch = (
    id: string,
    fn: (production: ProductionItem) => ProductionItem,
  ) =>
    setProductions((current) =>
      current.map((production) =>
        production.id === id
          ? { ...fn(production), updated: "Baru saja" }
          : production,
      ),
    );

  const editCampaign = (
    id: string,
    fn: (campaign: Campaign) => Campaign,
  ) =>
    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === id ? fn(campaign) : campaign,
      ),
    );

  const hist = (
    production: ProductionItem,
    label: HistoryEntry["label"],
    version = production.version,
  ): HistoryEntry[] => [
    ...production.history,
    { version, label, at: now() },
  ];

  const runGeneration = (
    id: string,
    settings?: Partial<ProductionContent>,
    sourceItem?: ProductionItem,
  ) => {
    const target = sourceItem ?? productions.find((item) => item.id === id);
    if (!target) return;

    patch(id, (production) => ({
      ...production,
      generationError: undefined,
      status: "Generating",
    }));

    if (target.type === "Infografis") {
      void (async () => {
        try {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          const accessToken = sessionData.session?.access_token;
          if (!accessToken) {
            throw new Error("Sesi login tidak tersedia. Silakan login ulang.");
          }

          const prompt = [
            "Buat satu gambar infografis berbahasa Indonesia untuk kanal informasi publik SINTESA.",
            "Gaya: editorial profesional, bersih, data-driven, kontras tinggi, tipografi mudah dibaca, layout hierarkis, tanpa logo atau watermark palsu.",
            "Tema: " + target.brief.theme,
            "Pesan utama: " + target.brief.message,
            "Fakta dan poin pendukung: " + target.brief.points.filter(Boolean).join("; "),
            "Arahan gaya: " + target.brief.style.join(", "),
            "Audiens: " + (target.brief.audience ?? "masyarakat umum"),
            "Wilayah: " + (target.brief.region ?? "Indonesia"),
            "Jangan mengarang angka, nama, kutipan, atau fakta yang tidak ada pada brief. Gunakan teks singkat dan komposisi visual yang jelas.",
          ].join("\n");

          const created = await fetch("/api/luma-infografis", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: "Bearer " + accessToken,
            },
            body: JSON.stringify({ prompt, aspectRatio: "3:4" }),
          });
          const createdBody = (await created.json()) as { id?: string; error?: string };
          if (!created.ok || !createdBody.id) {
            throw new Error(createdBody.error ?? "Luma gagal memulai generasi gambar.");
          }

          let completedImage: string | undefined;
          for (let attempt = 0; attempt < 45; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const response = await fetch(
              "/api/luma-infografis?id=" + encodeURIComponent(createdBody.id),
              { headers: { authorization: "Bearer " + accessToken } },
            );
            const body = (await response.json()) as {
              state?: string;
              imageUrl?: string;
              error?: string;
              failureReason?: string;
            };
            if (!response.ok) throw new Error(body.error ?? "Gagal memeriksa status generasi Luma.");
            if (body.state === "completed" && body.imageUrl) {
              completedImage = body.imageUrl;
              break;
            }
            if (body.state === "failed") {
              throw new Error(body.failureReason ?? "Generasi gambar Luma gagal.");
            }
          }
          if (!completedImage) {
            throw new Error("Generasi Luma belum selesai setelah 90 detik. Coba regenerate.");
          }

          patch(id, (production) => {
            const variant = production.version === 0 ? 0 : production.variant + 1;
            const version = production.version + 1;
            const keep = {
              duration: production.content.duration,
              format: production.content.format,
              voiceOver: production.content.voiceOver,
              voice: production.content.voice,
              ...settings,
            };
            const generated = generateContent(production.type, production.brief, variant, keep);
            return {
              ...invalidateApproval(production, now(), production.version, version),
              status: "Generated",
              generationError: undefined,
              variant,
              version,
              content: { ...generated, imageUrl: completedImage },
              history: hist(production, production.version === 0 ? "Generated" : "Regenerated", version),
            };
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Generasi infografis gagal.";
          patch(id, (production) => ({ ...production, status: "Draft", generationError: message }));
          audit("Generasi Luma gagal untuk " + target.title + ": " + message);
        }
      })();
      return;
    }

    setTimeout(() => {
      patch(id, (production) => {
        const variant = production.version === 0 ? 0 : production.variant + 1;
        const version = production.version + 1;
        const keep = {
          duration: production.content.duration,
          format: production.content.format,
          voiceOver: production.content.voiceOver,
          voice: production.content.voice,
          ...settings,
        };
        return {
          ...invalidateApproval(production, now(), production.version, version),
          status: "Generated",
          variant,
          version,
          content: generateContent(production.type, production.brief, variant, keep),
          history: hist(production, production.version === 0 ? "Generated" : "Regenerated", version),
        };
      });
    }, GENERATION_MS);
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
        const items = buildItems(brief, types, origin, 21 + productions.length);

        setProductions((current) => [...items, ...current]);

        audit(
          `${items.length} item Produksi dibuat dari ${
            origin.source === "Strategi"
              ? `Strategi “${origin.strategyTitle}”`
              : "brief manual"
          }`,
        );

        for (const item of items) runGeneration(item.id, undefined, item);

        return items.map((item) => item.id);
      },

      generate: (id, settings) => {
        if (settings) {
          patch(id, (production) => ({
            ...production,
            content: { ...production.content, ...settings },
          }));
        }

        runGeneration(id, settings);
      },

      saveContent: (id, content) => {
        patch(id, (production) => {
          const at = now();
          const nextVersion = production.version + 1;

          return {
            ...invalidateApproval(
              production,
              at,
              production.version,
              nextVersion,
            ),
            content,
            version: nextVersion,
            history: hist(production, "Edited", nextVersion),
          };
        });
      },

      submit: (id) => {
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

      regenerate: (id, postId) =>
        editCampaign(id, (campaign) => ({
          ...campaign,
          posts: campaign.posts.map((post) => {
            const asset = productions.find(
              (production) => production.id === post.assetId,
            );

            return post.id === postId && asset
              ? regeneratePost(post, asset, campaign.purpose)
              : post;
          }),
        })),

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
