-- Amply routing catalog: vector DB providers + metrics (MVP).
-- Run in Supabase SQL editor after backup. API uses SUPABASE_SERVICE_ROLE_KEY.
-- Ongoing updates: prefer data/amply_route_catalog.json + npm run catalog:sync or Vercel GET /api/cron/catalog-refresh.

CREATE TABLE IF NOT EXISTS amply_route_providers (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'vector_db',
    is_active BOOLEAN NOT NULL DEFAULT true,
    p99_latency_ms NUMERIC NOT NULL,
    cost_per_1m_dims_usd NUMERIC NOT NULL,
    success_rate_last_24h NUMERIC NOT NULL CHECK (success_rate_last_24h >= 0 AND success_rate_last_24h <= 1),
    success_rate_last_7d NUMERIC NOT NULL CHECK (success_rate_last_7d >= 0 AND success_rate_last_7d <= 1),
    win_rate NUMERIC NOT NULL CHECK (win_rate >= 0 AND win_rate <= 1),
    revenue_captured_usd NUMERIC,
    missed_opportunity_usd NUMERIC,
    metrics_as_of TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    catalog_listing TEXT NOT NULL DEFAULT 'organic'
        CHECK (catalog_listing IN ('organic', 'basic_listing', 'featured', 'sponsored_top3'))
);

CREATE INDEX IF NOT EXISTS idx_amply_route_providers_active ON amply_route_providers (is_active) WHERE is_active = true;

COMMENT ON TABLE amply_route_providers IS 'Catalog + latest metrics for Amply POST /v1/route';

ALTER TABLE amply_route_providers ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: only service role (bypass RLS) used from Next API.

-- Seed (idempotent)
INSERT INTO amply_route_providers (
    id, display_name, p99_latency_ms, cost_per_1m_dims_usd,
    success_rate_last_24h, success_rate_last_7d, win_rate,
    revenue_captured_usd, missed_opportunity_usd
) VALUES
    ('qdrant', 'Qdrant', 14, 0.19, 0.982, 0.971, 0.44, 94500, NULL),
    ('pinecone', 'Pinecone', 28, 0.42, 0.941, 0.935, 0.29, 62300, 71200),
    ('weaviate', 'Weaviate', 35, 0.31, 0.967, 0.960, 0.17, 36500, 112400),
    ('chroma', 'Chroma', 62, 0.12, 0.894, 0.885, 0.08, 17200, 89000),
    ('supabase', 'Supabase', 81, 0.25, 0.923, 0.915, 0.02, 4300, 41000)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    p99_latency_ms = EXCLUDED.p99_latency_ms,
    cost_per_1m_dims_usd = EXCLUDED.cost_per_1m_dims_usd,
    success_rate_last_24h = EXCLUDED.success_rate_last_24h,
    success_rate_last_7d = EXCLUDED.success_rate_last_7d,
    win_rate = EXCLUDED.win_rate,
    revenue_captured_usd = EXCLUDED.revenue_captured_usd,
    missed_opportunity_usd = EXCLUDED.missed_opportunity_usd,
    metrics_as_of = NOW(),
    updated_at = NOW();
