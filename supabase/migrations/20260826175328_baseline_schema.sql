SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."media_type" AS ENUM (
    'article',
    'social media',
    'photo',
    'photo album',
    'video-external'
);

CREATE TYPE "public"."position" AS ENUM (
    'Goalkeeper',
    'Defender',
    'Midfielder',
    'Forward'
);

COMMENT ON TYPE "public"."position" IS 'Player positions';

CREATE TYPE "public"."stoarge_source" AS ENUM (
    'supabase',
    'github'
);

COMMENT ON TYPE "public"."stoarge_source" IS 'Used whilst migrating image to Github so we can have a hybrid approach';

CREATE OR REPLACE FUNCTION "public"."update_stadium_names_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."competitions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "nickname" "text",
    "icon_svg" "text"
);

CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "competition_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "kickoff_time" time without time zone,
    "is_home_match" boolean NOT NULL,
    "spurs_score" integer,
    "opponent_score" integer,
    "attended" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "attendance" integer,
    "home_team_id" integer,
    "away_team_id" integer,
    "stadium_id" "uuid",
    "home_possession" real,
    "away_possession" real,
    "home_total_shots" smallint,
    "away_total_shots" smallint,
    "home_shots_on_target" smallint,
    "away_shots_on_target" smallint,
    "home_corners" smallint,
    "away_corners" smallint,
    "spurs_score_aet" integer,
    "opponent_score_aet" integer,
    "spurs_score_pens" integer,
    "opponent_score_pens" integer,
    "is_neutral_venue" boolean
);

COMMENT ON COLUMN "public"."matches"."spurs_score_aet" IS 'Used only if extra time is played and the score is different than after 90 mins';

COMMENT ON COLUMN "public"."matches"."opponent_score_aet" IS 'Used only if extra time is played and the score is different than after 90 mins';

COMMENT ON COLUMN "public"."matches"."spurs_score_pens" IS 'Used only if a penalty shoot out takes place';

COMMENT ON COLUMN "public"."matches"."opponent_score_pens" IS 'Used only if a penalty shoot out takes place';

CREATE TABLE IF NOT EXISTS "public"."media" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "match_id" "uuid" NOT NULL,
    "type" "public"."media_type" NOT NULL,
    "title" "text",
    "url" "text" NOT NULL,
    "caption" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "short_name" character varying(50),
    "primary_color" character varying(20) DEFAULT 'gray'::character varying,
    "secondary_color" character varying(20) DEFAULT 'white'::character varying,
    "is_tottenham" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

CREATE OR REPLACE VIEW "public"."match_media_summary" WITH ("security_invoker"='on') AS
 SELECT "ma"."id" AS "match_id",
    "ma"."date" AS "match_date",
    "ma"."attended",
    "home_team"."name" AS "home_team_name",
    "away_team"."name" AS "away_team_name",
    "count"("m"."id") AS "total_media",
    "count"(*) FILTER (WHERE ("m"."type" = 'photo'::"public"."media_type")) AS "photo_count",
    "count"(*) FILTER (WHERE ("m"."type" = 'photo album'::"public"."media_type")) AS "photo_album_count",
    "count"(*) FILTER (WHERE ("m"."type" = 'video-external'::"public"."media_type")) AS "video_count",
    "count"(*) FILTER (WHERE ("m"."type" = 'social media'::"public"."media_type")) AS "social_count",
    "count"(*) FILTER (WHERE ("m"."type" = 'article'::"public"."media_type")) AS "article_count"
   FROM ((("public"."matches" "ma"
     LEFT JOIN "public"."media" "m" ON (("m"."match_id" = "ma"."id")))
     LEFT JOIN "public"."teams" "home_team" ON (("ma"."home_team_id" = "home_team"."id")))
     LEFT JOIN "public"."teams" "away_team" ON (("ma"."away_team_id" = "away_team"."id")))
  GROUP BY "ma"."id", "ma"."date", "ma"."attended", "home_team"."name", "away_team"."name"
  ORDER BY "ma"."date" DESC;

CREATE TABLE IF NOT EXISTS "public"."stadia" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "city" "text",
    "country" "text",
    "address_line_1" "text",
    "postcode" "text",
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "capacity" integer,
    "opened_date" "date",
    "closed_date" "date",
    "home_team_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "capacity_positive" CHECK ((("capacity" IS NULL) OR ("capacity" > 0))),
    CONSTRAINT "valid_dates" CHECK ((("closed_date" IS NULL) OR ("closed_date" >= "opened_date")))
);

CREATE TABLE IF NOT EXISTS "public"."stadium_names" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stadium_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "valid_from" "date" NOT NULL,
    "valid_to" "date",
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_date_range" CHECK ((("valid_to" IS NULL) OR ("valid_to" >= "valid_from")))
);

CREATE OR REPLACE VIEW "public"."matches_with_stadium" WITH ("security_invoker"='on') AS
 SELECT "m"."id",
    "m"."season_id",
    "m"."competition_id",
    "m"."date",
    "m"."kickoff_time",
    "m"."is_home_match",
    "m"."is_neutral_venue",
    "m"."spurs_score",
    "m"."opponent_score",
    "m"."attended",
    "m"."notes",
    "m"."created_at",
    "m"."attendance",
    "m"."home_team_id",
    "m"."away_team_id",
    "m"."stadium_id",
    COALESCE("sn"."name", "s"."name") AS "stadium_display_name",
    "s"."name" AS "stadium_default_name",
    "s"."slug" AS "stadium_slug",
    "s"."city" AS "stadium_city",
    "s"."country" AS "stadium_country",
    "m"."home_possession",
    "m"."away_possession",
    "m"."home_total_shots",
    "m"."away_total_shots",
    "m"."home_shots_on_target",
    "m"."away_shots_on_target",
    "m"."home_corners",
    "m"."away_corners",
    "m"."spurs_score_aet",
    "m"."opponent_score_aet",
    "m"."spurs_score_pens",
    "m"."opponent_score_pens"
   FROM (("public"."matches" "m"
     LEFT JOIN "public"."stadia" "s" ON (("m"."stadium_id" = "s"."id")))
     LEFT JOIN "public"."stadium_names" "sn" ON ((("sn"."stadium_id" = "s"."id") AND ("m"."date" >= "sn"."valid_from") AND (("sn"."valid_to" IS NULL) OR ("m"."date" <= "sn"."valid_to")))));

CREATE TABLE IF NOT EXISTS "public"."seasons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "season_review" "text"
);

CREATE OR REPLACE VIEW "public"."media_with_match_details" WITH ("security_invoker"='on') AS
 SELECT "m"."id" AS "media_id",
    "m"."type" AS "media_type",
    "m"."title" AS "media_title",
    "m"."url" AS "media_url",
    "m"."caption" AS "media_caption",
    "m"."sort_order",
    "m"."created_at" AS "media_created_at",
    "ma"."id" AS "match_id",
    "ma"."date" AS "match_date",
    "ma"."kickoff_time",
    "ma"."spurs_score",
    "ma"."opponent_score",
    "ma"."attended",
    "home_team"."name" AS "home_team_name",
    "away_team"."name" AS "away_team_name",
    "c"."name" AS "competition_name",
    "s"."name" AS "season_name",
    ((("home_team"."name")::"text" || ' vs '::"text") || ("away_team"."name")::"text") AS "fixture_name"
   FROM ((((("public"."media" "m"
     JOIN "public"."matches" "ma" ON (("m"."match_id" = "ma"."id")))
     LEFT JOIN "public"."teams" "home_team" ON (("ma"."home_team_id" = "home_team"."id")))
     LEFT JOIN "public"."teams" "away_team" ON (("ma"."away_team_id" = "away_team"."id")))
     LEFT JOIN "public"."competitions" "c" ON (("ma"."competition_id" = "c"."id")))
     LEFT JOIN "public"."seasons" "s" ON (("ma"."season_id" = "s"."id")));

CREATE TABLE IF NOT EXISTS "public"."player_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "team_id" integer NOT NULL,
    "squad_number" integer,
    "joined_on" "date" NOT NULL,
    "left_on" "date",
    "is_loan" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."player_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "match_id" "uuid" NOT NULL,
    "team_id" integer NOT NULL,
    "started" boolean DEFAULT false NOT NULL,
    "was_substitute" boolean DEFAULT false NOT NULL,
    "was_unused_substitute" boolean DEFAULT false NOT NULL,
    "minute_on" integer,
    "minute_off" integer,
    "minutes_played" integer,
    "goals" integer DEFAULT 0 NOT NULL,
    "assists" integer DEFAULT 0 NOT NULL,
    "yellow_cards" integer DEFAULT 0 NOT NULL,
    "red_cards" integer DEFAULT 0 NOT NULL,
    "clean_sheet" boolean,
    "saves" integer,
    "shots" integer DEFAULT 0,
    "shots_on_target" integer DEFAULT 0,
    "passes_completed" integer,
    "passes_attempted" integer,
    "tackles" integer,
    "interceptions" integer,
    "clearances" integer,
    "fouls_committed" integer,
    "fouls_won" integer,
    "offsides" integer,
    "player_rating" numeric(3,1),
    "player_of_the_match" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "captain" boolean,
    CONSTRAINT "player_stats_minute_off_chk" CHECK ((("minute_off" IS NULL) OR ("minute_off" >= 0))),
    CONSTRAINT "player_stats_minute_on_chk" CHECK ((("minute_on" IS NULL) OR ("minute_on" >= 0))),
    CONSTRAINT "player_stats_minutes_chk" CHECK (("minutes_played" >= 0))
);

CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text",
    "last_name" "text" NOT NULL,
    "date_of_birth" "date",
    "nationality" "text",
    "height_cm" integer,
    "weight_kg" integer,
    "profile_image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "position" "public"."position"
);

CREATE SEQUENCE IF NOT EXISTS "public"."teams_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."teams_id_seq" OWNED BY "public"."teams"."id";

ALTER TABLE ONLY "public"."teams" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."teams_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."competitions"
    ADD CONSTRAINT "competitions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."player_history"
    ADD CONSTRAINT "player_history_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."player_stats"
    ADD CONSTRAINT "player_stats_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."player_stats"
    ADD CONSTRAINT "player_stats_unique_player_match" UNIQUE ("player_id", "match_id");

ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."stadia"
    ADD CONSTRAINT "stadia_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."stadia"
    ADD CONSTRAINT "stadia_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."stadium_names"
    ADD CONSTRAINT "stadium_names_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");

CREATE INDEX "idx_matches_away_team_id" ON "public"."matches" USING "btree" ("away_team_id");

CREATE INDEX "idx_matches_competition_id" ON "public"."matches" USING "btree" ("competition_id");

CREATE INDEX "idx_matches_home_team_id" ON "public"."matches" USING "btree" ("home_team_id");

CREATE INDEX "idx_matches_season_id" ON "public"."matches" USING "btree" ("season_id");

CREATE INDEX "idx_matches_stadium_id" ON "public"."matches" USING "btree" ("stadium_id");

CREATE INDEX "idx_media_match_id" ON "public"."media" USING "btree" ("match_id");

CREATE INDEX "idx_stadia_home_team" ON "public"."stadia" USING "btree" ("home_team_id");

CREATE INDEX "idx_stadia_slug" ON "public"."stadia" USING "btree" ("slug");

CREATE INDEX "idx_stadium_names_stadium_id" ON "public"."stadium_names" USING "btree" ("stadium_id");

CREATE INDEX "player_history_player_idx" ON "public"."player_history" USING "btree" ("player_id");

CREATE INDEX "player_history_team_idx" ON "public"."player_history" USING "btree" ("team_id");

CREATE INDEX "player_stats_match_idx" ON "public"."player_stats" USING "btree" ("match_id");

CREATE INDEX "player_stats_player_idx" ON "public"."player_stats" USING "btree" ("player_id");

CREATE UNIQUE INDEX "player_stats_single_potm_per_match_idx" ON "public"."player_stats" USING "btree" ("match_id") WHERE ("player_of_the_match" = true);

CREATE INDEX "player_stats_team_idx" ON "public"."player_stats" USING "btree" ("team_id");

CREATE INDEX "players_last_name_idx" ON "public"."players" USING "btree" ("last_name");

CREATE UNIQUE INDEX "uniq_stadia_name_city" ON "public"."stadia" USING "btree" ("lower"("name"), "lower"("city"));

CREATE OR REPLACE TRIGGER "update_stadia_updated_at" BEFORE UPDATE ON "public"."stadia" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_stadium_names_updated_at" BEFORE UPDATE ON "public"."stadium_names" FOR EACH ROW EXECUTE FUNCTION "public"."update_stadium_names_updated_at"();

ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id");

ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id");

ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_stadium_id_fkey" FOREIGN KEY ("stadium_id") REFERENCES "public"."stadia"("id");

ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."player_history"
    ADD CONSTRAINT "player_history_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."player_history"
    ADD CONSTRAINT "player_history_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."player_stats"
    ADD CONSTRAINT "player_stats_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."player_stats"
    ADD CONSTRAINT "player_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."player_stats"
    ADD CONSTRAINT "player_stats_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."stadia"
    ADD CONSTRAINT "stadia_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id");

ALTER TABLE ONLY "public"."stadium_names"
    ADD CONSTRAINT "stadium_names_stadium_id_fkey" FOREIGN KEY ("stadium_id") REFERENCES "public"."stadia"("id") ON DELETE CASCADE;

CREATE POLICY "Authenticated delete stadia" ON "public"."stadia" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "Authenticated delete stadium_names" ON "public"."stadium_names" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "Authenticated insert stadia" ON "public"."stadia" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Authenticated insert stadium_names" ON "public"."stadium_names" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Authenticated update stadia" ON "public"."stadia" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated update stadium_names" ON "public"."stadium_names" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only" ON "public"."matches" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON "public"."media" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."matches" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."media" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."player_history" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."player_stats" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."players" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."teams" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."player_history" FOR SELECT USING (true);

CREATE POLICY "Enable update for authenticated users only" ON "public"."matches" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "Enable update for authenticated users only" ON "public"."media" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "Player stats are viewable by everyone" ON "public"."player_stats" FOR SELECT USING (true);

CREATE POLICY "Players are viewable by everyone" ON "public"."players" FOR SELECT USING (true);

CREATE POLICY "Public read access" ON "public"."competitions" FOR SELECT USING (true);

CREATE POLICY "Public read access" ON "public"."matches" FOR SELECT USING (true);

CREATE POLICY "Public read access" ON "public"."media" FOR SELECT USING (true);

CREATE POLICY "Public read access" ON "public"."seasons" FOR SELECT USING (true);

CREATE POLICY "Public read access" ON "public"."teams" FOR SELECT USING (true);

CREATE POLICY "Public read stadia" ON "public"."stadia" FOR SELECT USING (true);

CREATE POLICY "Public read stadium_names" ON "public"."stadium_names" FOR SELECT USING (true);

ALTER TABLE "public"."competitions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."player_history" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."player_stats" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."seasons" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."stadia" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."stadium_names" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."update_stadium_names_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_stadium_names_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stadium_names_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";

GRANT ALL ON TABLE "public"."competitions" TO "anon";
GRANT ALL ON TABLE "public"."competitions" TO "authenticated";
GRANT ALL ON TABLE "public"."competitions" TO "service_role";

GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";

GRANT ALL ON TABLE "public"."media" TO "anon";
GRANT ALL ON TABLE "public"."media" TO "authenticated";
GRANT ALL ON TABLE "public"."media" TO "service_role";

GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";

GRANT ALL ON TABLE "public"."match_media_summary" TO "anon";
GRANT ALL ON TABLE "public"."match_media_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."match_media_summary" TO "service_role";

GRANT ALL ON TABLE "public"."stadia" TO "anon";
GRANT ALL ON TABLE "public"."stadia" TO "authenticated";
GRANT ALL ON TABLE "public"."stadia" TO "service_role";

GRANT ALL ON TABLE "public"."stadium_names" TO "anon";
GRANT ALL ON TABLE "public"."stadium_names" TO "authenticated";
GRANT ALL ON TABLE "public"."stadium_names" TO "service_role";

GRANT ALL ON TABLE "public"."matches_with_stadium" TO "anon";
GRANT ALL ON TABLE "public"."matches_with_stadium" TO "authenticated";
GRANT ALL ON TABLE "public"."matches_with_stadium" TO "service_role";

GRANT ALL ON TABLE "public"."seasons" TO "anon";
GRANT ALL ON TABLE "public"."seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."seasons" TO "service_role";

GRANT ALL ON TABLE "public"."media_with_match_details" TO "anon";
GRANT ALL ON TABLE "public"."media_with_match_details" TO "authenticated";
GRANT ALL ON TABLE "public"."media_with_match_details" TO "service_role";

GRANT ALL ON TABLE "public"."player_history" TO "anon";
GRANT ALL ON TABLE "public"."player_history" TO "authenticated";
GRANT ALL ON TABLE "public"."player_history" TO "service_role";

GRANT ALL ON TABLE "public"."player_stats" TO "anon";
GRANT ALL ON TABLE "public"."player_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."player_stats" TO "service_role";

GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";

GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

