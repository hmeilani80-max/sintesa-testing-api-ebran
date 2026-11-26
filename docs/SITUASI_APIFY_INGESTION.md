# Situasi Apify Ingestion

## Scope
This pipeline collects public web evidence for three configurable categories: news, social media, and government websites. It does not assume that any Actor exists or that an Actor's output schema is universal. Actor IDs and input payloads are supplied by the project owner through server-side secrets.

## Required Supabase Edge Function secrets
- `APIFY_API_TOKEN`: Apify API token. Keep it server-side.
- `APIFY_SITUASI_ACTORS`: JSON object with one or more category configs:
  ```json
  {
    "news": [
      { "actorId": "username~news-actor", "input": { "keywords": ["Indonesia"], "languages": ["id"], "maxArticles": 100 } }
    ],
    "social": [
      { "actorId": "username~instagram-actor", "input": { "search": ["Indonesia"] } },
      { "actorId": "username~tiktok-actor", "input": { "searchQueries": ["Indonesia"] } },
      { "actorId": "username~x-actor", "input": { "searchTerms": ["Indonesia"] } }
    ],
    "government": [
      { "actorId": "username~website-actor", "input": { "startUrls": [{ "url": "https://www.go.id" }] } }
    ]
  }
  ```
  Each category accepts either one Actor object or an array of Actor objects. The example input keys are illustrative only. Replace them with the exact input schema required by each selected Actor. You can use multiple social Actors to cover multiple public platforms.
  The sample input keys are illustrative only. Replace them with the exact input schema required by each selected Actor.
- `SITUASI_APIFY_INGEST_SECRET`: long random shared secret used only by GitHub Actions and the Edge Function.
- Optional `APIFY_MAX_ITEMS`: maximum dataset items per Actor run (default 100, hard maximum 500).
- Optional `APIFY_MAX_TOTAL_CHARGE_USD`: per Actor run spend ceiling (default USD 2, hard maximum USD 25).

## GitHub Actions secret
Add `SITUASI_APIFY_INGEST_SECRET` to repository Actions secrets with exactly the same value as the Supabase Edge Function secret.

## Data handling
- The pipeline reads the existing `situasi_system_findings` and matches only explicit existing finding names/keywords.
- All normalized items are retained in `situasi_apify_items`, including unmatched items, for analyst review.
- Only items with a valid source URL, a parseable published timestamp, and an existing topic match are promoted to `situasi_observations`.
- Province/region fields are copied only when present in Actor output; the pipeline does not infer a location.
- Sentiment and risk are not fabricated by the collector. The existing EWS database trigger computes risk only from its evidence rules.
- Deduplication uses a SHA-256 item hash for raw items and source URL for promoted Apify observations.
- Runs are asynchronous. If an Actor is still running after 30 seconds, the next scheduled invocation polls its run ID and processes its dataset after it succeeds.

## Actor selection
Choose Actors in Apify Store that you are licensed and permitted to use. Confirm their current input schema, output fields, platform terms, rate limits, and pricing before adding them to `APIFY_SITUASI_ACTORS`. For national and all-province coverage, include countrywide searches and province-specific search terms or official provincial URLs in each Actor's own input. Avoid private-account scraping, login bypass, or collection of sensitive personal data.

## Trigger and monitoring
GitHub Actions runs every 30 minutes and supports manual dispatch:
`https://github.com/hmeilani80-max/sintesa-testing-api-ebran/actions/workflows/situasi-apify-ingestion.yml`

The authenticated Situasi > Sumber Data page reads run history and collected items from Supabase.
