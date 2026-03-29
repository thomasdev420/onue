# AI Selection Engine: MVP (implementation started)

This is the first vertical slice of [AMPLY_ARCHITECTURE.md](./AMPLY_ARCHITECTURE.md): **ingestion, query simulation, parsing, scores**, running synchronously inside Next.js API routes (queue/RabbitMQ/BullMQ comes later).

## What shipped

| Piece | Location |
|--------|----------|
| **Schema** | `database_setup_amply_selection.sql`: `amply_products`, `amply_scans`, `amply_query_runs` |
| **Ingestion** | `app/services/amplySelection/`: `fetchPageText`, `normalizeToCanonicalProduct`, `ingestProduct.js` |
| **Query simulation** | `queryTemplates.js`, `querySimulation.js`: OpenAI + optional Anthropic |
| **Parsing & scores** | `parsing.js`, `runScan.js`: structured parse + aggregate visibility/selection |
| **API** | `POST /api/amply/selection/intake`, `GET/POST .../products/[id]`, `POST .../products/[id]/scan` |
| **UI** | `/dashboard/selection`: URL ingest, run scan, show scores |

## Setup

1. **Supabase:** Run `database_setup_amply_selection.sql` in the SQL editor.

2. **Env vars**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; used by API routes to write `amply_*` tables)
   - `OPENAI_API_KEY` (required)
   - `ANTHROPIC_API_KEY` (optional: adds Claude runs alongside OpenAI)

3. **Optional tuning**
   - `AMPLY_CANONICAL_MODEL` (default `gpt-4o-mini`)
   - `AMPLY_SIMULATION_MODEL_OPENAI` (default `gpt-4o-mini`)
   - `AMPLY_SIMULATION_MODEL_CLAUDE` (default `claude-3-5-haiku-20241022`)
   - `AMPLY_PARSE_MODEL` (default `gpt-4o-mini`)
   - `AMPLY_SCAN_QUERY_COUNT` (default `6` templates)
   - **Local dev only:** `AMPLY_SELECTION_DEV_BYPASS=1` and `AMPLY_SELECTION_DEV_EMAIL=you@example.com` to force a fixed dev email (overrides session + anon)
   - **Try without signing in:** By default, unsigned users can open `/dashboard/selection` and APIs use `user_id` = `anonymous@amply.selection` (override with `AMPLY_SELECTION_ANON_USER_ID`). Set **`AMPLY_SELECTION_ALLOW_ANON=0`** to require a real session again.

## Next steps (architecture alignment)

- [ ] Redis cache for `query+model+productHash` (cost control)
- [ ] BullMQ / RabbitMQ for async scans + `ScanRequested` events
- [ ] S3 for raw LLM payloads
- [ ] Recommendation + Action services (manual apply first)
- [ ] Shopify OAuth ingest (Phase 2)
