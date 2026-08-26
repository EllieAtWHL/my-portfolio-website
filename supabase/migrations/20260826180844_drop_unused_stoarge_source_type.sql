-- WEB-136: "stoarge_source" (note the typo) is a leftover enum type from a completed
-- Supabase-to-GitHub image migration. No table column uses it (confirmed via
-- `supabase inspect db` and a full schema dump) - the app-code side of the same dead
-- field was already removed in WEB-123.
DROP TYPE IF EXISTS "public"."stoarge_source";
