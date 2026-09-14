-- WEB-156: replace player_history.is_loan (a plain boolean, no direction
-- info) with on_loan_from_team_id - a nullable FK to the parent club a stint
-- was loaned from. A row is a loan iff this is non-null; direction relative
-- to Tottenham is then derivable (team_id = Tottenham -> inbound, team_id !=
-- Tottenham with on_loan_from_team_id = Tottenham -> outbound) rather than
-- stored as a separate column. See WEB-164 for the admin UI / data layer /
-- frontend work that surfaces this.
--
-- Data note: 4 existing rows had is_loan = true (all inbound loans to
-- Tottenham) whose parent club isn't recorded anywhere else in the DB, so it
-- can't be backfilled automatically here. Tracked on WEB-156/WEB-164 for
-- manual correction once the admin "Loan from" field ships:
--   - Maika Hamano            (1d330c29-2003-40ef-a921-b2a89e4c4022)
--   - Grace Clinton           (635771c8-0ea6-45e4-ba1b-827fff6d9e30)
--   - Katelin Shawne Talbert  (c5fd3366-1542-47ae-a144-8e2fe77535db)
--   - Linyan Zhang            (f3eb89c8-9e59-4b2f-a313-d55ac47a9b33)

ALTER TABLE "public"."player_history"
    ADD COLUMN "on_loan_from_team_id" integer;

ALTER TABLE ONLY "public"."player_history"
    ADD CONSTRAINT "player_history_on_loan_from_team_id_fkey" FOREIGN KEY ("on_loan_from_team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL;

CREATE INDEX "player_history_on_loan_from_team_idx" ON "public"."player_history" USING "btree" ("on_loan_from_team_id");

COMMENT ON COLUMN "public"."player_history"."on_loan_from_team_id" IS 'Parent club this stint was loaned from, if any. Non-null means the row is a loan; direction relative to Tottenham is derived from this plus team_id, not stored separately. See WEB-156.';

ALTER TABLE "public"."player_history"
    DROP COLUMN "is_loan";
