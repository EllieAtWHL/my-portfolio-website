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

COMMENT ON COLUMN "public"."stadia"."spurs_women" IS 'True when the ground belongs on the Spurs Women pages (stadiums list, detail pages, team grounds). False for grounds imported only for the Groundhopper game. Set to true automatically when a match is saved at the ground (WEB-222).';

-- wikidata_qid: the Wikidata item a row was imported from or matched to
-- (e.g. Q19542), so the import script can re-run each season without
-- creating duplicates. Partial unique index: most hand-entered rows will
-- never have one.
ALTER TABLE "public"."stadia"
    ADD COLUMN "wikidata_qid" text;

CREATE UNIQUE INDEX "uniq_stadia_wikidata_qid" ON "public"."stadia" USING "btree" ("wikidata_qid") WHERE ("wikidata_qid" IS NOT NULL);

COMMENT ON COLUMN "public"."stadia"."wikidata_qid" IS 'Wikidata item ID (e.g. Q19542) the row was imported from or matched to by the Groundhopper stadium import (WEB-222). Null for grounds not linked to Wikidata.';
