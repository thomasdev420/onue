-- Run in Supabase SQL editor when you want to bump freshness timestamps
-- without changing routing numbers (e.g. after a deploy or manual review).
-- For real metric updates, UPDATE the numeric columns from your pipeline instead.

UPDATE amply_route_providers
SET
  metrics_as_of = NOW(),
  updated_at = NOW()
WHERE is_active = true;
