# Situasi RSS Ingestion

## Pipeline

GitHub Actions runs every 15 minutes and calls the Supabase Edge Function. The function reads the official ANTARA RSS feeds, matches titles/descriptions only against existing `situasi_system_findings.name/keywords`, and writes matched items to `situasi_observations`.

The observation trigger then refreshes the evidence-based EWS engine. An article is not assigned sentiment, region, or a real-world actor automatically; those fields remain unclassified unless a later enrichment stage verifies them.

## Security setup required

The function is deployed with JWT verification disabled because the scheduled GitHub runner is not a Supabase user session. It enforces a separate high-entropy shared secret in the `x-ingest-secret` header.

1. Generate a unique random secret (at least 32 bytes).
2. In Supabase Dashboard → Edge Functions → Secrets, add `SITUASI_RSS_INGEST_SECRET` with that value.
3. In GitHub repository Settings → Secrets and variables → Actions, add a repository secret with the exact same name and value: `SITUASI_RSS_INGEST_SECRET`.
4. Run the workflow manually once from Actions → Situasi RSS Ingestion → Run workflow. After that, it runs every 15 minutes.

Do not commit the secret or put it in frontend environment variables.

## Feed sources

- ANTARA Terkini: https://www.antaranews.com/rss/terkini.xml
- ANTARA Politik: https://www.antaranews.com/rss/politik.xml
- ANTARA Hukum: https://www.antaranews.com/rss/hukum.xml
- ANTARA Ekonomi: https://www.antaranews.com/rss/ekonomi.xml
- ANTARA Jawa Barat: https://jabar.antaranews.com/rss/terkini.xml
- ANTARA Jabar Nasional: https://jabar.antaranews.com/rss/nasional.xml

## Matching and quality safeguards

- Only HTTPS article URLs from ANTARA domains are accepted.
- Only published items from the previous 14 days are processed.
- A source URL can be inserted once as RSS evidence; repeat runs skip duplicates.
- Items without a match to an existing finding are counted but not converted into new findings.
- Keyword matching is deterministic and intentionally conservative.
- Sentiment, region, and actor attribution are not guessed.
- EWS retains its existing minimum of five observations in seven days before assigning a score.
- Each run is recorded in `situasi_rss_ingestion_runs`.

## Manual test

After configuring both secrets, run the GitHub Actions workflow manually. Inspect the latest run:

```sql
select *
from public.situasi_rss_ingestion_runs
order by started_at desc
limit 10;
```

Inspect ingested evidence:

```sql
select topic_slug, count(*) as observations,
       max(observed_at) as latest_observation
from public.situasi_observations
where platform = 'RSS'
group by topic_slug
order by observations desc;
```
