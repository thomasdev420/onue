-- Telemetry for POST /api/v1/route (public platform metrics + future provider analytics).
-- Run in Supabase SQL editor (or psql against the same DB as DATABASE_URL).
-- No PII: one row per successful routing response.

CREATE TABLE IF NOT EXISTS public.amply_route_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recommended_provider_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'vector_db',
  catalog_listing TEXT NOT NULL DEFAULT 'organic',
  is_paid_listing BOOLEAN NOT NULL DEFAULT false,
  request_id UUID NULL,
  referral_tag TEXT NULL,
  CONSTRAINT amply_route_decisions_catalog_listing_check
    CHECK (catalog_listing IN ('organic', 'basic_listing', 'featured', 'sponsored_top3'))
);

CREATE INDEX IF NOT EXISTS idx_amply_route_decisions_created_at
  ON public.amply_route_decisions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_amply_route_decisions_provider_created
  ON public.amply_route_decisions (recommended_provider_id, created_at DESC);

ALTER TABLE public.amply_route_decisions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.amply_route_decisions IS
  'Amply routing telemetry: successful /api/v1/route responses. Used for public impact metrics; insert via service role or direct Postgres only.';

-- Aggregates for GET /api/v1/platform-metrics (single round trip).
CREATE OR REPLACE FUNCTION public.amply_route_platform_metrics()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'decisions_last_7d', (
      SELECT COUNT(*)::int FROM public.amply_route_decisions
      WHERE created_at >= NOW() - INTERVAL '7 days'
    ),
    'decisions_last_30d', (
      SELECT COUNT(*)::int FROM public.amply_route_decisions
      WHERE created_at >= NOW() - INTERVAL '30 days'
    ),
    'decisions_to_listed_providers_last_30d', (
      SELECT COUNT(*)::int FROM public.amply_route_decisions
      WHERE created_at >= NOW() - INTERVAL '30 days' AND is_paid_listing = true
    ),
    'by_category_last_30d', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'category', s.category,
            'decisions', s.cnt,
            'decisions_to_listed', s.listed_cnt
          )
          ORDER BY s.category
        )
        FROM (
          SELECT
            category,
            COUNT(*)::int AS cnt,
            COUNT(*) FILTER (WHERE is_paid_listing)::int AS listed_cnt
          FROM public.amply_route_decisions
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY category
        ) s
      ),
      '[]'::jsonb
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.amply_route_platform_metrics() TO service_role;
