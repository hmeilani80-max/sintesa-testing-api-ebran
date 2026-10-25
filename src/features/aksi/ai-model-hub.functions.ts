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
  return Boolean(process.env[providerConfig[provider].env]?.trim());
}

/** Returns only configuration metadata; secret values are never serialized to the browser. */
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
  outputType: outputTypeSchema,
}).strict();

export const verifyAiProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => verifyInput.parse(input))
  .handler(async ({ data }) => {
    const config = providerConfig[data.provider];
    if (!config.models.includes(data.model as never)) {
      throw new Error("Model tidak ada dalam allowlist server untuk provider ini.");
    }

    const apiKey = process.env[config.env]?.trim();
    if (!apiKey) {
      return { ok: false, connectionOk: false, provider: data.provider, model: data.model, family: data.family, outputType: data.outputType, status: "missing-secret", message: "Secret server " + config.env + " belum diatur di Vercel." };
    }

    const supportsOutput = config.capabilities.includes(data.outputType as never);
    try {
      let response: Response;
      if (data.provider === "Gemini") {
        response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(data.model) + ":generateContent?key=" + encodeURIComponent(apiKey), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with the single word OK." }] }], generationConfig: { maxOutputTokens: 8, temperature: 0 } }),
          signal: AbortSignal.timeout(15000),
        });
      } else if (data.provider === "OpenAI") {
        response = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: "Bearer " + apiKey }, signal: AbortSignal.timeout(12000) });
      } else if (data.provider === "Anthropic") {
        response = await fetch("https://api.anthropic.com/v1/models", { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, signal: AbortSignal.timeout(12000) });
      } else if (data.provider === "Grok") {
        response = await fetch("https://api.x.ai/v1/models", { headers: { Authorization: "Bearer " + apiKey }, signal: AbortSignal.timeout(12000) });
      } else {
        // Luma verification intentionally creates a tiny real test image job; this may consume quota.
        response = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations/image", {
          method: "POST",
          headers: { Accept: "application/json", Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ generation_type: "image", model: data.model, prompt: "Minimal abstract teal and navy geometric test image, no text, no logos.", aspect_ratio: "9:16", format: "jpg", sync: false }),
          signal: AbortSignal.timeout(15000),
        });
      }

      if (!response.ok) {
        const status = response.status === 401 || response.status === 403 ? "invalid-credentials" : response.status === 429 ? "rate-limited" : "provider-error";
        const message = response.status === 429 ? "Provider membatasi permintaan; coba lagi nanti." : "Uji API provider gagal. Periksa secret, akses akun, dan nama model.";
        console.error("[AI Model Hub] Provider test failed", { provider: data.provider, status: response.status });
        return { ok: false, connectionOk: false, provider: data.provider, model: data.model, family: data.family, outputType: data.outputType, status, message };
      }

      let generationId: string | undefined;
      if (data.provider === "Gemini") {
        const parsed = z.object({ candidates: z.array(z.unknown()).min(1) }).passthrough().safeParse(await response.json());
        if (!parsed.success) return { ok: false, connectionOk: true, provider: data.provider, model: data.model, family: data.family, outputType: data.outputType, status: "invalid-response", message: "Respons Gemini tidak sesuai format yang diharapkan." };
      } else if (data.provider === "Luma") {
        const parsed = z.object({ id: z.string().min(1), state: z.string().optional() }).passthrough().safeParse(await response.json());
        if (!parsed.success) return { ok: false, connectionOk: true, provider: data.provider, model: data.model, family: data.family, outputType: data.outputType, status: "invalid-response", message: "Luma tidak mengembalikan ID job yang valid." };
        generationId = parsed.data.id;
      }

      return {
        ok: supportsOutput,
        connectionOk: true,
        provider: data.provider,
        model: data.model,
        family: data.family,
        outputType: data.outputType,
        status: supportsOutput ? "provider-tested" : "connected-unsupported-capability",
        message: supportsOutput
          ? data.provider === "Luma"
            ? "Autentikasi dan permintaan generasi Luma berhasil. Job gambar uji dibuat di akun Luma; kuota mungkin terpakai."
            : "Koneksi provider berhasil diuji. Ini belum membuktikan alur simpan/muat ulang produksi."
          : "Kredensial provider valid, tetapi belum ada adapter produksi yang mendukung output ini.",
        ...(generationId ? { generationId } : {}),
      };
    } catch (error) {
      console.error("[AI Model Hub] Provider verification failed", { provider: data.provider, outputType: data.outputType, kind: error instanceof Error ? error.name : "unknown" });
      return { ok: false, connectionOk: false, provider: data.provider, model: data.model, family: data.family, outputType: data.outputType, status: "network-error", message: "Provider tidak dapat dijangkau atau waktu uji habis." };
    }
  });
