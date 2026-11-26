# Situasi Apify Ingestion

## Scope
This pipeline collects public web evidence for three configurable categories: news, social media, and government websites. It does not assume that any Actor exists or that an Actor's output schema is universal. Actor IDs and input payloads are supplied by the project owner through server-side secrets.

## Required Supabase Edge Function secrets
- `APIFY_API_TOKEN`: Apify API token. Keep it server-side.
- `APIFY_SITUASI_ACTORS`: JSON object with one or more category configs:
  ```json
  {
    "news": [
      {
        "actorId": "mastertools/google-news-scraper",
        "platform": "google-news",
        "queryField": "queries",
        "input": {
          "queries": [
            "Indonesia"
          ],
          "period": "1d",
          "maxArticles": 30
        }
      }
    ],
    "social": [
      {
        "actorId": "apify/instagram-scraper",
        "platform": "instagram",
        "input": {
          "resultsType": "posts",
          "search": "#Indonesia",
          "searchType": "hashtag",
          "resultsLimit": 20
        }
      },
      {
        "actorId": "clockworks/tiktok-scraper",
        "platform": "tiktok",
        "queryField": "searchQueries",
        "input": {
          "searchQueries": [],
          "resultsPerPage": 5,
          "searchSection": "/video"
        }
      },
      {
        "actorId": "apify/facebook-posts-scraper",
        "platform": "facebook",
        "input": {
          "startUrls": [
            {
              "url": "https://www.facebook.com/REPLACE_WITH_PUBLIC_OFFICIAL_PAGE/"
            }
          ],
          "resultsLimit": 20
        }
      },
      {
        "actorId": "apidojo/twitter-scraper-lite",
        "platform": "x",
        "queryField": "searchTerms",
        "input": {
          "searchTerms": [],
          "sort": "Latest",
          "maxItems": 30,
          "includeSearchTerms": true
        }
      },
      {
        "actorId": "streamers/youtube-scraper",
        "platform": "youtube",
        "queryField": "searchQueries",
        "input": {
          "searchQueries": [],
          "maxResults": 10,
          "maxResultsShorts": 0,
          "maxResultStreams": 0
        }
      },
      {
        "actorId": "forgedata/telegram-channel-scraper",
        "platform": "telegram",
        "input": {
          "channels": [
            "REPLACE_WITH_PUBLIC_CHANNEL_USERNAME"
          ],
          "maxPostsPerChannel": 20,
          "postedWithinDays": 7
        }
      }
    ],
    "government": [
      {
        "actorId": "apify/website-content-crawler",
        "platform": "government-web",
        "input": {
          "startUrls": [
            {
              "url": "https://REPLACE_WITH_OFFICIAL_NATIONAL_GOV_DOMAIN.go.id"
            },
            {
              "url": "https://REPLACE_WITH_OFFICIAL_PROVINCE_01_DOMAIN.go.id"
            },
            {
              "url": "https://REPLACE_WITH_OFFICIAL_PROVINCE_02_DOMAIN.go.id"
            }
          ],
          "maxCrawlDepth": 1,
          "maxCrawlPages": 30,
          "respectRobotsTxtFile": true
        }
      }
    ]
  }
  ```
  **Wajib disesuaikan sebelum dijalankan:** ganti URL halaman Facebook, username kanal Telegram, dan seluruh URL pemerintah dengan sumber resmi yang benar-benar dipantau. Untuk cakupan seluruh Indonesia, masukkan portal nasional dan domain resmi seluruh 38 provinsi pada `government.input.startUrls`. Actor Facebook hanya mengambil halaman publik yang dicantumkan. Instagram pada contoh ini menggunakan hashtag publik `#Indonesia`; ganti/duplikasi Actor config bila ingin memantau hashtag lain. Actor TikTok, X, YouTube, dan Google News mendukung perluasan kata kunci dari temuan Situasi melalui `queryField`.
  A category accepts one Actor object or an array. Actor IDs may be written as Apify Store `owner/actor` slugs; the backend converts them to the API's `owner~actor` form. For an Actor that accepts an array of search phrases, set `queryField` to that input field. The function then adds nationwide and province-specific searches for existing Situasi findings.
- `SITUASI_APIFY_INGEST_SECRET`: long random shared secret used only by GitHub Actions and the Edge Function.
- Optional `APIFY_MAX_ITEMS`: maximum dataset items per Actor run (default 30, hard maximum 500).
- Optional `APIFY_MAX_TOTAL_CHARGE_USD`: per Actor run spend ceiling (default USD 0.10, hard maximum USD 25).

## GitHub Actions secret
Add `SITUASI_APIFY_INGEST_SECRET` to repository Actions secrets with exactly the same value as the Supabase Edge Function secret.

## Data handling
- The pipeline reads the existing `situasi_system_findings`; when `queryField` is configured it expands those topic names and up to two keywords into nationwide plus 38 province-specific queries. It matches only explicit existing finding names/keywords.
- All normalized items are retained in `situasi_apify_items`, including unmatched items, for analyst review.
- Only items with a valid source URL, a parseable published timestamp, and an existing topic match are promoted to `situasi_observations`.
- Province/region fields are copied only when present in Actor output; the pipeline does not infer a location. Government Actors must be given official provincial start URLs in their own `input.startUrls` configuration.
- Sentiment and risk are not fabricated by the collector. The existing EWS database trigger computes risk only from its evidence rules.
- Deduplication uses a SHA-256 item hash for raw items and source URL for promoted Apify observations.
- Runs are asynchronous. If an Actor is still running after 30 seconds, the next scheduled invocation polls its run ID and processes its dataset after it succeeds.

## Actor selection
Choose Actors in Apify Store that you are licensed and permitted to use. Confirm their current input schema, output fields, platform terms, rate limits, and pricing before adding them to `APIFY_SITUASI_ACTORS`. For national and all-province coverage, include countrywide searches and province-specific search terms or official provincial URLs in each Actor's own input. Avoid private-account scraping, login bypass, or collection of sensitive personal data.

## Trigger and monitoring
GitHub Actions runs every 3 hours and supports manual dispatch:
`https://github.com/hmeilani80-max/sintesa-testing-api-ebran/actions/workflows/situasi-apify-ingestion.yml`

The authenticated Situasi > Sumber Data page reads run history and collected items from Supabase.
