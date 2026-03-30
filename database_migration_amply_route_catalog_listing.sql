-- Optional: run in Supabase / psql after backup.
-- Adds transparent catalog placement labels for /catalog and GET /api/v1/providers.
-- Sync from JSON/cron does not overwrite this column on existing rows (see catalogSyncFromSnapshot).

ALTER TABLE amply_route_providers
  ADD COLUMN IF NOT EXISTS catalog_listing TEXT NOT NULL DEFAULT 'organic';

ALTER TABLE amply_route_providers
  DROP CONSTRAINT IF EXISTS amply_route_providers_catalog_listing_check;

ALTER TABLE amply_route_providers
  ADD CONSTRAINT amply_route_providers_catalog_listing_check
  CHECK (catalog_listing IN (
    'organic',
    'basic_listing',
    'featured',
    'sponsored_top3'
  ));

COMMENT ON COLUMN amply_route_providers.catalog_listing IS
  'organic = editorial metrics only; paid tiers are disclosed in API + /catalog.';
