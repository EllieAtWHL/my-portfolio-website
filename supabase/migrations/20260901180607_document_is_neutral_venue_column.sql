-- WEB-137: also serves as the verification migration for the Supabase GitHub
-- integration - once merged, this should apply to the linked project automatically
-- via "Deploy to production", with no manual `supabase db push`.
COMMENT ON COLUMN "public"."matches"."is_neutral_venue" IS 'True when the match is played at neither team''s home ground (e.g. a cup final at a designated neutral venue) - distinct from stadium_id, which records the actual venue either way.';
