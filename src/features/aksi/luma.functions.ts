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

const responseSchema = z.object({
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
    "Create a polished editorial infographic BACKGROUND/ILLUSTRATION for an Indonesian public-information newsroom.",
    "Portrait 9:16 composition. Professional, contemporary Indonesian editorial design; strong visual hierarchy; clean grid; generous negative space; restrained navy, white, and teal palette; accessible contrast; crisp vector-like shapes with subtle depth.",
    "Theme: " + input.theme,
    "Main message for visual direction: " + input.message,
    "Audience: " + (input.audience || "masyarakat umum"),
    "Region: " + (input.region || "Indonesia"),
    "Visual style: " + (input.style.join(", ") || "faktual, tenang, informatif, ringkas"),
    "Visual references / facts supplied by the editor (use only for visual context):\n" + facts,
    "IMPORTANT: Do not invent statistics, labels, logos, watermarks, official seals, charts with invented values, or legible text. Leave clear blank panels/space for exact Indonesian typography to be composited by the application. No gibberish letters.",
    "Create one finished visual asset, not a mockup, not a photo of a poster, no device frame, no extra margins."
  ].join("\n\n").slice(0, 5000);
}

export const generateLumaInfographic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) {
      throw new Error("Luma AI belum dikonfigurasi. Tambahkan LUMA_API_KEY pada environment server Vercel.");
    }

    const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations/image", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generation_type: "image",
        model: process.env.LUMA_IMAGE_MODEL || "photon-1",
        prompt: buildInfographicPrompt(data),
        aspect_ratio: "9:16",
        format: "png",
        sync: true,
        sync_timeout: 55,
      }),
      signal: AbortSignal.timeout(58000),
    });

    if (!response.ok) {
      console.error("[Luma] Image generation request failed", { status: response.status });
      if (response.status === 401 || response.status === 403) {
        throw new Error("Autentikasi Luma gagal. Periksa LUMA_API_KEY pada environment server.");
      }
      if (response.status === 429) {
        throw new Error("Batas penggunaan Luma AI tercapai. Coba lagi nanti.");
      }
      throw new Error("Luma AI gagal membuat aset infografis. Coba lagi setelah memeriksa status layanan.");
    }

    const result = responseSchema.parse(await response.json());
    if (result.state === "failed") {
      console.error("[Luma] Generation failed", { id: result.id, reason: result.failure_reason ?? "unknown" });
      throw new Error("Generasi visual Luma gagal. Perbaiki prompt atau coba generate ulang.");
    }
    if (result.state !== "completed" || !result.assets?.image) {
      throw new Error("Luma belum mengembalikan aset gambar yang selesai. Coba generate ulang.");
    }

    return {
      generationId: result.id,
      state: result.state,
      assetUrl: result.assets.image,
      prompt: buildInfographicPrompt(data),
    };
  });
