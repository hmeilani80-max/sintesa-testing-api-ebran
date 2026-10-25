# AI Writer — Gemini + Luma setup

## Environment

Configure these variables in the server environment (Vercel Project Settings → Environment Variables) and redeploy the preview/production target when ready:

- `GEMINI_API_KEY`: Google AI Studio Gemini API key. Required; never expose it with a `VITE_` prefix or commit its value.
- `GEMINI_MODEL`: optional; defaults to `gemini-2.5-flash` for article, carousel, video script, and audio script generation.
- `LUMA_API_KEY`: required for Infografis image generation via Luma Dream Machine. Server-only; never use a `VITE_` prefix or commit the value.
- `LUMA_IMAGE_MODEL`: optional; defaults to `photon-1`.

The repository intentionally contains no key. Until the key is configured, Generate Produksi fails closed: the item is returned to Draft and is not labelled Generated. It does not fall back to the old deterministic dummy generator.

## First rollout: News Article\n\nThe first AI output to verify is **Produksi → News Article**. The authenticated server function `generateProductionContent` uses `GEMINI_API_KEY` only on the server and the `GEMINI_MODEL` setting (default `gemini-2.5-flash`). It returns structured JSON, validates the response, and refuses to mark an incomplete article as Generated.\n\nNews Article output contract:\n- Headline, subtitle, lead, 4–7 concise body paragraphs, and 3–8 tags.\n- Indonesian newsroom tone; the brief is the only factual source.\n- No invented quotes, dates, locations, official attribution, source names, numbers, or verification claims.\n- Missing source details are disclosed as an editorial verification task.\n- Human editorial review remains mandatory; generation does not approve or publish.\n\n## Prompt families

The server-side gateway has independent instructions for:

1. **News Article** — headline, subtitle, lead, structured article body, tags.
2. **Infografis** — Luma generates a visual asset; the application preserves the exact brief facts in a readable text layer rather than relying on the image model to render text.
3. **Carousel** — 5–7 slides with context, key points and clarification.
4. **Video Pendek** — 30–60 second vertical script, transcript and caption.
5. **Audio / Podcast** — spoken narrative with opening, context, points, uncertainty and close.

Every prompt requires Indonesian output, JSON only, factual grounding in the supplied brief, and prohibits invented numbers, sources, quotes, dates or unsupported verification claims. The server validates the returned JSON and applies type-specific minimum-content checks.

## Persistence and approval

The generation flow calls authenticated server-side AI functions, validates their outputs, then saves the complete new version through `saveProductionItem` / `production_save_item`. Infografis uses Luma image generation; the other output types use Gemini. The UI is only marked Generated after the save succeeds. Generation invalidates an existing approval where applicable; it never approves or publishes content. A human must still submit the content for approval.

## Verification checklist

- [ ] Set `GEMINI_API_KEY` for article/carousel/video/audio generation.
- [ ] Set `LUMA_API_KEY` in Vercel Preview for Infografis generation.
- [ ] Run `npm test`, `npm run lint`, and `npm run build`.
- [ ] Generate one item for each of the five output types in a preview deployment.
- [ ] Confirm each generated item and version appears after refresh.
- [ ] Confirm missing/invalid key and malformed AI output do not produce Generated status.
- [ ] Confirm approval remains pending human action.
