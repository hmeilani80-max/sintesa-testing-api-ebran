import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const providerSchema = z.enum(["Gemini", "Luma", "OpenAI", "Anthropic", "Grok"]);
const familySchema = z.enum(["News", "Visual", "Video", "Audio"]);
const outputTypeSchema = z.enum(["News Article", "Infografis", "Carousel", "Video Pendek", "Audio / Podcast"]);

const providerConfig = {
  Gemini: { env: "GEMINI_API_KEY", models: ["gemini-2.5-flash"], capabilities: ["News Article", "Carousel", "Video Pendek", "Audio / Podcast"] },
  Luma: { env: "LUMA_API_KEY", models: ["photon-1"], capabilities: ["Infografis"] },
  OpenAI: { env: "OPENAI_API_KEY", models: ["gpt-4.1-mini"], capabilities: [] },
  Anthropic: { env: "ANTHROPIC_API_KEY", models: ["claude-sonnet-4-5"], capabilities: [] },
  Grok: { env: "XAI_API_KEY", models: ["grok-3-mini"], capabilities: [] },
} as const;

function isConfigured(provider: keyof typeof providerConfig) {
  const key = providerConfig[provider].env;
  return Boolean(process.env[key]?.trim());
}

/** Returns metadata only. Never returns secret values or raw provider errors. */
export const getAiProviderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({
    providers: Object.entries(providerConfig).map(([name, config]) => ({
      name,
      configured: isConfigured(name as keyof typeof providerConfig),
      envName: config.env,
      models: config.models,
      capabilities: config.capabilities,
      status: isConfigured(name as keyof typeof providerConfig) ? "configured-needs-test" : "missing-secret",
    })),
  }));

const verifyInput = z.object({
  provider: providerSchema,
  model: z.string().trim().min(1).max(100),
  family: familySchema,
}).strict();

export const verifyAiProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => verifyInput.parse(input))
  .handler(async ({ data }) => {
    const config = providerConfig[data.provider];
    if (!config.models.includes(data.model as never)) {
      throw new Error("Model tidak ada dalam allowlist server untuk provider ini.");
    }
    if (!config.capabilities.includes(data.family as never)) {
      return { ok: false, provider: data.provider, model: data.model, family: data.family, status: "unsupported-capability", message: "Provider ini belum memiliki adapter produksi yang mendukung jenis output tersebut." };
    }
    const apiKey = process.env[config.env]?.trim();
    if (!apiKey) {
      return { ok: false, provider: data.provider, model: data.model, family: data.family, outputType: data.outputType, status: "missing-secret", message: `Secret server ${config.env} belum diatur di Vercel.` };
    }

    try {
      if (data.provider === "Gemini") {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(data.model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with the single word OK." }] }], generationConfig: { maxOutputTokens: 8, temperature: 0 } }),
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) return { ok: false, provider: data.provider, model: data.model, family: data.family, outputType: data.outputType, status: response.status === 401 || response.status === 403 ? "invalid-credentials" : response.status === 429 ? "rate-limited" : "provider-error", message: response.status === 429 ? "Provider membatasi permintaan; coba lagi nanti." : "Uji API Gemini gagal. Periksa secret, izin, dan nama model." };
        const payload = z.object({ candidates: z.array(z.unknown()).min(1) }).passthrough().safeParse(await response.json());
        if (!payload.success) return { ok: false, provider: data.provider, model: data.model, family: data.family, outputType: data.outputType, status: "invalid-response", message: "Respons Gemini tidak sesuai format yang diharapkan." };
      } else if (data.provider === "Luma") {
        // A successful Luma test intentionally creates a tiny real image job. No key is exposed.
        const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations/image", {
          method: "POST", headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ generation_type: "image", model: data.model, prompt: "Minimal abstract teal and navy geometric test image, no text, no logos.", aspect_ratio: "9:16", format: "jpg", sync: false }),
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) return { ok: false, provider: data.provider, model: data.model, family: data.family, status: response.status === 401 || response.status === 403 ? "invalid-credentials" : response.status === 429 ? "rate-limited" : "provider-error", message: response.status === 429 ? "Luma membatasi permintaan; coba lagi nanti." : "Uji generasi Luma gagal. Periksa secret, kuota, dan nama model." };
        const payload = z.object({ id: z.string().min(1), state: z.string().optional() }).passthrough().safeParse(await response.json());
        if (!payload.success) return { ok: false, provider: data.provider, model: data.model, family: data.family, status: "invalid-response", message: "Luma tidak mengembalikan ID job yang valid." };
        return { ok: true, provider: data.provider, model: data.model, family: data.family, outputType: data.outputType, ok: supportsOutput, status: supportsOutput ? "provider-tested" : "connected-unsupported-capability", message: supportsOutput ? "Autentikasi dan permintaan generasi Luma berhasil. Ini membuat job gambar uji di akun Luma." : "Koneksi provider berhasil, tetapi adapter ini tidak mendukung output yang dipilih.", generationId: payload.data.id };
      }
      return { ok: supportsOutput, provider: data.provider, model: data.model, family: data.family, outputType: data.outputType, status: supportsOutput ? "provider-tested" : "connected-unsupported-capability", message: supportsOutput ? "Permintaan uji provider berhasil. Ini memvalidasi koneksi API, bukan alur simpan/muat ulang produksi." : "Kredensial/API terjangkau, tetapi belum ada adapter produksi untuk output ini." };
    } catch (error) {
      console.error("[AI Model Hub] Provider verification failed", { provider: data.provider, family: data.family, outputType: data.outputType, kind: error instanceof Error ? error.name : "unknown" });
      return { ok: false, provider: data.provider, model: data.model, family: data.family, outputType: data.outputType, status: "network-error", message: "Provider tidak dapat dijangkau atau waktu uji habis." };
    }
  });
