import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  title: z.string().trim().min(1).max(500),
  theme: z.string().trim().min(1).max(500),
  message: z.string().trim().min(1).max(5000),
  points: z.array(z.string().trim().min(1).max(1000)).max(12),
  style: z.array(z.string().trim().max(100)).max(10),
  audience: z.string().max(500).optional(),
  region: z.string().max(500).optional(),
}).strict();

const generationSchema = z.object({
  id: z.string().min(1),
  state: z.enum(["queued", "dreaming", "completed", "failed"]),
  failure_reason: z.string().nullable().optional(),
  assets: z.object({ image: z.string().url().nullable().optional() }).optional(),
}).passthrough();

function buildInfographicPrompt(input: z.infer<typeof inputSchema>) {
  const facts = input.points.length
    ? input.points.map((point, index) => `${index + 1}. ${point}`).join("\n")
    : "Jangan menambahkan angka atau fakta spesifik; gunakan ilustrasi konseptual.";
  return [
    "Create a polished editorial infographic background/illustration for an Indonesian public-information newsroom.",
    "Portrait 9:16 composition. Contemporary editorial design; strong visual hierarchy; clean grid; generous negative space; restrained navy, white, and teal palette; accessible contrast; crisp vector-like shapes with subtle depth.",
    "Title/context: " + input.title + " — " + input.theme,
    "Main message for visual direction: " + input.message,
    "Audience: " + (input.audience || "masyarakat umum"),
    "Region: " + (input.region || "Indonesia"),
    "Visual style: " + (input.style.join(", ") || "faktual, tenang, informatif, ringkas"),
    "Editor-provided facts for visual context only:\n" + facts,
    "IMPORTANT: Do not invent statistics, labels, logos, watermarks, official seals, or charts with invented values. Do not try to render legible text; leave clear blank panels for exact Indonesian typography to be composited by the application. No gibberish letters.",
    "One finished visual asset, not a mockup, not a photo of a poster, no device frame, no extra margins."
  ].join("\n\n").slice(0, 5000);
}

export const startLumaInfographic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) throw new Error("Luma AI belum dikonfigurasi. Tambahkan LUMA_API_KEY pada environment server Vercel.");

    const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations/image", {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        generation_type: "image",
        model: process.env.LUMA_IMAGE_MODEL || "photon-1",
        prompt: buildInfographicPrompt(data),
        aspect_ratio: "9:16",
        format: "png",
        sync: false,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      console.error("[Luma] Image generation request failed", { status: response.status });
      if (response.status === 401 || response.status === 403) throw new Error("Autentikasi Luma gagal. Periksa LUMA_API_KEY pada environment server.");
      if (response.status === 429) throw new Error("Batas penggunaan Luma AI tercapai. Coba lagi nanti.");
      throw new Error("Luma AI gagal menerima permintaan generasi. Coba lagi setelah memeriksa status layanan.");
    }
    const result = generationSchema.parse(await response.json());
    if (result.state === "failed") throw new Error("Luma menolak permintaan generasi visual.");
    return { generationId: result.id, state: result.state };
  });

export const getLumaInfographicStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ generationId: z.string().trim().min(1).max(200) }).strict().parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) throw new Error("Luma AI belum dikonfigurasi. Tambahkan LUMA_API_KEY pada environment server Vercel.");
    const response = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${encodeURIComponent(data.generationId)}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[Luma] Status check failed", { status: response.status });
      if (response.status === 429) throw new Error("Batas pemeriksaan status Luma tercapai. Coba lagi sebentar.");
      throw new Error("Status generasi Luma tidak dapat diperiksa.");
    }
    const result = generationSchema.parse(await response.json());
    return {
      generationId: result.id,
      state: result.state,
      assetUrl: result.state === "completed" ? result.assets?.image ?? null : null,
      failureReason: result.state === "failed" ? result.failure_reason ?? "unknown" : null,
    };
  });
