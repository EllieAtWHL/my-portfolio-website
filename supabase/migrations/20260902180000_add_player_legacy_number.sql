-- WEB-142: Spurs Women legacy numbers - a permanent, sequential number the
-- club assigns to every player on their competitive debut (announced for the
-- Women's team Sept 2026). Deliberately not on player_history: unlike
-- squad_number it never changes and isn't tied to a particular team stint.
ALTER TABLE "public"."players"
    ADD COLUMN "legacy_number" integer;

ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_legacy_number_key" UNIQUE ("legacy_number");

COMMENT ON COLUMN "public"."players"."legacy_number" IS 'Permanent, sequential number assigned by the club to every player on their competitive debut - distinct from the per-stint squad_number in player_history. Populated manually via the admin form (see WEB-144), not derived from other data.';
