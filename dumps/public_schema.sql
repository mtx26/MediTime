


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


CREATE OR REPLACE FUNCTION "public"."get_auth_email"() RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT email FROM users WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_auth_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_email"() RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT email FROM public.users WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_current_user_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_fcm_tokens_for_user"("target_uid" "uuid") RETURNS TABLE("token" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT token FROM public.fcm_tokens WHERE uid = target_uid;
$$;


ALTER FUNCTION "public"."get_fcm_tokens_for_user"("target_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_user_info"("target_uid" "uuid") RETURNS TABLE("display_name" "text", "photo_url" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT display_name, photo_url FROM public.users WHERE id = target_uid;
$$;


ALTER FUNCTION "public"."get_public_user_info"("target_uid" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


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


CREATE OR REPLACE FUNCTION "public"."get_user_by_email"("lookup_email" "text") RETURNS SETOF "public"."users"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT * FROM public.users WHERE email = lookup_email;
$$;


ALTER FUNCTION "public"."get_user_by_email"("lookup_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_calendar_owner"("cal_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM calendars
    WHERE id = cal_id
    AND owner_uid = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_calendar_owner"("cal_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_calendar_receiver"("cal_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM shared_calendars
    WHERE calendar_id = cal_id
    AND receiver_uid = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_calendar_receiver"("cal_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_invited_to_calendar"("cal_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM invitations
    WHERE calendar_id = cal_id
    AND invited_email = (SELECT email FROM users WHERE id = auth.uid())
  );
$$;


ALTER FUNCTION "public"."is_invited_to_calendar"("cal_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_invited_user"("target_uid" "uuid", "invited_email" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM users u
        WHERE u.id = target_uid
        AND LOWER(u.email) = LOWER(invited_email)
    );
$$;


ALTER FUNCTION "public"."is_invited_user"("target_uid" "uuid", "invited_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_invited_by_email"("invite_email" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND email = invite_email
  );
$$;


ALTER FUNCTION "public"."is_user_invited_by_email"("invite_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_settings" (
    "calendar_id" "uuid" NOT NULL,
    "stock_decrement_method" "text" DEFAULT 'weekly_pillbox'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "notifications_enabled" boolean DEFAULT true NOT NULL,
    CONSTRAINT "calendar_settings_stock_decrement_method_chk" CHECK (("stock_decrement_method" = ANY (ARRAY['weekly_pillbox'::"text", 'daily_midnight'::"text"])))
);


ALTER TABLE "public"."calendar_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendars" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_uid" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."calendars" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fcm_tokens" (
    "uid" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fcm_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ics_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calendar_id" "uuid" NOT NULL,
    "owner_uid" "uuid" NOT NULL,
    "token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(32), 'hex'::"text") NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone,
    "last_user_agent" "text",
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."ics_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calendar_id" "uuid" NOT NULL,
    "invited_email" "text",
    "role" "text" DEFAULT 'write'::"text" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "max_date" timestamp with time zone,
    CONSTRAINT "medicine_box_conditions_time_of_day_check" CHECK (("time_of_day" = ANY (ARRAY['morning'::"text", 'noon'::"text", 'evening'::"text"])))
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
    "dose" integer,
    "deleted_at" timestamp with time zone
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
    "shared_calendar_id" "uuid",
    "calendar_id" "uuid",
    "medication_id" "uuid"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pillbox_uses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calendar_id" "uuid" NOT NULL,
    "prepared_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "prepared_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "restored_at" timestamp with time zone
);


ALTER TABLE "public"."pillbox_uses" OWNER TO "postgres";


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
    "accepted_at" timestamp with time zone,
    "token" "uuid" DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."shared_calendars" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shared_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calendar_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone,
    "owner_uid" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."shared_tokens" OWNER TO "postgres";


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



ALTER TABLE ONLY "public"."ics_tokens"
    ADD CONSTRAINT "ics_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ics_tokens"
    ADD CONSTRAINT "ics_tokens_token_key" UNIQUE ("token");



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



ALTER TABLE ONLY "public"."pillbox_uses"
    ADD CONSTRAINT "pillbox_preparations_pkey" PRIMARY KEY ("id");



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



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_ics_tokens" BEFORE UPDATE ON "public"."ics_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_invitations" BEFORE UPDATE ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_medicine_box_conditions" BEFORE UPDATE ON "public"."medicine_box_conditions" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_medicine_boxes" BEFORE UPDATE ON "public"."medicine_boxes" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_notifications" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_touch_updated_at_pillbox_preparations" BEFORE UPDATE ON "public"."pillbox_uses" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



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



ALTER TABLE ONLY "public"."ics_tokens"
    ADD CONSTRAINT "ics_tokens_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ics_tokens"
    ADD CONSTRAINT "ics_tokens_owner_uid_fkey" FOREIGN KEY ("owner_uid") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medicine_box_conditions"
    ADD CONSTRAINT "medicine_box_conditions_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "public"."medicine_boxes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medicine_boxes"
    ADD CONSTRAINT "medicine_boxes_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "public"."medicine_boxes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_sender_uid_fkey" FOREIGN KEY ("sender_uid") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_shared_calendar_id_fkey" FOREIGN KEY ("shared_calendar_id") REFERENCES "public"."shared_calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pillbox_uses"
    ADD CONSTRAINT "pillbox_uses_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pillbox_uses"
    ADD CONSTRAINT "pillbox_uses_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shared_calendar_settings"
    ADD CONSTRAINT "shared_calendar_settings_shared_calendar_id_fkey" FOREIGN KEY ("shared_calendar_id") REFERENCES "public"."shared_calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_tokens"
    ADD CONSTRAINT "shared_tokens_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_tokens"
    ADD CONSTRAINT "shared_tokens_owner_uid_fkey" FOREIGN KEY ("owner_uid") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Calendar owners can create invitations" ON "public"."invitations" FOR INSERT WITH CHECK ("public"."is_calendar_owner"("calendar_id"));



CREATE POLICY "Owners can manage their ics tokens" ON "public"."ics_tokens" TO "authenticated" USING (("owner_uid" = "auth"."uid"())) WITH CHECK (("owner_uid" = "auth"."uid"()));



CREATE POLICY "Owners can update shared calendars" ON "public"."shared_calendars" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."calendars" "c"
  WHERE (("c"."id" = "shared_calendars"."calendar_id") AND ("c"."owner_uid" = "auth"."uid"())))));



CREATE POLICY "Public access via ics token" ON "public"."calendars" FOR SELECT USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."ics_tokens" "it"
  WHERE (("it"."calendar_id" = "calendars"."id") AND ("it"."token" = "current_setting"('app.current_ics_token'::"text", true)) AND ("it"."deleted_at" IS NULL))))));



CREATE POLICY "Public access via ics token" ON "public"."ics_tokens" FOR SELECT USING ((("deleted_at" IS NULL) AND ("token" = "current_setting"('app.current_ics_token'::"text", true))));



CREATE POLICY "Public access via ics token" ON "public"."medicine_box_conditions" FOR SELECT USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM ("public"."medicine_boxes" "box"
     JOIN "public"."ics_tokens" "it" ON (("it"."calendar_id" = "box"."calendar_id")))
  WHERE (("box"."id" = "medicine_box_conditions"."box_id") AND ("it"."token" = "current_setting"('app.current_ics_token'::"text", true)) AND ("it"."deleted_at" IS NULL) AND ("box"."deleted_at" IS NULL))))));



CREATE POLICY "Public access via ics token" ON "public"."medicine_boxes" FOR SELECT USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."ics_tokens" "it"
  WHERE (("it"."calendar_id" = "medicine_boxes"."calendar_id") AND ("it"."token" = "current_setting"('app.current_ics_token'::"text", true)) AND ("it"."deleted_at" IS NULL))))));



CREATE POLICY "Public access via shared token" ON "public"."medicine_box_conditions" FOR SELECT USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM ("public"."medicine_boxes" "box"
     JOIN "public"."shared_tokens" "st" ON (("st"."calendar_id" = "box"."calendar_id")))
  WHERE (("box"."id" = "medicine_box_conditions"."box_id") AND ("st"."id" = ("current_setting"('app.current_token'::"text", true))::"uuid") AND ("st"."deleted_at" IS NULL) AND ("box"."deleted_at" IS NULL))))));



CREATE POLICY "Public access via shared token" ON "public"."medicine_boxes" FOR SELECT USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."shared_tokens" "st"
  WHERE (("st"."id" = ("current_setting"('app.current_token'::"text", true))::"uuid") AND ("st"."calendar_id" = "medicine_boxes"."calendar_id") AND ("st"."deleted_at" IS NULL))))));



CREATE POLICY "Public read access" ON "public"."medicaments_afmps" FOR SELECT USING (true);



CREATE POLICY "Users can delete boxes of accessible calendars" ON "public"."medicine_boxes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (("public"."calendars" "c"
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("c"."id" = "medicine_boxes"."calendar_id") AND (("c"."owner_uid" = "auth"."uid"()) OR (("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) AND ("i"."role" = ANY (ARRAY['write'::"text", 'admin'::"text"]))) OR (("sc"."receiver_uid" = "auth"."uid"()) AND ("sc"."access" = 'edit'::"text")))))));



CREATE POLICY "Users can delete conditions of accessible boxes" ON "public"."medicine_box_conditions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ((("public"."medicine_boxes" "mb"
     JOIN "public"."calendars" "c" ON (("c"."id" = "mb"."calendar_id")))
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("mb"."id" = "medicine_box_conditions"."box_id") AND (("c"."owner_uid" = "auth"."uid"()) OR (("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) AND ("i"."role" = ANY (ARRAY['write'::"text", 'admin'::"text"]))) OR (("sc"."receiver_uid" = "auth"."uid"()) AND ("sc"."access" = 'edit'::"text")))))));



CREATE POLICY "Users can delete invitations" ON "public"."invitations" FOR DELETE USING ((("invited_email" = "public"."get_auth_email"()) OR "public"."is_calendar_owner"("calendar_id")));



CREATE POLICY "Users can delete own calendars" ON "public"."calendars" FOR DELETE USING (("auth"."uid"() = "owner_uid"));



CREATE POLICY "Users can delete own or sent notifications" ON "public"."notifications" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "sender_uid")));



CREATE POLICY "Users can delete own shared tokens" ON "public"."shared_tokens" FOR DELETE USING (("owner_uid" = "auth"."uid"()));



CREATE POLICY "Users can delete pillbox uses of accessible calendars" ON "public"."pillbox_uses" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (("public"."calendars" "c"
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("c"."id" = "pillbox_uses"."calendar_id") AND (("c"."owner_uid" = "auth"."uid"()) OR (("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) AND ("i"."role" = ANY (ARRAY['write'::"text", 'admin'::"text"]))) OR (("sc"."receiver_uid" = "auth"."uid"()) AND ("sc"."access" = 'edit'::"text")))))));



CREATE POLICY "Users can delete shared calendars" ON "public"."shared_calendars" FOR DELETE USING ((("receiver_uid" = "auth"."uid"()) OR "public"."is_calendar_owner"("calendar_id")));



CREATE POLICY "Users can insert boxes to accessible calendars" ON "public"."medicine_boxes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."calendars" "c"
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("c"."id" = "medicine_boxes"."calendar_id") AND (("c"."owner_uid" = "auth"."uid"()) OR (("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) AND ("i"."role" = ANY (ARRAY['write'::"text", 'admin'::"text"]))) OR (("sc"."receiver_uid" = "auth"."uid"()) AND ("sc"."access" = 'edit'::"text")))))));



CREATE POLICY "Users can insert conditions" ON "public"."medicine_box_conditions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ((("public"."medicine_boxes" "mb"
     JOIN "public"."calendars" "c" ON (("c"."id" = "mb"."calendar_id")))
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("mb"."id" = "medicine_box_conditions"."box_id") AND (("c"."owner_uid" = "auth"."uid"()) OR (("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) AND ("i"."role" = ANY (ARRAY['write'::"text", 'admin'::"text"]))) OR (("sc"."receiver_uid" = "auth"."uid"()) AND ("sc"."access" = 'edit'::"text")))))));



CREATE POLICY "Users can insert own calendars" ON "public"."calendars" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_uid"));



CREATE POLICY "Users can insert own profile" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert pillbox uses to accessible calendars" ON "public"."pillbox_uses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."calendars" "c"
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("c"."id" = "pillbox_uses"."calendar_id") AND (("c"."owner_uid" = "auth"."uid"()) OR (("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) AND ("i"."role" = ANY (ARRAY['write'::"text", 'admin'::"text"]))) OR (("sc"."receiver_uid" = "auth"."uid"()) AND ("sc"."access" = 'edit'::"text")))))));



CREATE POLICY "Users can insert sent notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert settings for accessible calendars" ON "public"."calendar_settings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."calendars" "c"
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("c"."id" = "calendar_settings"."calendar_id") AND (("c"."owner_uid" = "auth"."uid"()) OR (("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) AND ("i"."role" = ANY (ARRAY['write'::"text", 'admin'::"text"]))) OR (("sc"."receiver_uid" = "auth"."uid"()) AND ("sc"."access" = 'edit'::"text")))))));



CREATE POLICY "Users can insert shared calendar settings" ON "public"."shared_calendar_settings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."shared_calendars" "sc"
  WHERE (("sc"."id" = "shared_calendar_settings"."shared_calendar_id") AND ("sc"."receiver_uid" = "auth"."uid"())))));



CREATE POLICY "Users can insert shared calendars" ON "public"."shared_calendars" FOR INSERT WITH CHECK ((("receiver_uid" = "auth"."uid"()) OR "public"."is_calendar_owner"("calendar_id") OR "public"."is_invited_to_calendar"("calendar_id")));



CREATE POLICY "Users can insert shared tokens" ON "public"."shared_tokens" FOR INSERT WITH CHECK ((("owner_uid" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."calendars" "c"
  WHERE (("c"."id" = "shared_tokens"."calendar_id") AND ("c"."owner_uid" = "auth"."uid"()))))));



CREATE POLICY "Users can manage own fcm tokens" ON "public"."fcm_tokens" USING (("auth"."uid"() = "uid"));



CREATE POLICY "Users can manage own ics tokens" ON "public"."ics_tokens" USING (("auth"."uid"() = "owner_uid")) WITH CHECK ((("auth"."uid"() = "owner_uid") AND "public"."is_calendar_owner"("calendar_id")));



CREATE POLICY "Users can update boxes of accessible calendars" ON "public"."medicine_boxes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (("public"."calendars" "c"
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("c"."id" = "medicine_boxes"."calendar_id") AND (("c"."owner_uid" = "auth"."uid"()) OR (("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) AND ("i"."role" = ANY (ARRAY['write'::"text", 'admin'::"text"]))) OR (("sc"."receiver_uid" = "auth"."uid"()) AND ("sc"."access" = 'edit'::"text")))))));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own or shared calendars" ON "public"."calendars" FOR UPDATE USING ((("owner_uid" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."invitations"
  WHERE (("invitations"."calendar_id" = "calendars"."id") AND ("invitations"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) AND ("invitations"."role" = ANY (ARRAY['write'::"text", 'admin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."shared_calendars"
  WHERE (("shared_calendars"."calendar_id" = "calendars"."id") AND ("shared_calendars"."receiver_uid" = "auth"."uid"()) AND ("shared_calendars"."access" = 'edit'::"text"))))));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own shared tokens" ON "public"."shared_tokens" FOR UPDATE USING (("owner_uid" = "auth"."uid"()));



CREATE POLICY "Users can update pillbox uses of accessible calendars" ON "public"."pillbox_uses" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (("public"."calendars" "c"
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("c"."id" = "pillbox_uses"."calendar_id") AND (("c"."owner_uid" = "auth"."uid"()) OR (("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) AND ("i"."role" = ANY (ARRAY['write'::"text", 'admin'::"text"]))) OR (("sc"."receiver_uid" = "auth"."uid"()) AND ("sc"."access" = 'edit'::"text")))))));



CREATE POLICY "Users can update settings of accessible calendars" ON "public"."calendar_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (("public"."calendars" "c"
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("c"."id" = "calendar_settings"."calendar_id") AND (("c"."owner_uid" = "auth"."uid"()) OR (("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) AND ("i"."role" = ANY (ARRAY['write'::"text", 'admin'::"text"]))) OR (("sc"."receiver_uid" = "auth"."uid"()) AND ("sc"."access" = 'edit'::"text")))))));



CREATE POLICY "Users can update shared calendar settings" ON "public"."shared_calendar_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."shared_calendars" "sc"
  WHERE (("sc"."id" = "shared_calendar_settings"."shared_calendar_id") AND ("sc"."receiver_uid" = "auth"."uid"())))));



CREATE POLICY "Users can update shared calendars" ON "public"."shared_calendars" FOR UPDATE USING (("receiver_uid" = "auth"."uid"()));



CREATE POLICY "Users can update/delete conditions of accessible boxes" ON "public"."medicine_box_conditions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ((("public"."medicine_boxes" "mb"
     JOIN "public"."calendars" "c" ON (("c"."id" = "mb"."calendar_id")))
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("mb"."id" = "medicine_box_conditions"."box_id") AND (("c"."owner_uid" = "auth"."uid"()) OR (("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) AND ("i"."role" = ANY (ARRAY['write'::"text", 'admin'::"text"]))) OR (("sc"."receiver_uid" = "auth"."uid"()) AND ("sc"."access" = 'edit'::"text")))))));



CREATE POLICY "Users can view boxes of accessible calendars" ON "public"."medicine_boxes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."calendars" "c"
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("c"."id" = "medicine_boxes"."calendar_id") AND (("c"."owner_uid" = "auth"."uid"()) OR ("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) OR ("sc"."receiver_uid" = "auth"."uid"()))))));



CREATE POLICY "Users can view conditions of accessible boxes" ON "public"."medicine_box_conditions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((("public"."medicine_boxes" "mb"
     JOIN "public"."calendars" "c" ON (("c"."id" = "mb"."calendar_id")))
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("mb"."id" = "medicine_box_conditions"."box_id") AND (("c"."owner_uid" = "auth"."uid"()) OR ("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) OR ("sc"."receiver_uid" = "auth"."uid"()))))));



CREATE POLICY "Users can view invitations sent or received" ON "public"."invitations" FOR SELECT USING ((("invited_email" = "public"."get_auth_email"()) OR "public"."is_calendar_owner"("calendar_id")));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own or shared calendars" ON "public"."calendars" FOR SELECT USING ((("owner_uid" = "auth"."uid"()) OR "public"."is_invited_to_calendar"("id") OR "public"."is_calendar_receiver"("id")));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own shared tokens" ON "public"."shared_tokens" FOR SELECT USING ((("owner_uid" = "auth"."uid"()) OR (("id")::"text" = "current_setting"('app.current_token'::"text", true))));



CREATE POLICY "Users can view pillbox uses of accessible calendars" ON "public"."pillbox_uses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."calendars" "c"
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("c"."id" = "pillbox_uses"."calendar_id") AND (("c"."owner_uid" = "auth"."uid"()) OR ("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) OR ("sc"."receiver_uid" = "auth"."uid"()))))));



CREATE POLICY "Users can view settings of accessible calendars" ON "public"."calendar_settings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."calendars" "c"
     LEFT JOIN "public"."invitations" "i" ON (("i"."calendar_id" = "c"."id")))
     LEFT JOIN "public"."shared_calendars" "sc" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("c"."id" = "calendar_settings"."calendar_id") AND (("c"."owner_uid" = "auth"."uid"()) OR ("i"."invited_email" = ( SELECT ("auth"."jwt"() ->> 'email'::"text"))) OR ("sc"."receiver_uid" = "auth"."uid"()))))));



CREATE POLICY "Users can view shared calendar participants" ON "public"."users" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM ("public"."shared_calendars" "sc"
     JOIN "public"."calendars" "c" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("c"."owner_uid" = "users"."id") AND ("sc"."receiver_uid" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."shared_calendars" "sc"
     JOIN "public"."calendars" "c" ON (("sc"."calendar_id" = "c"."id")))
  WHERE (("sc"."receiver_uid" = "users"."id") AND ("c"."owner_uid" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."calendars" "c"
  WHERE (("c"."owner_uid" = "users"."id") AND "public"."is_invited_to_calendar"("c"."id")))) OR (EXISTS ( SELECT 1
   FROM "public"."notifications" "n"
  WHERE (("n"."sender_uid" = "users"."id") AND ("n"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view shared calendar settings" ON "public"."shared_calendar_settings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."shared_calendars" "sc"
  WHERE (("sc"."id" = "shared_calendar_settings"."shared_calendar_id") AND ("sc"."receiver_uid" = "auth"."uid"())))));



CREATE POLICY "Users can view shared calendars" ON "public"."shared_calendars" FOR SELECT USING ((("receiver_uid" = "auth"."uid"()) OR "public"."is_calendar_owner"("calendar_id") OR "public"."is_calendar_receiver"("calendar_id")));



ALTER TABLE "public"."calendar_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendars" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fcm_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ics_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medicaments_afmps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medicine_box_conditions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medicine_boxes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pillbox_uses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shared_calendar_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shared_calendars" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shared_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


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



GRANT ALL ON FUNCTION "public"."get_auth_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_fcm_tokens_for_user"("target_uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_fcm_tokens_for_user"("target_uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_fcm_tokens_for_user"("target_uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_public_user_info"("target_uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_user_info"("target_uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_user_info"("target_uid" "uuid") TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_by_email"("lookup_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_by_email"("lookup_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_by_email"("lookup_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_calendar_owner"("cal_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_calendar_owner"("cal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_calendar_owner"("cal_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_calendar_receiver"("cal_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_calendar_receiver"("cal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_calendar_receiver"("cal_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_invited_to_calendar"("cal_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_invited_to_calendar"("cal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_invited_to_calendar"("cal_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_invited_user"("target_uid" "uuid", "invited_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_invited_user"("target_uid" "uuid", "invited_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_invited_user"("target_uid" "uuid", "invited_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_invited_by_email"("invite_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_invited_by_email"("invite_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_invited_by_email"("invite_email" "text") TO "service_role";



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



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ics_tokens" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ics_tokens" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."ics_tokens" TO "service_role";



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



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."pillbox_uses" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."pillbox_uses" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."pillbox_uses" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_calendar_settings" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_calendar_settings" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_calendar_settings" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_calendars" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_calendars" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_calendars" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_tokens" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_tokens" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shared_tokens" TO "service_role";



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







