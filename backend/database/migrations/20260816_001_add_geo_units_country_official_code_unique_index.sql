-- Prevent duplicate non-null geographic official codes within a country.
-- CONCURRENTLY reduces blocking when applied to an active database.
-- This statement must not be executed inside an explicit transaction.

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS
    uq_geo_units_country_official_code
ON public.geo_units USING btree
    (country_id, official_code)
WHERE official_code IS NOT NULL;