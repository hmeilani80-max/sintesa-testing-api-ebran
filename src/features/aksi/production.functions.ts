import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const productionPayload = z.object({
  id: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(500),
  type: z.enum(["News Article", "Infografis", "Carousel", "Video Pendek", "Audio / Podcast"]),
  family: z.enum(["News", "Visual", "Video", "Audio"]),
  dest: z.array(z.enum(["Sosial", "News"])).max(2),
  source: z.enum(["Strategi", "Manual"]),
  strategySlug: z.string().max(200).optional(),
  strategyTitle: z.string().max(500).optional(),
  situationSlug: z.string().max(200).optional(),
  situationName: z.string().max(500).optional(),
  brief: z.object({
    theme: z.string().max(500), message: z.string().max(5000),
    points: z.array(z.string().max(1000)).max(100), style: z.array(z.string().max(100)).max(20),
    audience: z.string().max(500).optional(), region: z.string().max(500).optional(),
    channels: z.array(z.string().max(200)).max(100).optional(),
  }),
  status: z.enum(["Draft", "Generating", "Generated"]),
  approval: z.enum(["Menunggu", "Disetujui", "Ditolak", "Perlu Revisi"]).nullable(),
  version: z.number().int().min(0).max(100000),
  variant: z.number().int().min(0).max(100000),
  content: z.object({
    headline: z.string().max(1000), subtitle: z.string().max(2000), lead: z.string().max(5000),
    body: z.string().max(100000), tags: z.array(z.string().max(100)).max(100),
    slides: z.array(z.object({ label: z.string().max(500), text: z.string().max(5000) })).max(100),
    highlights: z.array(z.object({ value: z.string().max(500), label: z.string().max(500) })).max(100),
    caption: z.string().max(10000), duration: z.number().finite().min(0).max(3600),
    format: z.enum(["9:16", "16:9"]), voiceOver: z.boolean(), voice: z.string().max(200),
    transcript: z.string().max(100000),
    assetUrl: z.string().url().optional(),
    assetGenerationId: z.string().max(200).optional(),
  }),
  history: z.array(z.object({
    version: z.number().int().min(0).optional(),
    label: z.string().max(100), at: z.string().max(100),
  })).max(1000),
  approvals: z.array(z.object({
    at: z.string().max(100), actor: z.string().max(200), decision: z.string().max(100),
    version: z.number().int().min(0).optional(), note: z.string().max(5000).optional(),
  })).max(1000),
  reviewNote: z.string().max(5000).optional(),
  submittedAt: z.string().max(100).optional(),
  submittedDay: z.enum(["Hari ini", "Kemarin"]).optional(),
  updated: z.string().max(100),
}).strict();

export const saveProductionItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productionPayload.parse(input))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("production_save_item", {
      p_item: data as unknown as import("@/integrations/supabase/types").Json,
    });
    if (error) {
      if (error.code === "40001") throw new Error("Produksi berubah di sesi lain. Muat ulang sebelum menyimpan lagi.");
      console.error("[Produksi] RPC save gagal", { code: error.code, message: error.message });
      throw new Error("Produksi gagal disimpan. Perubahan lokal belum dianggap tersimpan.");
    }

    // Read the row back through the authenticated session before reporting success.
    // This guards the Generate -> persist -> reload path against false-positive saves.
    const { data: persisted, error: readError } = await context.supabase
      .from("production_items")
      .select("id,snapshot")
      .eq("id", data.id)
      .maybeSingle();
    if (readError || !persisted) {
      console.error("[Produksi] Read-after-write verification failed", { id: data.id, code: readError?.code });
      throw new Error("Produksi tersimpan tetapi belum dapat dibaca kembali. Status belum dianggap berhasil; muat ulang dan periksa akses database.");
    }
    const snapshot = persisted.snapshot as unknown as { id?: unknown; status?: unknown; version?: unknown; content?: { assetUrl?: unknown; assetGenerationId?: unknown } };
    if (snapshot.id !== data.id || snapshot.status !== data.status || snapshot.version !== data.version ||
        (data.content.assetUrl && snapshot.content?.assetUrl !== data.content.assetUrl) ||
        (data.content.assetGenerationId && snapshot.content?.assetGenerationId !== data.content.assetGenerationId)) {
      console.error("[Produksi] Read-after-write snapshot mismatch", { id: data.id, expectedVersion: data.version, actualVersion: snapshot.version });
      throw new Error("Data produksi yang dibaca kembali tidak cocok dengan hasil terbaru. Perubahan belum dianggap berhasil.");
    }
    return { result, persistenceVerified: true, verifiedId: data.id, verifiedVersion: data.version };
  });
