import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type Category = "news" | "social" | "government";
type ActorConfig = { actorId: string; input: Record<string, unknown> };
type Topic = { slug: string; name: string; keywords: string[] | null };
type NormalizedItem = {
  title: string;
  content: string;
  url: string | null;
  publishedAt: string | null;
  platform: string;
  sourceName: string | null;
  province: string | null;
  region: string | null;
  actorName: string | null;
};

const CATEGORIES: Category[] = ["news", "social", "government"];
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://sintesa-testing-api-ebran.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-apify-ingest-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

async function rest(base: string, key: string, path: string, method = "GET", body?: unknown, prefer?: string) {
  const response = await fetch(`${base}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Supabase REST ${response.status}: ${raw.slice(0, 500)}`);
  return raw ? JSON.parse(raw) : null;
}

async function apify(token: string, path: string, method = "GET", body?: unknown) {
  const response = await fetch(`https://api.apify.com/v2/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Apify API ${response.status}: ${raw.slice(0, 500)}`);
  return raw ? JSON.parse(raw) : null;
}

function firstString(item: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function safeUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.hash = "";
    return url.toString();
  } catch { return null; }
}

function normalizeItem(raw: unknown, category: Category): NormalizedItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;
  const nestedMetadata = item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
    ? item.metadata as Record<string, unknown> : {};
  const title = firstString(item, ["title", "headline", "name", "postTitle", "pageTitle"]) ??
    firstString(nestedMetadata, ["title", "headline", "og:title", "pageTitle"]) ?? "";
  const content = firstString(item, ["text", "content", "description", "fullText", "caption", "body", "summary", "markdown"]) ??
    firstString(nestedMetadata, ["description", "og:description"]) ?? title;
  if (!content.trim()) return null;
  const rawDate = firstString(item, ["publishedAt", "published_at", "datePublished", "date", "createdAt", "timestamp", "time"]) ??
    firstString(nestedMetadata, ["publishedTime", "datePublished", "published_at", "date", "lastModified", "article:published_time"]);
  const date = rawDate ? new Date(rawDate) : null;
  const publishedAt = date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
  const platform = firstString(item, ["platform", "socialNetwork", "network"]) ??
    (category === "news" ? "News" : category === "social" ? "Media Sosial" : "Situs Pemerintah");
  return {
    title: title || content.slice(0, 240),
    content: content.slice(0, 12000),
    url: safeUrl(firstString(item, ["url", "sourceUrl", "source_url", "link", "permalink", "postUrl", "canonicalUrl"]) ??
      firstString(nestedMetadata, ["url", "canonicalUrl", "og:url"])),
    publishedAt,
    platform: platform.slice(0, 80),
    sourceName: firstString(item, ["sourceName", "publisher", "siteName", "website", "domain"]) ??
      firstString(nestedMetadata, ["siteName", "og:site_name", "publisher"]),
    province: firstString(item, ["province", "provinsi"]) ?? firstString(nestedMetadata, ["province", "provinsi"]),
    region: firstString(item, ["region", "location", "locationName", "city"]) ??
      firstString(nestedMetadata, ["region", "location", "city"]),
    actorName: firstString(item, ["author", "authorName", "username", "accountName", "userName"]),
  };
}

function matchTopic(text: string, topics: Topic[]): Topic | null {
  const normalized = text.toLocaleLowerCase("id-ID");
  let best: { topic: Topic; score: number } | null = null;
  for (const topic of topics) {
    const terms = [...new Set([topic.name, ...(topic.keywords ?? [])]
      .map((term) => term.trim().toLocaleLowerCase("id-ID")).filter(Boolean))];
    const hits = terms.filter((term) => normalized.includes(term));
    if (hits.length && (!best || hits.length > best.score)) best = { topic, score: hits.length };
  }
  return best?.topic ?? null;
}

async function hashItem(category: Category, item: NormalizedItem): Promise<string> {
  const identity = item.url ?? `${category}| ${item.title}| ${item.content}| ${item.publishedAt ?? ""}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function updateRun(base: string, serviceKey: string, id: string, patch: Record<string, unknown>) {
  await rest(base, serviceKey, `situasi_apify_ingestion_runs?id=eq.${encodeURIComponent(id)}`, "PATCH", patch, "return=minimal");
}

async function consumeDataset(
  base: string, serviceKey: string, apifyToken: string, run: Record<string, unknown>,
  category: Category, actorId: string, topics: Topic[], maxItems: number,
) {
  const datasetId = String(run.defaultDatasetId ?? "");
  if (!datasetId) throw new Error("Actor run tidak mengembalikan defaultDatasetId");
  const rows = await apify(apifyToken, `datasets/${encodeURIComponent(datasetId)}/items?format=json&clean=true&limit=${maxItems}`) as unknown[];
  const stats = { items_seen: Array.isArray(rows) ? rows.length : 0, items_saved: 0, observations_inserted: 0, duplicates_skipped: 0, unmatched_items: 0 };
  const errors: string[] = [];

  for (const raw of Array.isArray(rows) ? rows : []) {
    try {
      const item = normalizeItem(raw, category);
      if (!item) { stats.unmatched_items++; continue; }
      const topic = matchTopic(`${item.title} ${item.content}`, topics);
      const hash = await hashItem(category, item);
      const matchStatus = !item.url ? "missing_source_url" : !item.publishedAt ? "missing_timestamp" : topic ? "matched" : "unmatched";
      const saved = await rest(base, serviceKey, "situasi_apify_items?on_conflict=item_hash", "POST", {
        item_hash: hash,
        run_id: run.id,
        source_category: category,
        source_name: item.sourceName,
        platform: item.platform,
        title: item.title,
        content: item.content,
        source_url: item.url,
        published_at: item.publishedAt,
        province: item.province,
        region: item.region,
        actor_name: item.actorName,
        topic_slug: topic?.slug ?? null,
        match_status: matchStatus,
        raw_item: raw,
      }, "resolution=ignore-duplicates,return=representation");
      const rawInserted = Array.isArray(saved) && saved.length > 0;
      if (rawInserted) stats.items_saved++;
      else stats.duplicates_skipped++;

      if (!topic || !item.url || !item.publishedAt) {
        stats.unmatched_items++;
        continue;
      }
      const inserted = await rest(base, serviceKey, "rpc/ingest_situasi_apify_observation", "POST", {
        p_topic_slug: topic.slug,
        p_platform: item.platform,
        p_actor: item.actorName,
        p_content: item.content,
        p_narrative: item.title,
        p_observed_at: item.publishedAt,
        p_source_url: item.url,
        p_region: item.province ?? item.region,
        p_metadata: {
          source_category: category,
          source_name: item.sourceName,
          actor_id: actorId,
          actor_run_id: run.apifyRunId ?? run.actor_run_id ?? null,
          province: item.province,
          region: item.region,
          matching_method: "existing_finding_keywords",
        },
      });
      if (inserted === true) stats.observations_inserted++;
      else if (rawInserted) stats.duplicates_skipped++;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Item gagal diproses");
    }
  }

  return { stats, errors, datasetId };
}

async function processCategory(
  base: string, serviceKey: string, apifyToken: string, category: Category,
  config: ActorConfig, topics: Topic[], maxItems: number, maxCost: number,
) {
  const existing = await rest(base, serviceKey,
    `situasi_apify_ingestion_runs?source_category=eq.${category}&actor_id=eq.${encodeURIComponent(config.actorId)}&status=eq.running&actor_run_id=not.is.null&order=started_at.asc&limit=1`) as Record<string, unknown>[];
  let log = existing?.[0];

  if (!log) {
    const created = await rest(base, serviceKey, "situasi_apify_ingestion_runs", "POST", {
      source_category: category, actor_id: config.actorId, status: "running",
      metadata: { phase: "starting", max_items: maxItems, max_total_charge_usd: maxCost },
    }, "return=representation") as Record<string, unknown>[];
    log = created?.[0];
    if (!log?.id) throw new Error(`Tidak dapat membuat log ingestion untuk ${category}`);
    let started: Record<string, unknown>;
    try {
      started = await apify(apifyToken,
        `actors/${encodeURIComponent(config.actorId)}/runs?waitForFinish=30&maxTotalChargeUsd=${maxCost}`,
        "POST", config.input) as Record<string, unknown>;
    } catch (error) {
      await updateRun(base, serviceKey, String(log.id), {
        status: "failed",
        finished_at: new Date().toISOString(),
        errors: [{ message: error instanceof Error ? error.message : "Actor gagal dimulai" }],
        metadata: { phase: "start_failed" },
      });
      throw error;
    }
    await updateRun(base, serviceKey, String(log.id), {
      actor_run_id: started.id ?? null,
      dataset_id: started.defaultDatasetId ?? null,
      metadata: { phase: started.status === "SUCCEEDED" ? "collecting" : "waiting", max_items: maxItems, max_total_charge_usd: maxCost },
    });
    log = { ...log, actor_run_id: started.id, dataset_id: started.defaultDatasetId, status: "running" };
    if (started.status === "RUNNING" || started.status === "READY" || started.status === "TIMING-OUT") {
      return { category, status: "running", actorRunId: started.id, message: "Actor masih berjalan; pengambilan dataset dilanjutkan pada pemanggilan berikutnya." };
    }
    if (started.status !== "SUCCEEDED") throw new Error(`Actor berakhir dengan status ${String(started.status ?? "unknown")}`);
    const result = await consumeDataset(base, serviceKey, apifyToken, { ...started, id: log.id, apifyRunId: started.id }, category, config.actorId, topics, maxItems);
    const status = result.errors.length ? "partial" : "success";
    await updateRun(base, serviceKey, String(log.id), {
      status, finished_at: new Date().toISOString(), dataset_id: result.datasetId,
      ...result.stats, errors: result.errors,
      metadata: { phase: "completed", actor_status: started.status, max_items: maxItems },
    });
    return { category, status, ...result.stats, errors: result.errors };
  }

  if (!log.actor_run_id) throw new Error(`Log ${category} tidak memiliki actor_run_id`);
  const actorRun = await apify(apifyToken, `actor-runs/${encodeURIComponent(String(log.actor_run_id))}`) as Record<string, unknown>;
  const actorStatus = String(actorRun.status ?? "UNKNOWN");
  if (actorStatus === "RUNNING" || actorStatus === "READY" || actorStatus === "TIMING-OUT") {
    return { category, status: "running", actorRunId: log.actor_run_id };
  }
  if (actorStatus !== "SUCCEEDED") {
    await updateRun(base, serviceKey, String(log.id), {
      status: "failed", finished_at: new Date().toISOString(),
      errors: [{ message: `Actor berakhir dengan status ${actorStatus}` }],
      metadata: { phase: "failed", actor_status: actorStatus },
    });
    return { category, status: "failed", actorStatus };
  }
  const result = await consumeDataset(base, serviceKey, apifyToken, { ...actorRun, id: log.id, apifyRunId: log.actor_run_id }, category, config.actorId, topics, maxItems);
  const status = result.errors.length ? "partial" : "success";
  await updateRun(base, serviceKey, String(log.id), {
    status, finished_at: new Date().toISOString(), dataset_id: result.datasetId,
    ...result.stats, errors: result.errors,
    metadata: { phase: "completed", actor_status: actorStatus, max_items: maxItems },
  });
  return { category, status, ...result.stats, errors: result.errors };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expectedSecret = Deno.env.get("SITUASI_APIFY_INGEST_SECRET");
  if (!expectedSecret) return json({ error: "SITUASI_APIFY_INGEST_SECRET belum dikonfigurasi" }, 503);
  if (req.headers.get("x-apify-ingest-secret") !== expectedSecret) return json({ error: "Unauthorized" }, 401);

  const apifyToken = Deno.env.get("APIFY_API_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apifyToken || !supabaseUrl || !serviceKey) {
    return json({ error: "Konfigurasi APIFY_API_TOKEN atau Supabase belum lengkap" }, 503);
  }

  let rawActorConfig: Record<string, unknown>;
  try {
    rawActorConfig = JSON.parse(Deno.env.get("APIFY_SITUASI_ACTORS") ?? "{}");
  } catch {
    return json({ error: "APIFY_SITUASI_ACTORS harus berupa JSON valid" }, 503);
  }
  const actorConfig: Partial<Record<Category, ActorConfig[]>> = {};
  for (const category of CATEGORIES) {
    const rawValue = rawActorConfig[category];
    const candidates = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
    actorConfig[category] = candidates.filter((value): value is ActorConfig =>
      !!value && typeof value === "object" &&
      typeof (value as ActorConfig).actorId === "string" &&
      (value as ActorConfig).actorId.trim().length > 0 &&
      !!(value as ActorConfig).input && typeof (value as ActorConfig).input === "object"
    );
  }
  const configured = CATEGORIES.filter((category) => (actorConfig[category]?.length ?? 0) > 0);
  if (!configured.length) return json({ error: "Belum ada Actor news/social/government di APIFY_SITUASI_ACTORS" }, 503);

  const maxItems = Math.min(500, Math.max(1, Number(Deno.env.get("APIFY_MAX_ITEMS") ?? "100") || 100));
  const maxCost = Math.min(25, Math.max(0.1, Number(Deno.env.get("APIFY_MAX_TOTAL_CHARGE_USD") ?? "2") || 2));
  const base = supabaseUrl.replace(/\/$/, "");
  try {
    const topics = await rest(base, serviceKey, "situasi_system_findings?select=slug,name,keywords") as Topic[];
    const results = [];
    for (const category of configured) {
      for (const config of actorConfig[category] ?? []) {
        try {
          results.push(await processCategory(base, serviceKey, apifyToken, category, config, topics, maxItems, maxCost));
        } catch (error) {
          results.push({ category, actorId: config.actorId, status: "failed", error: error instanceof Error ? error.message : "Actor gagal" });
        }
      }
    }
    const hasFailure = results.some((result) => result.status === "failed");
    const hasRunning = results.some((result) => result.status === "running");
    return json({ ok: !hasFailure, status: hasFailure ? "partial" : hasRunning ? "running" : "success", results });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Apify ingestion gagal" }, 500);
  }
});
