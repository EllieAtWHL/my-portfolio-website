-- WEB-224: groundwork for growing Groundhopper's stadium pool (WEB-222) in
-- the same table, rather than a separate one - so a ground can appear in both
-- the game and the Spurs Women pages without being duplicated.
--
-- spurs_women: true for grounds that belong on the Spurs Women pages
-- (stadiums list, detail pages, team grounds). Defaults to true so every
-- existing row - all of which are Spurs Women grounds - is unchanged and the
-- current code, which doesn't read this column yet, is unaffected. Grounds
-- imported only for the game are inserted with false.
ALTER TABLE "public"."stadia"
    ADD COLUMN "spurs_women" boolean DEFAULT true NOT NULL;

COMMENT ON COLUMN "public"."stadia"."spurs_women" IS 'True when the ground belongs on the Spurs Women pages (stadiums list, detail pages, team grounds). False for grounds imported only for the Groundhopper game. Set to true automatically when a match is saved at the ground (trigger matches_promote_stadium_to_spurs_women).';

-- Any match saved at a game-only ground means Spurs Women have played (or
-- will play) there, so it belongs on the Spurs Women pages. Done as a trigger
-- rather than in the admin save path so every way a match gets written
-- (admin API, SQL editor, future scripts) promotes the ground - nothing has to
-- remember to. A no-op today, while every row is already true.
CREATE OR REPLACE FUNCTION "public"."promote_match_stadium_to_spurs_women"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    update public.stadia
    set spurs_women = true
    where id = new.stadium_id and spurs_women = false;
    return new;
end;
$$;

CREATE OR REPLACE TRIGGER "matches_promote_stadium_to_spurs_women" AFTER INSERT OR UPDATE OF "stadium_id" ON "public"."matches" FOR EACH ROW WHEN (("new"."stadium_id" IS NOT NULL)) EXECUTE FUNCTION "public"."promote_match_stadium_to_spurs_women"();

-- wikidata_qid: the Wikidata item a row was imported from or matched to
-- (e.g. Q19542), so the import script can re-run each season without
-- creating duplicates. Partial unique index: most hand-entered rows will
-- never have one.
-- Bare QIDs only (not the http://www.wikidata.org/entity/Q... URIs SPARQL
-- returns), or the unique index below could be sidestepped by two spellings
-- of the same item.
ALTER TABLE "public"."stadia"
    ADD COLUMN "wikidata_qid" text,
    ADD CONSTRAINT "stadia_wikidata_qid_format" CHECK (("wikidata_qid" IS NULL) OR ("wikidata_qid" ~ '^Q[1-9][0-9]*$'));

CREATE UNIQUE INDEX "uniq_stadia_wikidata_qid" ON "public"."stadia" USING "btree" ("wikidata_qid") WHERE ("wikidata_qid" IS NOT NULL);

COMMENT ON COLUMN "public"."stadia"."wikidata_qid" IS 'Wikidata item ID (e.g. Q19542) the row was imported from or matched to by the Groundhopper stadium import (WEB-222). Null for grounds not linked to Wikidata.';
