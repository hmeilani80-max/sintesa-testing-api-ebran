# Situasi Apify Ingestion

## Current rollout: Google News pilot only
The deployed Edge Function and GitHub Actions workflow are deliberately restricted to `news` / `mastertools/google-news-scraper`. Social and government Actors may remain in the server-side secret, but this workflow will not start them. Every request must explicitly send:
```json
{"category":"news","actorId":"mastertools/google-news-scraper"}
```
The first pilot caps the Google News search at 10 queries and 10 articles per query, uses the Indonesia edition (`country: ID`, `language: id`), limits the period to one day, sorts newest first, resolves publisher URLs, and disables full-article extraction. The Actor run also has the existing USD 0.50 Apify charge ceiling. This is a controlled validation run, not yet full 38-province coverage. Expand provincial query coverage only after the first run is confirmed in Supabase and Menu Situasi.

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
        "maxQueries": 100,
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
        "actorId": "apify/instagram-hashtag-scraper",
        "platform": "instagram",
        "queryField": "hashtags",
        "maxQueries": 100,
        "input": {
          "hashtags": [],
          "keywordSearch": true,
          "resultsType": "posts",
          "resultsLimit": 5
        }
      },
      {
        "actorId": "clockworks/tiktok-scraper",
        "platform": "tiktok",
        "queryField": "searchQueries",
        "maxQueries": 100,
        "input": {
          "searchQueries": [],
          "resultsPerPage": 5,
          "searchSection": "/video"
        }
      },
      {
        "actorId": "automation_craft/facebook-search-scraper",
        "platform": "facebook",
        "queryField": "searchQueries",
        "maxQueries": 100,
        "input": {
          "searchQueries": [],
          "sortBy": "recent",
          "maxPostsPerQuery": 5,
          "maxPosts": 30
        }
      },
      {
        "actorId": "apidojo/twitter-scraper-lite",
        "platform": "x",
        "queryField": "searchTerms",
        "maxQueries": 100,
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
        "maxQueries": 100,
        "input": {
          "searchQueries": [],
          "maxResults": 10,
          "maxResultsShorts": 0,
          "maxResultStreams": 0
        }
      },
      {
        "actorId": "hyperbach/telegram-keyword-search-scraper",
        "platform": "telegram",
        "queryField": "keywords",
        "maxQueries": 100,
        "input": {
          "keywords": [],
          "maxResultsPerKeyword": 5,
          "maxChannelsPerKeyword": 10,
          "matchMode": "allWords"
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
              "url": "https://www.indonesia.go.id"
            },
            {
              "url": "https://setkab.go.id"
            },
            {
              "url": "https://www.kemendagri.go.id"
            },
            {
              "url": "https://www.bnpb.go.id"
            },
            {
              "url": "https://acehprov.go.id"
            },
            {
              "url": "https://sumutprov.go.id"
            },
            {
              "url": "https://sumbarprov.go.id"
            },
            {
              "url": "https://riau.go.id"
            },
            {
              "url": "https://jambiprov.go.id"
            },
            {
              "url": "https://sumselprov.go.id"
            },
            {
              "url": "https://bengkuluprov.go.id"
            },
            {
              "url": "https://lampungprov.go.id"
            },
            {
              "url": "https://babelprov.go.id"
            },
            {
              "url": "https://kepriprov.go.id"
            },
            {
              "url": "https://jakarta.go.id"
            },
            {
              "url": "https://jabarprov.go.id"
            },
            {
              "url": "https://jatengprov.go.id"
            },
            {
              "url": "https://jogjaprov.go.id"
            },
            {
              "url": "https://jatimprov.go.id"
            },
            {
              "url": "https://bantenprov.go.id"
            },
            {
              "url": "https://baliprov.go.id"
            },
            {
              "url": "https://ntbprov.go.id"
            },
            {
              "url": "https://nttprov.go.id"
            },
            {
              "url": "https://kalbarprov.go.id"
            },
            {
              "url": "https://kalteng.go.id"
            },
            {
              "url": "https://kalselprov.go.id"
            },
            {
              "url": "https://kaltimprov.go.id"
            },
            {
              "url": "https://kaltaraprov.go.id"
            },
            {
              "url": "https://sulutprov.go.id"
            },
            {
              "url": "https://sultengprov.go.id"
            },
            {
              "url": "https://sulselprov.go.id"
            },
            {
              "url": "https://sulawesitenggaraprov.go.id"
            },
            {
              "url": "https://gorontaloprov.go.id"
            },
            {
              "url": "https://sulbarprov.go.id"
            },
            {
              "url": "https://malukuprov.go.id"
            },
            {
              "url": "https://malutprov.go.id"
            },
            {
              "url": "https://papuabaratprov.go.id"
            },
            {
              "url": "https://papua.go.id"
            },
            {
              "url": "https://papuaselatan.go.id"
            },
            {
              "url": "https://papuatengahprov.go.id"
            },
            {
              "url": "https://papuapegunungan.go.id"
            },
            {
              "url": "https://papuabaratdayaprov.go.id"
            }
          ],
          "maxCrawlDepth": 1,
          "maxCrawlPages": 100,
          "respectRobotsTxtFile": true
        }
      }
    ]
  }
  ```
  Konfigurasi ini memakai enam platform sosial yang bisa mencari berdasarkan kata kunci: Instagram, TikTok, Facebook, X, YouTube, dan Telegram. Untuk Actor yang mendukung daftar pencarian, `queryField` akan diisi dengan temuan Situasi, kata kunci, istilah Indonesia, dan variasi 38 provinsi. `maxQueries: 100` membatasi ekspansi per Actor agar tidak mengirim daftar input yang terlalu besar. Situs pemerintah sudah mencakup portal nasional dan 38 domain provinsi.
  **Sumber yang perlu diganti sebelum dijalankan:** Konfigurasi pemerintah sudah memuat portal nasional dan 38 domain pemerintah provinsi; tinjau kembali setiap portal bila pemerintah daerah mengubah domainnya. 
  **Wajib disesuaikan sebelum dijalankan:** ganti URL halaman Facebook, username kanal Telegram, dan seluruh URL pemerintah dengan sumber resmi yang benar-benar dipantau. Actor Facebook hanya mengambil halaman publik yang dicantumkan. Instagram pada contoh ini menggunakan hashtag publik `#Indonesia`; ganti/duplikasi Actor config bila ingin memantau hashtag lain. Actor yang mendukung pencarian berbasis array akan menerima perluasan kata kunci nasional dan 38 provinsi melalui `queryField`.
  A category accepts one Actor object or an array. Actor IDs may be written as Apify Store `owner/actor` slugs; the backend converts them to the API's `owner~actor` form. For an Actor that accepts an array of search phrases, set `queryField` to that input field. The function then adds nationwide and province-specific searches for existing Situasi findings.
- `SITUASI_APIFY_INGEST_SECRET`: long random shared secret used only by GitHub Actions and the Edge Function.
- Optional `APIFY_MAX_ITEMS`: maximum dataset items per Actor run (default 30, hard maximum 500).
- Optional `APIFY_MAX_TOTAL_CHARGE_USD`: per Actor run spend ceiling (default and enforced minimum USD 0.50, hard maximum USD 25). The initial TikTok run was rejected because USD 0.10 is below that Actor's minimum.
- Optional `APIFY_MAX_CONCURRENT_RUNS`: account-wide active Actor run ceiling (default and hard maximum 5). The function checks Apify account runs before launching new Actors and defers queued Actors when all slots are occupied. Existing runs are polled on later invocations.

## GitHub Actions secret
Add `SITUASI_APIFY_INGEST_SECRET` to repository Actions secrets with exactly the same value as the Supabase Edge Function secret.

## Data handling
- The pipeline reads the existing `situasi_system_findings`; when `queryField` is configured it expands those topic names and up to two keywords into nationwide plus 38 province-specific queries. It matches only explicit existing finding names/keywords.
- All normalized items are retained in `situasi_apify_items`, including unmatched items, for analyst review.
- Only items with a valid source URL, a parseable published timestamp, and an existing topic match are promoted to `situasi_observations`.
- Province/region fields are copied only when present in Actor output; the pipeline does not infer a location. The provided government Actor configuration seeds the national portal and 38 provincial government domains; review domain changes periodically.
- Sentiment and risk are not fabricated by the collector. The existing EWS database trigger computes risk only from its evidence rules.
- Deduplication uses a SHA-256 item hash for raw items and source URL for promoted Apify observations.
- Runs are asynchronous. If an Actor is still running after 30 seconds, the next scheduled invocation polls its run ID and processes its dataset after it succeeds. Actor starts are serialized through a queue and guarded by the Apify account-wide active-run count; no more than five Actor runs are launched concurrently by this pipeline.

## Actor selection
The current scheduled workflow executes only the Google News pilot described above. Do not add or enable another Actor until its input and output schemas, price, and a single test run have been verified. For later stages, choose Actors in Apify Store that you are licensed and permitted to use. Confirm their current input schema, output fields, platform terms, rate limits, and pricing before adding them to `APIFY_SITUASI_ACTORS`. For national and all-province coverage, include countrywide searches and province-specific search terms or official provincial URLs in each Actor's own input. Avoid private-account scraping, login bypass, or collection of sensitive personal data.

## Trigger and monitoring
GitHub Actions runs every 3 hours and supports manual dispatch:
`https://github.com/hmeilani80-max/sintesa-testing-api-ebran/actions/workflows/situasi-apify-ingestion.yml`

The authenticated Situasi > Sumber Data page reads run history and collected items from Supabase.


## Official provincial portal references
The 38 provincial portal domains in the example were cross-checked against the government provincial website directory published by the Directorate General of Livestock and Animal Health, Ministry of Agriculture, and the Ombudsman RI provincial government link directory. See https://bptusembawa.ditjenpkh.pertanian.go.id/informasi/pemerintah-provinsi/ and https://ombudsman.go.id/linkdir/link_list?cat_id=4.
