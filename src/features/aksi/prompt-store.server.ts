import { createClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";

type OutputType = "News Article" | "Infografis" | "Carousel" | "Video Pendek" | "Audio / Podcast";
type Brief = {
  theme: string; message: string; points: string[]; style: string[];
  audience?: string; region?: string; channels?: string[];
};

function interpolate(template: string, brief: Brief): string {
  const values: Record<string, string> = {
    theme: brief.theme,
    message: brief.message,
    points: brief.points.join("\n"),
    style: brief.style.join(", "),
    audience: brief.audience || "masyarakat umum",
    region: brief.region || "Indonesia",
    channels: (brief.channels || []).join(", "),
  };
  return template.replace(/\{\{(theme|message|points|style|audience|region|channels)\}\}/g, (_match, key: string) => values[key] ?? "");
}

/** Reads the authenticated workspace prompt. Static prompt remains a safe fallback if DB is unavailable. */
export async function getWorkspacePrompt(outputType: OutputType, brief: Brief, fallback: string): Promise<string> {
  const request = getRequest();
  const authorization = request?.headers.get("authorization");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !authorization?.startsWith("Bearer ")) return interpolate(fallback, brief);

  try {
    const client = createClient<Database>(url, key, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client
      .from("production_prompt_templates")
      .select("prompt_text")
      .eq("output_type", outputType)
      .maybeSingle();
    if (error) {
      console.warn("[Prompt Manager] Database prompt unavailable; using fallback.", { code: error.code });
      return interpolate(fallback, brief);
    }
    return interpolate(data?.prompt_text || fallback, brief);
  } catch (error) {
    console.warn("[Prompt Manager] Prompt lookup failed; using fallback.", error instanceof Error ? error.message : "unknown error");
    return interpolate(fallback, brief);
  }
}
