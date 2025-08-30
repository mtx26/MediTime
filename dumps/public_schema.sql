

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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."ensure_calendar_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.calendar_settings (calendar_id)  -- valeurs par défaut déjà en DEFAULT
  VALUES (NEW.id)
  ON CONFLICT (calendar_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_calendar_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_shared_calendar_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.shared_calendar_settings (shared_calendar_id)
  VALUES (NEW.id)
  ON CONFLICT (shared_calendar_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_shared_calendar_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."calendar_settings" (
    "calendar_id" "uuid" NOT NULL,
    "stock_decrement_method" "text" DEFAULT 'weekly_pillbox'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "calendar_settings_stock_decrement_method_chk" CHECK (("stock_decrement_method" = ANY (ARRAY['weekly_pillbox'::"text", 'daily_midnight'::"text"])))
);


ALTER TABLE "public"."calendar_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendars" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_uid" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."calendars" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fcm_tokens" (
    "uid" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fcm_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calendar_id" "uuid" NOT NULL,
    "invited_email" "text",
    "role" "text" DEFAULT 'write'::"text" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invitations_role_check" CHECK (("role" = ANY (ARRAY['read'::"text", 'write'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medicaments_afmps" (
    "name" "text",
    "dose" "text",
    "forme_pharmaceutique" "text",
    "voie_administration" "text",
    "conditionnement" "text",
    "substance_active" "text",
    "code_atc" "text",
    "code_cnk" "text",
    "code_fmd" "text",
    "url_notice_fr" "text",
    "url_notice_nl" "text",
    "url_notice_de" "text",
    "url_rcp" "text",
    "url_summary_rmp_fr" "text",
    "url_summary_rmp_nl" "text",
    "url_summary_rmp_de" "text",
    "date_derniere_publication_rcp_notice" "date",
    "date_derniere_approbation_rcp_notice" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."medicaments_afmps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medicine_box_conditions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "box_id" "uuid" NOT NULL,
    "time_of_day" "text" DEFAULT 'morning'::"text" NOT NULL,
    "interval_days" integer DEFAULT 1 NOT NULL,
    "start_date" "date",
    "tablet_count" double precision NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."medicine_box_conditions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medicine_boxes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calendar_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "stock_quantity" double precision DEFAULT '0'::double precision NOT NULL,
    "stock_alert_threshold" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "box_capacity" integer DEFAULT 0 NOT NULL,
    "dose" integer
);


ALTER TABLE "public"."medicine_boxes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text",
    "content" "jsonb",
    "read" boolean DEFAULT false NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "sender_uid" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "shared_calendar_id" "uuid"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shared_calendar_settings" (
    "shared_calendar_id" "uuid" NOT NULL,
    "notifications_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shared_calendar_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shared_calendars" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calendar_id" "uuid" NOT NULL,
    "receiver_uid" "uuid" NOT NULL,
    "access" "text" DEFAULT 'edit'::"text" NOT NULL,
    "accepted" boolean DEFAULT false NOT NULL,
    "accepted_at" timestamp with time zone,
    "token" "uuid" DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shared_calendars" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shared_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calendar_id" "uuid" NOT NULL,
    "expires_at" timestamp without time zone,
    "permissions" "text" DEFAULT 'read'::"text" NOT NULL,
    "revoked" boolean DEFAULT false NOT NULL,
    "owner_uid" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shared_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "photo_url" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email_enabled" boolean DEFAULT true,
    "push_enabled" boolean DEFAULT true,
    "sms_enabled" boolean DEFAULT false NOT NULL,
    "phone" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."calendar_settings"
    ADD CONSTRAINT "calendar_settings_pkey" PRIMARY KEY ("calendar_id");



ALTER TABLE ONLY "public"."shared_calendars"
    ADD CONSTRAINT "calendar_shared_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendars"
    ADD CONSTRAINT "calendars_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fcm_tokens"
    ADD CONSTRAINT "fcm_tokens_token_pkey" PRIMARY KEY ("token");



ALTER TABLE ONLY "public"."fcm_tokens"
    ADD CONSTRAINT "fcm_tokens_uid_token_unique" UNIQUE ("uid", "token");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."medicine_box_conditions"
    ADD CONSTRAINT "medicine_box_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medicine_boxes"
    ADD CONSTRAINT "medicine_boxes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shared_calendar_settings"
    ADD CONSTRAINT "shared_calendar_settings_pkey" PRIMARY KEY ("shared_calendar_id");



ALTER TABLE ONLY "public"."shared_calendars"
    ADD CONSTRAINT "shared_calendars_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."shared_tokens"
    ADD CONSTRAINT "shared_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "invitations_calendar_id_idx" ON "public"."invitations" USING "btree" ("calendar_id");



CREATE UNIQUE INDEX "invitations_token_idx" ON "public"."invitations" USING "btree" ("token");



CREATE OR REPLACE TRIGGER "trg_ensure_calendar_settings" AFTER INSERT ON "public"."calendars" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_calendar_settings"();



CREATE OR REPLACE TRIGGER "trg_ensure_shared_calendar_settings" AFTER INSERT ON "public"."shared_calendars" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_shared_calendar_settings"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_bis_medicaments_afmps" BEFORE UPDATE ON "public"."medicaments_afmps" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_calendar_settings" BEFORE UPDATE ON "public"."calendar_settings" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_calendars" BEFORE UPDATE ON "public"."calendars" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_fcm_tokens" BEFORE UPDATE ON "public"."fcm_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_invitations" BEFORE UPDATE ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_medicine_box_conditions" BEFORE UPDATE ON "public"."medicine_box_conditions" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_medicine_boxes" BEFORE UPDATE ON "public"."medicine_boxes" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_notifications" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_shared_calendar_settings" BEFORE UPDATE ON "public"."shared_calendar_settings" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_shared_calendars" BEFORE UPDATE ON "public"."shared_calendars" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_shared_tokens" BEFORE UPDATE ON "public"."shared_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_users" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



ALTER TABLE ONLY "public"."calendar_settings"
    ADD CONSTRAINT "calendar_settings_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_calendars"
    ADD CONSTRAINT "calendar_shared_users_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_calendars"
    ADD CONSTRAINT "calendar_shared_users_receiver_uid_fkey" FOREIGN KEY ("receiver_uid") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendars"
    ADD CONSTRAINT "calendars_owner_uid_fkey" FOREIGN KEY ("owner_uid") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fcm_tokens"
    ADD CONSTRAINT "fcm_tokens_uid_fkey" FOREIGN KEY ("uid") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medicine_box_conditions"
    ADD CONSTRAINT "medicine_box_conditions_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "public"."medicine_boxes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medicine_boxes"
    ADD CONSTRAINT "medicine_boxes_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_sender_uid_fkey" FOREIGN KEY ("sender_uid") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_shared_calendar_id_fkey" FOREIGN KEY ("shared_calendar_id") REFERENCES "public"."shared_calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_calendar_settings"
    ADD CONSTRAINT "shared_calendar_settings_shared_calendar_id_fkey" FOREIGN KEY ("shared_calendar_id") REFERENCES "public"."shared_calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_tokens"
    ADD CONSTRAINT "shared_tokens_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_tokens"
    ADD CONSTRAINT "shared_tokens_owner_uid_fkey" FOREIGN KEY ("owner_uid") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_calendar_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_calendar_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_calendar_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_shared_calendar_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_shared_calendar_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_shared_calendar_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."calendar_settings" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."calendar_settings" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."calendar_settings" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."calendars" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."calendars" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."calendars" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fcm_tokens" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fcm_tokens" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."fcm_tokens" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."invitations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."invitations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."invitations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."medicaments_afmps" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."medicaments_afmps" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."medicaments_afmps" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."medicine_box_conditions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."medicine_box_conditions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."medicine_box_conditions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."medicine_boxes" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."medicine_boxes" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."medicine_boxes" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_calendar_settings" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_calendar_settings" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_calendar_settings" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_calendars" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_calendars" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_calendars" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_tokens" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_tokens" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_tokens" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "service_role";






RESET ALL;
