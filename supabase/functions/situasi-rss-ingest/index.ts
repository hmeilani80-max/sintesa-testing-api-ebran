import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type Topic = { slug: string; name: string; keywords: string[] | null };
type Feed = { label: string; url: string };

const FEEDS: Feed[] = [
  { label: "ANTARA Terkini", url: "https://www.antaranews.com/rss/terkini.xml" },
  { label: "ANTARA Politik", url: "https://www.antaranews.com/rss/politik.xml" },
  { label: "ANTARA Hukum", url: "https://www.antaranews.com/rss/hukum.xml" },
  { label: "ANTARA Ekonomi", url: "https://www.antaranews.com/rss/ekonomi.xml" },
  { label: "ANTARA Jawa Barat", url: "https://jabar.antaranews.com/rss/terkini.xml" },
  { label: "ANTARA Jabar Nasional", url: "https://jabar.antaranews.com/rss/nasional.xml" },
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://sintesa-testing-api-ebran.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ingest-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function cleanText(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function elementContent(block: string, localName: string): string {
  const pattern = new RegExp("<(?:[\\w.-]+:)?" + localName + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?" + localName + "\\s*>", "i");
  const match = block.match(pattern);
  if (!match) return "";
  const decoded = match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([\da-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
  return cleanText(decoded);
}

function elementAttribute(block: string, localName: string, attribute: string): string {
  const tagPattern = new RegExp("<(?:[\\w.-]+:)?" + localName + "\\b([^>]*)\\/?\\s*>", "i");
  const tag = block.match(tagPattern)?.[1] ?? "";
  const doubleQuoted = tag.match(new RegExp("\\b" + attribute + "\\s*=\\s*\"([^\"]*)\"", "i"));
  const singleQuoted = tag.match(new RegExp("\\b" + attribute + "\\s*=\\s*'([^']*)'", "i"));
  const attr = doubleQuoted ?? singleQuoted;
  return attr?.[1]?.trim() ?? "";
}

function parseFeed(xml: string): Array<{ title: string; description: string; link: string; published: string }> {
  if (!/<(?:[A-Za-z0-9_.-]+:)?(?:rss|feed|RDF)\b/i.test(xml)) {
    throw new Error("Respons feed bukan dokumen RSS/Atom XML");
  }
  const blocks = [...xml.matchAll(/<(?:[A-Za-z0-9_.-]+:)?(item|entry)\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_.-]+:)?\1\s*>/gi)];
  return blocks.slice(0, 60).map((match) => {
    const block = match[2];
    const link = elementAttribute(block, "link", "href") || elementContent(block, "link");
    return {
      title: elementContent(block, "title"),
      description: elementContent(block, "description") || elementContent(block, "summary") || elementContent(block, "encoded") || elementContent(block, "content"),
      link,
      published: elementContent(block, "pubDate") || elementContent(block, "published") || elementContent(block, "updated") || elementContent(block, "date"),
    };
  }).filter((item) => item.title && item.link && item.published);
}
function safeArticleUrl(raw: string, feedUrl: string): string | null {
  try {
    const url = new URL(raw, feedUrl);
    const allowed = ["antaranews.com", "jabar.antaranews.com"];
    if (url.protocol !== "https:" || !allowed.some((domain) => url.hostname === domain || url.hostname.endsWith("." + domain))) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function matchTopic(text: string, topics: Topic[]): Topic | null {
  const normalized = text.toLocaleLowerCase("id-ID");
  let best: { topic: Topic; score: number } | null = null;
  for (const topic of topics) {
    const terms = [...new Set([topic.name, ...(topic.keywords ?? [])].map((term) => term.trim().toLocaleLowerCase("id-ID")).filter(Boolean))];
    const hits = terms.filter((term) => normalized.includes(term));
    if (hits.length && (!best || hits.length > best.score)) best = { topic, score: hits.length };
  }
  return best?.topic ?? null;
}

async function rest(path: string, key: string, method = "GET", body?: unknown, prefer?: string) {
  const response = await fetch(path, {
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
  if (!response.ok) throw new Error(`Supabase REST ${response.status}: ${raw.slice(0, 400)}`);
  return raw ? JSON.parse(raw) : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });

  const ingestSecret = Deno.env.get("SITUASI_RSS_INGEST_SECRET");
  if (!ingestSecret) return new Response(JSON.stringify({ error: "SITUASI_RSS_INGEST_SECRET belum dikonfigurasi" }), { status: 503, headers: corsHeaders });
  if (req.headers.get("x-ingest-secret") !== ingestSecret) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return new Response(JSON.stringify({ error: "Konfigurasi Supabase tidak lengkap" }), { status: 500, headers: corsHeaders });

  const base = `${supabaseUrl}/rest/v1`;
  const startedAt = new Date().toISOString();
  let runId: string | null = null;
  const stats = { feeds_checked: 0, articles_seen: 0, observations_inserted: 0, duplicates_skipped: 0, unmatched_articles: 0 };
  const errors: Array<{ feed: string; message: string }> = [];

  try {
    const topics = await rest(`${base}/situasi_system_findings?select=slug,name,keywords`, serviceKey) as Topic[];
    const runRows = await rest(`${base}/situasi_rss_ingestion_runs`, serviceKey, "POST", { started_at: startedAt, status: "running" }, "return=representation");
    runId = runRows?.[0]?.id ?? null;

    for (const feed of FEEDS) {
      try {
        const response = await fetch(feed.url, {
          headers: { "User-Agent": "SintesaSituasiRSS/1.0 (+https://sintesa-testing-api-ebran.vercel.app)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const xml = await response.text();
        const items = parseFeed(xml);
        stats.feeds_checked++;
        for (const item of items) {
          stats.articles_seen++;
          const sourceUrl = safeArticleUrl(item.link, feed.url);
          const publishedAt = new Date(item.published);
          if (!sourceUrl || Number.isNaN(publishedAt.getTime()) || publishedAt.getTime() > Date.now() + 60 * 60 * 1000 || publishedAt.getTime() < Date.now() - 14 * 86400000) continue;
          const topic = matchTopic(`${item.title} ${item.description}`, topics);
          if (!topic) { stats.unmatched_articles++; continue; }

          const inserted = await rest(`${base}/rpc/ingest_situasi_rss_observation`, serviceKey, "POST", {
            p_topic_slug: topic.slug,
            p_actor: null,
            p_content: `${item.title}\n\n${item.description}`,
            p_narrative: item.title,
            p_observed_at: publishedAt.toISOString(),
            p_source_url: sourceUrl,
            p_metadata: { source_label: feed.label, feed_url: feed.url, published_at: publishedAt.toISOString(), matching_topic: topic.name, matching_method: "exact_keyword", sentiment: "unclassified", region: "unclassified" },
          });
          if (inserted === true) stats.observations_inserted++;
          else stats.duplicates_skipped++;
        }
      } catch (error) {
        errors.push({ feed: feed.label, message: error instanceof Error ? error.message : "Feed gagal diproses" });
      }
    }

    const status = errors.length === 0 ? "success" : stats.feeds_checked > 0 ? "partial" : "failed";
    if (runId) await rest(`${base}/situasi_rss_ingestion_runs?id=eq.${runId}`, serviceKey, "PATCH", {
      finished_at: new Date().toISOString(), status, ...stats, errors,
      metadata: { feed_count: FEEDS.length, retention_days: 14, matching: "existing finding keywords only" },
    }, "return=minimal");

    return new Response(JSON.stringify({ ok: status !== "failed", run_id: runId, status, ...stats, errors }), { status: status === "failed" ? 502 : 200, headers: corsHeaders });
  } catch (error) {
    if (runId) {
      try {
        await rest(`${base}/situasi_rss_ingestion_runs?id=eq.${runId}`, serviceKey, "PATCH", {
          finished_at: new Date().toISOString(), status: "failed",
          errors: [{ feed: "pipeline", message: error instanceof Error ? error.message : "Pipeline gagal" }],
        }, "return=minimal");
      } catch { /* Preserve the original failure. */ }
    }
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "RSS ingestion gagal" }), { status: 500, headers: corsHeaders });
  }
});
