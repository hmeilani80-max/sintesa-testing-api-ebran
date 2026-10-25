import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const outputType = z.enum(["News Article", "Infografis", "Carousel", "Video Pendek", "Audio / Podcast"]);
const briefSchema = z.object({
  theme: z.string().trim().min(1).max(500),
  message: z.string().trim().min(1).max(5000),
  points: z.array(z.string().max(1000)).max(100),
  style: z.array(z.string().max(100)).max(20),
  audience: z.string().max(500).optional(),
  region: z.string().max(500).optional(),
  channels: z.array(z.string().max(200)).max(100).optional(),
});
const contentSchema = z.object({
  headline: z.string().min(1).max(1000),
  subtitle: z.string().max(2000),
  lead: z.string().max(5000),
  body: z.string().max(100000),
  tags: z.array(z.string().max(100)).max(20),
  slides: z.array(z.object({ label: z.string().min(1).max(200), text: z.string().min(1).max(5000) })).max(20),
  highlights: z.array(z.object({ value: z.string().max(500), label: z.string().min(1).max(1000) })).max(20),
  caption: z.string().max(10000),
  duration: z.number().finite().min(0).max(3600),
  format: z.enum(["9:16", "16:9"]),
  voiceOver: z.boolean(),
  voice: z.string().max(200),
  transcript: z.string().max(100000),
  assetUrl: z.string().url().optional(),
  assetGenerationId: z.string().max(200).optional(),
}).strict();

import { getProductionPrompt } from "./prompt-templates";

const generateInput = z.object({ type: outputType, brief: briefSchema });
export const generateProductionContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => generateInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI belum dikonfigurasi. Tambahkan GEMINI_API_KEY pada environment server Vercel lalu redeploy.");
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: getProductionPrompt(data.type, data.brief) }] },
        contents: [{ role: "user", parts: [{ text: "Buat konten sesuai brief dan skema JSON yang ditentukan." }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) {
      const safeStatus = response.status;
      console.error("[AI Writer] Gemini request failed", { status: safeStatus });
      throw new Error(safeStatus === 429 ? "Batas penggunaan Gemini tercapai. Coba lagi nanti." : "AI Writer gagal menghasilkan konten. Periksa konfigurasi Gemini dan coba lagi.");
    }
    const payload: unknown = await response.json();
    const envelope = z.object({ candidates: z.array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string() })) }) }).passthrough()).min(1) }).passthrough().parse(payload);
    const raw = envelope.candidates[0]?.content.parts.map((part) => part.text).join("").trim();
    if (!raw) throw new Error("AI Writer mengembalikan hasil kosong.");
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new Error("Hasil AI bukan JSON yang valid. Silakan generate ulang."); }
    const content = contentSchema.parse(parsed);
    if (data.type === "Carousel" && content.slides.length < 5) throw new Error("Hasil carousel kurang dari 5 slide. Silakan generate ulang.");
    if (data.type === "Infografis" && content.highlights.length < 3) throw new Error("Hasil infografis kurang dari 3 poin. Silakan generate ulang.");
    if ((data.type === "Video Pendek" || data.type === "Audio / Podcast") && !content.transcript.trim()) throw new Error("Naskah AI kosong. Silakan generate ulang.");
    if (data.type === "News Article") {
      const paragraphs = content.body.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
      if (!content.headline.trim() || !content.lead.trim() || content.body.trim().length < 350 || paragraphs.length < 3) {
        throw new Error("Artikel AI belum lengkap atau belum memiliki paragraf yang cukup. Silakan generate ulang.");
      }
      if (content.tags.length < 3) throw new Error("Tag artikel belum cukup. Silakan generate ulang.");
      if (content.duration !== 0 || content.format !== "16:9" || content.voiceOver !== false) {
        throw new Error("Format keluaran News Article tidak sesuai. Silakan generate ulang.");
      }
    }
    return content;
  });
