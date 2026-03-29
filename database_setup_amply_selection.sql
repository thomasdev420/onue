-- Amply AI Selection Engine: MVP schema (AMPLY_ARCHITECTURE.md)
-- Run in Supabase SQL editor or psql after backup.
-- API routes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).

-- Products ingested from URL (Shopify phase 2: add shopify_store_id, etc.)
CREATE TABLE IF NOT EXISTS amply_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'url' CHECK (source_type IN ('url', 'shopify', 'manual')),
    source_url TEXT,
    canonical_jsonb JSONB NOT NULL DEFAULT '{}',
    raw_page_excerpt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amply_products_user_id ON amply_products(user_id);
CREATE INDEX IF NOT EXISTS idx_amply_products_created_at ON amply_products(created_at DESC);

-- One scan = one batch of query runs + aggregate scores
CREATE TABLE IF NOT EXISTS amply_scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES amply_products(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    visibility_score NUMERIC(5,2),
    selection_score NUMERIC(5,2),
    query_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    meta_jsonb JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amply_scans_product_id ON amply_scans(product_id);
CREATE INDEX IF NOT EXISTS idx_amply_scans_created_at ON amply_scans(created_at DESC);

-- Individual simulated LLM query + parse result
CREATE TABLE IF NOT EXISTS amply_query_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scan_id UUID NOT NULL REFERENCES amply_scans(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    query_text TEXT NOT NULL,
    raw_response TEXT,
    parsed_jsonb JSONB DEFAULT '{}',
    mentioned BOOLEAN,
    selected_as_best BOOLEAN,
    position_estimate INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amply_query_runs_scan_id ON amply_query_runs(scan_id);

COMMENT ON TABLE amply_products IS 'Canonical product/service records for AI selection scans';
COMMENT ON TABLE amply_scans IS 'Aggregate visibility/selection scores per scan batch';
COMMENT ON TABLE amply_query_runs IS 'Per-model simulated answers and structured parse';
