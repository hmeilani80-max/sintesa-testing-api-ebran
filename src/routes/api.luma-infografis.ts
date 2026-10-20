import { createFileRoute } from "@tanstack/react-router";

const LUMA_BASE_URL = "https://api.lumalabs.ai/dream-machine/v1";

type LumaGeneration = {
  id?: string;
  state?: "queued" | "dreaming" | "completed" | "failed";
  failure_reason?: string | null;
  assets?: { image?: string | null };
};

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function authorize(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  const supabaseUrl = (
    process.env["SUPABASE_URL"] ??
    process.env["VITE_SUPABASE_URL"] ??
    ""
  ).replace(/\/+$/, "");
  const supabaseKey =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    "";
  if (!supabaseUrl || !supabaseKey) return false;

  try {
    const response = await fetch(supabaseUrl + "/auth/v1/user", {
      headers: {
        apikey: supabaseKey,
        authorization,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function lumaRequest(path: string, init?: RequestInit) {
  const apiKey = process.env["LUMA_API_KEY"] ?? process.env["LUMA_API_TOKEN"];
  if (!apiKey) {
    return {
      response: null,
      error: "API key Luma belum tersedia di environment server (LUMA_API_KEY).",
    };
  }

  try {
    const response = await fetch(LUMA_BASE_URL + path, {
      ...init,
      headers: {
        accept: "application/json",
        authorization: "Bearer " + apiKey,
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...init?.headers,
      },
    });
    return { response, error: null };
  } catch {
    return { response: null, error: "Tidak dapat menghubungi layanan Luma." };
  }
}

export const Route = createFileRoute("/api/luma-infografis")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await authorize(request))) {
          return json({ error: "Sesi tidak valid. Silakan login ulang." }, 401);
        }

        let body: { prompt?: unknown; aspectRatio?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return json({ error: "Body request harus berupa JSON." }, 400);
        }

        if (
          typeof body.prompt !== "string" ||
          body.prompt.trim().length < 10 ||
          body.prompt.length > 6000
        ) {
          return json({ error: "Prompt wajib 10–6000 karakter." }, 400);
        }

        const aspectRatio =
          body.aspectRatio === "1:1" || body.aspectRatio === "4:3" ||
          body.aspectRatio === "3:4" || body.aspectRatio === "16:9" ||
          body.aspectRatio === "9:16"
            ? body.aspectRatio
            : "3:4";

        const result = await lumaRequest("/generations/image", {
          method: "POST",
          body: JSON.stringify({
            generation_type: "image",
            model: "photon-1",
            prompt: body.prompt.trim(),
            aspect_ratio: aspectRatio,
            format: "png",
          }),
        });
        if (!result.response) return json({ error: result.error }, 503);

        const payload = (await result.response.json().catch(() => ({}))) as
          | LumaGeneration
          | { detail?: string };
        if (!result.response.ok) {
          const detail = "detail" in payload ? payload.detail : undefined;
          return json(
            { error: detail || "Luma menolak permintaan generasi gambar." },
            result.response.status >= 400 && result.response.status < 500
              ? result.response.status
              : 502,
          );
        }

        const generationId = "id" in payload ? payload.id : undefined;
        if (!generationId) {
          return json({ error: "Respons Luma tidak berisi ID generasi." }, 502);
        }
        return json({ id: generationId }, 202);
      },

      GET: async ({ request }) => {
        if (!(await authorize(request))) {
          return json({ error: "Sesi tidak valid. Silakan login ulang." }, 401);
        }

        const id = new URL(request.url).searchParams.get("id");
        if (!id || !/^[0-9a-f-]{20,}$/i.test(id)) {
          return json({ error: "ID generasi tidak valid." }, 400);
        }

        const result = await lumaRequest("/generations/" + encodeURIComponent(id));
        if (!result.response) return json({ error: result.error }, 503);
        const payload = (await result.response.json().catch(() => ({}))) as
          | LumaGeneration
          | { detail?: string };
        if (!result.response.ok) {
          const detail = "detail" in payload ? payload.detail : undefined;
          return json({ error: detail || "Gagal mengambil status generasi Luma." }, 502);
        }

        const generation = payload as LumaGeneration;
        return json({
          id: generation.id,
          state: generation.state,
          imageUrl: generation.assets?.image ?? undefined,
          failureReason: generation.failure_reason ?? undefined,
        });
      },
    },
  },
});
