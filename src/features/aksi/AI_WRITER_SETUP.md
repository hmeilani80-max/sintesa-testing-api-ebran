# AI Writer — Gemini setup

## Environment

Configure these variables in the server environment (Vercel Project Settings → Environment Variables) and redeploy the preview/production target when ready:

- `GEMINI_API_KEY`: Google AI Studio Gemini API key. Required; never expose it with a `VITE_` prefix or commit its value.
- `GEMINI_MODEL`: optional; defaults to `gemini-2.5-flash`.

The repository intentionally contains no key. Until the key is configured, Generate Produksi fails closed: the item is returned to Draft and is not labelled Generated. It does not fall back to the old deterministic dummy generator.

## Prompt families

The server-side gateway has independent instructions for:

1. **News Article** — headline, subtitle, lead, structured article body, tags.
2. **Infografis** — title, caption and 3–6 visual highlights.
3. **Carousel** — 5–7 slides with context, key points and clarification.
4. **Video Pendek** — 30–60 second vertical script, transcript and caption.
5. **Audio / Podcast** — spoken narrative with opening, context, points, uncertainty and close.

Every prompt requires Indonesian output, JSON only, factual grounding in the supplied brief, and prohibits invented numbers, sources, quotes, dates or unsupported verification claims. The server validates the returned JSON and applies type-specific minimum-content checks.

## Persistence and approval

The generation flow calls the authenticated server-side Gemini function, validates its response, then saves the complete new version through `saveProductionItem` / `production_save_item`. The UI is only marked Generated after the save succeeds. Generation invalidates an existing approval where applicable; it never approves or publishes content. A human must still submit the content for approval.

## Verification checklist

- [ ] Set `GEMINI_API_KEY` in Vercel for the desired environment.
- [ ] Run `npm test`, `npm run lint`, and `npm run build`.
- [ ] Generate one item for each of the five output types in a preview deployment.
- [ ] Confirm each generated item and version appears after refresh.
- [ ] Confirm missing/invalid key and malformed AI output do not produce Generated status.
- [ ] Confirm approval remains pending human action.
