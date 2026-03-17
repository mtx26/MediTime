--
-- PostgreSQL database dump
--


-- Dumped from database version 15.8
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-1.pgdg24.04+1)

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

DROP POLICY IF EXISTS "Users can view shared calendars" ON public.shared_calendars;
DROP POLICY IF EXISTS "Users can view shared calendar settings" ON public.shared_calendar_settings;
DROP POLICY IF EXISTS "Users can view shared calendar participants" ON public.users;
DROP POLICY IF EXISTS "Users can view settings of accessible calendars" ON public.calendar_settings;
DROP POLICY IF EXISTS "Users can view pillbox uses of accessible calendars" ON public.pillbox_uses;
DROP POLICY IF EXISTS "Users can view own shared tokens" ON public.shared_tokens;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own or shared calendars" ON public.calendars;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view invitations sent or received" ON public.invitations;
DROP POLICY IF EXISTS "Users can view conditions of accessible boxes" ON public.medicine_box_conditions;
DROP POLICY IF EXISTS "Users can view boxes of accessible calendars" ON public.medicine_boxes;
DROP POLICY IF EXISTS "Users can update/delete conditions of accessible boxes" ON public.medicine_box_conditions;
DROP POLICY IF EXISTS "Users can update shared calendars" ON public.shared_calendars;
DROP POLICY IF EXISTS "Users can update shared calendar settings" ON public.shared_calendar_settings;
DROP POLICY IF EXISTS "Users can update settings of accessible calendars" ON public.calendar_settings;
DROP POLICY IF EXISTS "Users can update pillbox uses of accessible calendars" ON public.pillbox_uses;
DROP POLICY IF EXISTS "Users can update own shared tokens" ON public.shared_tokens;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own or shared calendars" ON public.calendars;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update boxes of accessible calendars" ON public.medicine_boxes;
DROP POLICY IF EXISTS "Users can manage own ics tokens" ON public.ics_tokens;
DROP POLICY IF EXISTS "Users can manage own fcm tokens" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can insert shared tokens" ON public.shared_tokens;
DROP POLICY IF EXISTS "Users can insert shared calendars" ON public.shared_calendars;
DROP POLICY IF EXISTS "Users can insert shared calendar settings" ON public.shared_calendar_settings;
DROP POLICY IF EXISTS "Users can insert settings for accessible calendars" ON public.calendar_settings;
DROP POLICY IF EXISTS "Users can insert sent notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert pillbox uses to accessible calendars" ON public.pillbox_uses;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own calendars" ON public.calendars;
DROP POLICY IF EXISTS "Users can insert conditions" ON public.medicine_box_conditions;
DROP POLICY IF EXISTS "Users can insert boxes to accessible calendars" ON public.medicine_boxes;
DROP POLICY IF EXISTS "Users can delete shared calendars" ON public.shared_calendars;
DROP POLICY IF EXISTS "Users can delete pillbox uses of accessible calendars" ON public.pillbox_uses;
DROP POLICY IF EXISTS "Users can delete own shared tokens" ON public.shared_tokens;
DROP POLICY IF EXISTS "Users can delete own or sent notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own calendars" ON public.calendars;
DROP POLICY IF EXISTS "Users can delete invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can delete conditions of accessible boxes" ON public.medicine_box_conditions;
DROP POLICY IF EXISTS "Users can delete boxes of accessible calendars" ON public.medicine_boxes;
DROP POLICY IF EXISTS "Public read access" ON public.medicaments_afmps;
DROP POLICY IF EXISTS "Public access via shared token" ON public.medicine_boxes;
DROP POLICY IF EXISTS "Public access via shared token" ON public.medicine_box_conditions;
DROP POLICY IF EXISTS "Public access via ics token" ON public.medicine_boxes;
DROP POLICY IF EXISTS "Public access via ics token" ON public.medicine_box_conditions;
DROP POLICY IF EXISTS "Public access via ics token" ON public.ics_tokens;
DROP POLICY IF EXISTS "Public access via ics token" ON public.calendars;
DROP POLICY IF EXISTS "Owners can manage their ics tokens" ON public.ics_tokens;
DROP POLICY IF EXISTS "Calendar owners can create invitations" ON public.invitations;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shared_tokens DROP CONSTRAINT IF EXISTS shared_tokens_owner_uid_fkey;
ALTER TABLE IF EXISTS ONLY public.shared_tokens DROP CONSTRAINT IF EXISTS shared_tokens_calendar_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shared_calendar_settings DROP CONSTRAINT IF EXISTS shared_calendar_settings_shared_calendar_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pillbox_uses DROP CONSTRAINT IF EXISTS pillbox_uses_prepared_by_fkey;
ALTER TABLE IF EXISTS ONLY public.pillbox_uses DROP CONSTRAINT IF EXISTS pillbox_uses_calendar_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_shared_calendar_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_sender_uid_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_medication_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_calendar_id_fkey;
ALTER TABLE IF EXISTS ONLY public.medicine_boxes DROP CONSTRAINT IF EXISTS medicine_boxes_calendar_id_fkey;
ALTER TABLE IF EXISTS ONLY public.medicine_box_conditions DROP CONSTRAINT IF EXISTS medicine_box_conditions_box_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invitations DROP CONSTRAINT IF EXISTS invitations_calendar_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ics_tokens DROP CONSTRAINT IF EXISTS ics_tokens_owner_uid_fkey;
ALTER TABLE IF EXISTS ONLY public.ics_tokens DROP CONSTRAINT IF EXISTS ics_tokens_calendar_id_fkey;
ALTER TABLE IF EXISTS ONLY public.medicine_boxes DROP CONSTRAINT IF EXISTS fk_medicine_boxes_code_fmd;
ALTER TABLE IF EXISTS ONLY public.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_uid_fkey;
ALTER TABLE IF EXISTS ONLY public.calendars DROP CONSTRAINT IF EXISTS calendars_owner_uid_fkey;
ALTER TABLE IF EXISTS ONLY public.shared_calendars DROP CONSTRAINT IF EXISTS calendar_shared_users_receiver_uid_fkey;
ALTER TABLE IF EXISTS ONLY public.shared_calendars DROP CONSTRAINT IF EXISTS calendar_shared_users_calendar_id_fkey;
ALTER TABLE IF EXISTS ONLY public.calendar_settings DROP CONSTRAINT IF EXISTS calendar_settings_calendar_id_fkey;
DROP TRIGGER IF EXISTS trg_touch_updated_at_users ON public.users;
DROP TRIGGER IF EXISTS trg_touch_updated_at_shared_tokens ON public.shared_tokens;
DROP TRIGGER IF EXISTS trg_touch_updated_at_shared_calendars ON public.shared_calendars;
DROP TRIGGER IF EXISTS trg_touch_updated_at_shared_calendar_settings ON public.shared_calendar_settings;
DROP TRIGGER IF EXISTS trg_touch_updated_at_pillbox_preparations ON public.pillbox_uses;
DROP TRIGGER IF EXISTS trg_touch_updated_at_notifications ON public.notifications;
DROP TRIGGER IF EXISTS trg_touch_updated_at_medicine_boxes ON public.medicine_boxes;
DROP TRIGGER IF EXISTS trg_touch_updated_at_medicine_box_conditions ON public.medicine_box_conditions;
DROP TRIGGER IF EXISTS trg_touch_updated_at_invitations ON public.invitations;
DROP TRIGGER IF EXISTS trg_touch_updated_at_ics_tokens ON public.ics_tokens;
DROP TRIGGER IF EXISTS trg_touch_updated_at_fcm_tokens ON public.fcm_tokens;
DROP TRIGGER IF EXISTS trg_touch_updated_at_calendars ON public.calendars;
DROP TRIGGER IF EXISTS trg_touch_updated_at_calendar_settings ON public.calendar_settings;
DROP TRIGGER IF EXISTS trg_touch_updated_at_bis_medicaments_afmps ON public.medicaments_afmps;
DROP TRIGGER IF EXISTS trg_ensure_shared_calendar_settings ON public.shared_calendars;
DROP TRIGGER IF EXISTS trg_ensure_calendar_settings ON public.calendars;
DROP INDEX IF EXISTS public.invitations_token_idx;
DROP INDEX IF EXISTS public.invitations_calendar_id_idx;
DROP INDEX IF EXISTS public.idx_medicaments_afmps_name_pattern;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.shared_tokens DROP CONSTRAINT IF EXISTS shared_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.shared_calendars DROP CONSTRAINT IF EXISTS shared_calendars_token_key;
ALTER TABLE IF EXISTS ONLY public.shared_calendar_settings DROP CONSTRAINT IF EXISTS shared_calendar_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.pillbox_uses DROP CONSTRAINT IF EXISTS pillbox_preparations_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.medicine_boxes DROP CONSTRAINT IF EXISTS medicine_boxes_pkey;
ALTER TABLE IF EXISTS ONLY public.medicine_box_conditions DROP CONSTRAINT IF EXISTS medicine_box_conditions_pkey;
ALTER TABLE IF EXISTS ONLY public.medicaments_afmps DROP CONSTRAINT IF EXISTS medicaments_afmps_code_fmd_key;
ALTER TABLE IF EXISTS ONLY public.invitations DROP CONSTRAINT IF EXISTS invitations_token_key;
ALTER TABLE IF EXISTS ONLY public.invitations DROP CONSTRAINT IF EXISTS invitations_pkey;
ALTER TABLE IF EXISTS ONLY public.ics_tokens DROP CONSTRAINT IF EXISTS ics_tokens_token_key;
ALTER TABLE IF EXISTS ONLY public.ics_tokens DROP CONSTRAINT IF EXISTS ics_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_uid_token_unique;
ALTER TABLE IF EXISTS ONLY public.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_token_pkey;
ALTER TABLE IF EXISTS ONLY public.calendars DROP CONSTRAINT IF EXISTS calendars_pkey;
ALTER TABLE IF EXISTS ONLY public.shared_calendars DROP CONSTRAINT IF EXISTS calendar_shared_users_pkey;
ALTER TABLE IF EXISTS ONLY public.calendar_settings DROP CONSTRAINT IF EXISTS calendar_settings_pkey;
DROP TABLE IF EXISTS public.shared_tokens;
DROP TABLE IF EXISTS public.shared_calendars;
DROP TABLE IF EXISTS public.shared_calendar_settings;
DROP TABLE IF EXISTS public.pillbox_uses;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.medicine_boxes;
DROP TABLE IF EXISTS public.medicine_box_conditions;
DROP TABLE IF EXISTS public.medicaments_afmps;
DROP TABLE IF EXISTS public.invitations;
DROP TABLE IF EXISTS public.ics_tokens;
DROP TABLE IF EXISTS public.fcm_tokens;
DROP TABLE IF EXISTS public.calendars;
DROP TABLE IF EXISTS public.calendar_settings;
DROP FUNCTION IF EXISTS public.touch_updated_at();
DROP FUNCTION IF EXISTS public.is_user_invited_by_email(invite_email text);
DROP FUNCTION IF EXISTS public.is_invited_user(target_uid uuid, invited_email text);
DROP FUNCTION IF EXISTS public.is_invited_to_calendar(cal_id uuid);
DROP FUNCTION IF EXISTS public.is_calendar_receiver(cal_id uuid);
DROP FUNCTION IF EXISTS public.is_calendar_owner(cal_id uuid);
DROP FUNCTION IF EXISTS public.get_user_by_email(lookup_email text);
DROP TABLE IF EXISTS public.users;
DROP FUNCTION IF EXISTS public.get_public_user_info(target_uid uuid);
DROP FUNCTION IF EXISTS public.get_fcm_tokens_for_user(target_uid uuid);
DROP FUNCTION IF EXISTS public.get_current_user_email();
DROP FUNCTION IF EXISTS public.get_auth_email();
DROP FUNCTION IF EXISTS public.ensure_shared_calendar_settings();
DROP FUNCTION IF EXISTS public.ensure_calendar_settings();
DROP SCHEMA IF EXISTS public;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--


--
-- Name: ensure_calendar_settings(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_calendar_settings() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.calendar_settings (calendar_id)  -- valeurs par défaut déjà en DEFAULT
  VALUES (NEW.id)
  ON CONFLICT (calendar_id) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: ensure_shared_calendar_settings(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_shared_calendar_settings() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.shared_calendar_settings (shared_calendar_id)
  VALUES (NEW.id)
  ON CONFLICT (shared_calendar_id) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: get_auth_email(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_auth_email() RETURNS text
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT email FROM users WHERE id = auth.uid();
$$;


--
-- Name: get_current_user_email(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_user_email() RETURNS text
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT email FROM public.users WHERE id = auth.uid();
$$;


--
-- Name: get_fcm_tokens_for_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_fcm_tokens_for_user(target_uid uuid) RETURNS TABLE(token text)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT token FROM public.fcm_tokens WHERE uid = target_uid;
$$;


--
-- Name: get_public_user_info(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_public_user_info(target_uid uuid) RETURNS TABLE(display_name text, photo_url text)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT display_name, photo_url FROM public.users WHERE id = target_uid;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    display_name text,
    photo_url text,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    email_enabled boolean DEFAULT true,
    push_enabled boolean DEFAULT true,
    sms_enabled boolean DEFAULT false NOT NULL,
    phone text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: get_user_by_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_by_email(lookup_email text) RETURNS SETOF public.users
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT * FROM public.users WHERE email = lookup_email;
$$;


--
-- Name: is_calendar_owner(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_calendar_owner(cal_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM calendars
    WHERE id = cal_id
    AND owner_uid = auth.uid()
  );
$$;


--
-- Name: is_calendar_receiver(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_calendar_receiver(cal_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM shared_calendars
    WHERE calendar_id = cal_id
    AND receiver_uid = auth.uid()
  );
$$;


--
-- Name: is_invited_to_calendar(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_invited_to_calendar(cal_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM invitations
    WHERE calendar_id = cal_id
    AND invited_email = (SELECT email FROM users WHERE id = auth.uid())
  );
$$;


--
-- Name: is_invited_user(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_invited_user(target_uid uuid, invited_email text) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM users u
        WHERE u.id = target_uid
        AND LOWER(u.email) = LOWER(invited_email)
    );
$$;


--
-- Name: is_user_invited_by_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_user_invited_by_email(invite_email text) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND email = invite_email
  );
$$;


--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


--
-- Name: calendar_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_settings (
    calendar_id uuid NOT NULL,
    stock_decrement_method text DEFAULT 'weekly_pillbox'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    notifications_enabled boolean DEFAULT true NOT NULL,
    CONSTRAINT calendar_settings_stock_decrement_method_chk CHECK ((stock_decrement_method = ANY (ARRAY['weekly_pillbox'::text, 'daily_midnight'::text])))
);


--
-- Name: calendars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_uid uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


--
-- Name: fcm_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fcm_tokens (
    uid uuid NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    device_name text
);


--
-- Name: ics_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ics_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid NOT NULL,
    owner_uid uuid NOT NULL,
    token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone,
    last_user_agent text,
    deleted_at timestamp with time zone
);


--
-- Name: invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid NOT NULL,
    invited_email text,
    role text DEFAULT 'write'::text NOT NULL,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    deleted_at timestamp with time zone,
    CONSTRAINT invitations_role_check CHECK ((role = ANY (ARRAY['read'::text, 'write'::text, 'admin'::text])))
);


--
-- Name: medicaments_afmps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicaments_afmps (
    name text,
    dose text,
    forme_pharmaceutique text,
    voie_administration text,
    conditionnement text,
    substance_active text,
    code_atc text,
    code_cnk text,
    code_fmd text,
    url_notice_fr text,
    url_notice_nl text,
    url_notice_de text,
    url_rcp text,
    url_summary_rmp_fr text,
    url_summary_rmp_nl text,
    url_summary_rmp_de text,
    date_derniere_publication_rcp_notice date,
    date_derniere_approbation_rcp_notice date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: medicine_box_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicine_box_conditions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    box_id uuid NOT NULL,
    time_of_day text DEFAULT 'morning'::text NOT NULL,
    interval_days integer DEFAULT 1 NOT NULL,
    start_date date,
    tablet_count double precision NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    max_date timestamp with time zone,
    CONSTRAINT medicine_box_conditions_time_of_day_check CHECK ((time_of_day = ANY (ARRAY['morning'::text, 'noon'::text, 'evening'::text])))
);


--
-- Name: medicine_boxes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicine_boxes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid NOT NULL,
    name text NOT NULL,
    stock_quantity double precision DEFAULT '0'::double precision NOT NULL,
    stock_alert_threshold integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    box_capacity integer DEFAULT 0 NOT NULL,
    dose integer,
    deleted_at timestamp with time zone,
    code_fmd text
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text,
    content jsonb,
    read boolean DEFAULT false NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    sender_uid uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    shared_calendar_id uuid,
    calendar_id uuid,
    medication_id uuid
);


--
-- Name: COLUMN notifications.sender_uid; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.sender_uid IS 'ID de l''expéditeur (nullable pour les notifications système ou si l''expéditeur est supprimé)';


--
-- Name: pillbox_uses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pillbox_uses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid NOT NULL,
    prepared_at timestamp with time zone DEFAULT now() NOT NULL,
    prepared_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    restored_at timestamp with time zone
);


--
-- Name: shared_calendar_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shared_calendar_settings (
    shared_calendar_id uuid NOT NULL,
    notifications_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: shared_calendars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shared_calendars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid NOT NULL,
    receiver_uid uuid NOT NULL,
    access text DEFAULT 'edit'::text NOT NULL,
    accepted_at timestamp with time zone,
    token uuid DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


--
-- Name: shared_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shared_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid NOT NULL,
    expires_at timestamp with time zone,
    owner_uid uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


--
-- Name: calendar_settings calendar_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_settings
    ADD CONSTRAINT calendar_settings_pkey PRIMARY KEY (calendar_id);


--
-- Name: shared_calendars calendar_shared_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_calendars
    ADD CONSTRAINT calendar_shared_users_pkey PRIMARY KEY (id);


--
-- Name: calendars calendars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendars
    ADD CONSTRAINT calendars_pkey PRIMARY KEY (id);


--
-- Name: fcm_tokens fcm_tokens_token_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fcm_tokens
    ADD CONSTRAINT fcm_tokens_token_pkey PRIMARY KEY (token);


--
-- Name: fcm_tokens fcm_tokens_uid_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fcm_tokens
    ADD CONSTRAINT fcm_tokens_uid_token_unique UNIQUE (uid, token);


--
-- Name: ics_tokens ics_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ics_tokens
    ADD CONSTRAINT ics_tokens_pkey PRIMARY KEY (id);


--
-- Name: ics_tokens ics_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ics_tokens
    ADD CONSTRAINT ics_tokens_token_key UNIQUE (token);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_token_key UNIQUE (token);


--
-- Name: medicaments_afmps medicaments_afmps_code_fmd_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicaments_afmps
    ADD CONSTRAINT medicaments_afmps_code_fmd_key UNIQUE (code_fmd);


--
-- Name: medicine_box_conditions medicine_box_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicine_box_conditions
    ADD CONSTRAINT medicine_box_conditions_pkey PRIMARY KEY (id);


--
-- Name: medicine_boxes medicine_boxes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicine_boxes
    ADD CONSTRAINT medicine_boxes_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pillbox_uses pillbox_preparations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pillbox_uses
    ADD CONSTRAINT pillbox_preparations_pkey PRIMARY KEY (id);


--
-- Name: shared_calendar_settings shared_calendar_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_calendar_settings
    ADD CONSTRAINT shared_calendar_settings_pkey PRIMARY KEY (shared_calendar_id);


--
-- Name: shared_calendars shared_calendars_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_calendars
    ADD CONSTRAINT shared_calendars_token_key UNIQUE (token);


--
-- Name: shared_tokens shared_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_tokens
    ADD CONSTRAINT shared_tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_medicaments_afmps_name_pattern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medicaments_afmps_name_pattern ON public.medicaments_afmps USING btree (name text_pattern_ops);


--
-- Name: invitations_calendar_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitations_calendar_id_idx ON public.invitations USING btree (calendar_id);


--
-- Name: invitations_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invitations_token_idx ON public.invitations USING btree (token);


--
-- Name: calendars trg_ensure_calendar_settings; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ensure_calendar_settings AFTER INSERT ON public.calendars FOR EACH ROW EXECUTE FUNCTION public.ensure_calendar_settings();


--
-- Name: shared_calendars trg_ensure_shared_calendar_settings; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ensure_shared_calendar_settings AFTER INSERT ON public.shared_calendars FOR EACH ROW EXECUTE FUNCTION public.ensure_shared_calendar_settings();


--
-- Name: medicaments_afmps trg_touch_updated_at_bis_medicaments_afmps; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_bis_medicaments_afmps BEFORE UPDATE ON public.medicaments_afmps FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: calendar_settings trg_touch_updated_at_calendar_settings; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_calendar_settings BEFORE UPDATE ON public.calendar_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: calendars trg_touch_updated_at_calendars; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_calendars BEFORE UPDATE ON public.calendars FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: fcm_tokens trg_touch_updated_at_fcm_tokens; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_fcm_tokens BEFORE UPDATE ON public.fcm_tokens FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: ics_tokens trg_touch_updated_at_ics_tokens; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_ics_tokens BEFORE UPDATE ON public.ics_tokens FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: invitations trg_touch_updated_at_invitations; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_invitations BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: medicine_box_conditions trg_touch_updated_at_medicine_box_conditions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_medicine_box_conditions BEFORE UPDATE ON public.medicine_box_conditions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: medicine_boxes trg_touch_updated_at_medicine_boxes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_medicine_boxes BEFORE UPDATE ON public.medicine_boxes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: notifications trg_touch_updated_at_notifications; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_notifications BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: pillbox_uses trg_touch_updated_at_pillbox_preparations; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_pillbox_preparations BEFORE UPDATE ON public.pillbox_uses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: shared_calendar_settings trg_touch_updated_at_shared_calendar_settings; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_shared_calendar_settings BEFORE UPDATE ON public.shared_calendar_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: shared_calendars trg_touch_updated_at_shared_calendars; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_shared_calendars BEFORE UPDATE ON public.shared_calendars FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: shared_tokens trg_touch_updated_at_shared_tokens; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_shared_tokens BEFORE UPDATE ON public.shared_tokens FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: users trg_touch_updated_at_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: calendar_settings calendar_settings_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_settings
    ADD CONSTRAINT calendar_settings_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.calendars(id) ON DELETE CASCADE;


--
-- Name: shared_calendars calendar_shared_users_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_calendars
    ADD CONSTRAINT calendar_shared_users_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.calendars(id) ON DELETE CASCADE;


--
-- Name: shared_calendars calendar_shared_users_receiver_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_calendars
    ADD CONSTRAINT calendar_shared_users_receiver_uid_fkey FOREIGN KEY (receiver_uid) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: calendars calendars_owner_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendars
    ADD CONSTRAINT calendars_owner_uid_fkey FOREIGN KEY (owner_uid) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: fcm_tokens fcm_tokens_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fcm_tokens
    ADD CONSTRAINT fcm_tokens_uid_fkey FOREIGN KEY (uid) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: medicine_boxes fk_medicine_boxes_code_fmd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicine_boxes
    ADD CONSTRAINT fk_medicine_boxes_code_fmd FOREIGN KEY (code_fmd) REFERENCES public.medicaments_afmps(code_fmd) ON DELETE SET NULL;


--
-- Name: ics_tokens ics_tokens_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ics_tokens
    ADD CONSTRAINT ics_tokens_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.calendars(id) ON DELETE CASCADE;


--
-- Name: ics_tokens ics_tokens_owner_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ics_tokens
    ADD CONSTRAINT ics_tokens_owner_uid_fkey FOREIGN KEY (owner_uid) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invitations invitations_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.calendars(id) ON DELETE CASCADE;


--
-- Name: medicine_box_conditions medicine_box_conditions_box_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicine_box_conditions
    ADD CONSTRAINT medicine_box_conditions_box_id_fkey FOREIGN KEY (box_id) REFERENCES public.medicine_boxes(id) ON DELETE CASCADE;


--
-- Name: medicine_boxes medicine_boxes_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicine_boxes
    ADD CONSTRAINT medicine_boxes_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.calendars(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.calendars(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medicine_boxes(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_sender_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_uid_fkey FOREIGN KEY (sender_uid) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_shared_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_shared_calendar_id_fkey FOREIGN KEY (shared_calendar_id) REFERENCES public.shared_calendars(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pillbox_uses pillbox_uses_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pillbox_uses
    ADD CONSTRAINT pillbox_uses_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.calendars(id) ON DELETE CASCADE;


--
-- Name: pillbox_uses pillbox_uses_prepared_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pillbox_uses
    ADD CONSTRAINT pillbox_uses_prepared_by_fkey FOREIGN KEY (prepared_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: shared_calendar_settings shared_calendar_settings_shared_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_calendar_settings
    ADD CONSTRAINT shared_calendar_settings_shared_calendar_id_fkey FOREIGN KEY (shared_calendar_id) REFERENCES public.shared_calendars(id) ON DELETE CASCADE;


--
-- Name: shared_tokens shared_tokens_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_tokens
    ADD CONSTRAINT shared_tokens_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.calendars(id) ON DELETE CASCADE;


--
-- Name: shared_tokens shared_tokens_owner_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_tokens
    ADD CONSTRAINT shared_tokens_owner_uid_fkey FOREIGN KEY (owner_uid) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: invitations Calendar owners can create invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Calendar owners can create invitations" ON public.invitations FOR INSERT WITH CHECK (public.is_calendar_owner(calendar_id));


--
-- Name: ics_tokens Owners can manage their ics tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can manage their ics tokens" ON public.ics_tokens TO authenticated USING ((owner_uid = auth.uid())) WITH CHECK ((owner_uid = auth.uid()));


--
-- Name: calendars Public access via ics token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public access via ics token" ON public.calendars FOR SELECT USING (((deleted_at IS NULL) AND (EXISTS ( SELECT 1
   FROM public.ics_tokens it
  WHERE ((it.calendar_id = calendars.id) AND (it.token = current_setting('app.current_ics_token'::text, true)) AND (it.deleted_at IS NULL))))));


--
-- Name: ics_tokens Public access via ics token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public access via ics token" ON public.ics_tokens FOR SELECT USING (((deleted_at IS NULL) AND (token = current_setting('app.current_ics_token'::text, true))));


--
-- Name: medicine_box_conditions Public access via ics token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public access via ics token" ON public.medicine_box_conditions FOR SELECT USING (((deleted_at IS NULL) AND (EXISTS ( SELECT 1
   FROM (public.medicine_boxes box
     JOIN public.ics_tokens it ON ((it.calendar_id = box.calendar_id)))
  WHERE ((box.id = medicine_box_conditions.box_id) AND (it.token = current_setting('app.current_ics_token'::text, true)) AND (it.deleted_at IS NULL) AND (box.deleted_at IS NULL))))));


--
-- Name: medicine_boxes Public access via ics token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public access via ics token" ON public.medicine_boxes FOR SELECT USING (((deleted_at IS NULL) AND (EXISTS ( SELECT 1
   FROM public.ics_tokens it
  WHERE ((it.calendar_id = medicine_boxes.calendar_id) AND (it.token = current_setting('app.current_ics_token'::text, true)) AND (it.deleted_at IS NULL))))));


--
-- Name: medicine_box_conditions Public access via shared token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public access via shared token" ON public.medicine_box_conditions FOR SELECT USING (((deleted_at IS NULL) AND (EXISTS ( SELECT 1
   FROM (public.medicine_boxes box
     JOIN public.shared_tokens st ON ((st.calendar_id = box.calendar_id)))
  WHERE ((box.id = medicine_box_conditions.box_id) AND (st.id = (current_setting('app.current_token'::text, true))::uuid) AND (st.deleted_at IS NULL) AND (box.deleted_at IS NULL))))));


--
-- Name: medicine_boxes Public access via shared token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public access via shared token" ON public.medicine_boxes FOR SELECT USING (((deleted_at IS NULL) AND (EXISTS ( SELECT 1
   FROM public.shared_tokens st
  WHERE ((st.id = (current_setting('app.current_token'::text, true))::uuid) AND (st.calendar_id = medicine_boxes.calendar_id) AND (st.deleted_at IS NULL))))));


--
-- Name: medicaments_afmps Public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access" ON public.medicaments_afmps FOR SELECT USING (true);


--
-- Name: medicine_boxes Users can delete boxes of accessible calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete boxes of accessible calendars" ON public.medicine_boxes FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ((public.calendars c
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((c.id = medicine_boxes.calendar_id) AND ((c.owner_uid = auth.uid()) OR ((i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) AND (i.role = ANY (ARRAY['write'::text, 'admin'::text]))) OR ((sc.receiver_uid = auth.uid()) AND (sc.access = 'edit'::text)))))));


--
-- Name: medicine_box_conditions Users can delete conditions of accessible boxes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete conditions of accessible boxes" ON public.medicine_box_conditions FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (((public.medicine_boxes mb
     JOIN public.calendars c ON ((c.id = mb.calendar_id)))
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((mb.id = medicine_box_conditions.box_id) AND ((c.owner_uid = auth.uid()) OR ((i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) AND (i.role = ANY (ARRAY['write'::text, 'admin'::text]))) OR ((sc.receiver_uid = auth.uid()) AND (sc.access = 'edit'::text)))))));


--
-- Name: invitations Users can delete invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete invitations" ON public.invitations FOR DELETE USING (((invited_email = public.get_auth_email()) OR public.is_calendar_owner(calendar_id)));


--
-- Name: calendars Users can delete own calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own calendars" ON public.calendars FOR DELETE USING ((auth.uid() = owner_uid));


--
-- Name: notifications Users can delete own or sent notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own or sent notifications" ON public.notifications FOR DELETE USING (((auth.uid() = user_id) OR (auth.uid() = sender_uid)));


--
-- Name: shared_tokens Users can delete own shared tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own shared tokens" ON public.shared_tokens FOR DELETE USING ((owner_uid = auth.uid()));


--
-- Name: pillbox_uses Users can delete pillbox uses of accessible calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete pillbox uses of accessible calendars" ON public.pillbox_uses FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ((public.calendars c
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((c.id = pillbox_uses.calendar_id) AND ((c.owner_uid = auth.uid()) OR ((i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) AND (i.role = ANY (ARRAY['write'::text, 'admin'::text]))) OR ((sc.receiver_uid = auth.uid()) AND (sc.access = 'edit'::text)))))));


--
-- Name: shared_calendars Users can delete shared calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete shared calendars" ON public.shared_calendars FOR DELETE USING (((receiver_uid = auth.uid()) OR public.is_calendar_owner(calendar_id)));


--
-- Name: medicine_boxes Users can insert boxes to accessible calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert boxes to accessible calendars" ON public.medicine_boxes FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ((public.calendars c
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((c.id = medicine_boxes.calendar_id) AND ((c.owner_uid = auth.uid()) OR ((i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) AND (i.role = ANY (ARRAY['write'::text, 'admin'::text]))) OR ((sc.receiver_uid = auth.uid()) AND (sc.access = 'edit'::text)))))));


--
-- Name: medicine_box_conditions Users can insert conditions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert conditions" ON public.medicine_box_conditions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (((public.medicine_boxes mb
     JOIN public.calendars c ON ((c.id = mb.calendar_id)))
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((mb.id = medicine_box_conditions.box_id) AND ((c.owner_uid = auth.uid()) OR ((i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) AND (i.role = ANY (ARRAY['write'::text, 'admin'::text]))) OR ((sc.receiver_uid = auth.uid()) AND (sc.access = 'edit'::text)))))));


--
-- Name: calendars Users can insert own calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own calendars" ON public.calendars FOR INSERT WITH CHECK ((auth.uid() = owner_uid));


--
-- Name: users Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: pillbox_uses Users can insert pillbox uses to accessible calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert pillbox uses to accessible calendars" ON public.pillbox_uses FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ((public.calendars c
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((c.id = pillbox_uses.calendar_id) AND ((c.owner_uid = auth.uid()) OR ((i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) AND (i.role = ANY (ARRAY['write'::text, 'admin'::text]))) OR ((sc.receiver_uid = auth.uid()) AND (sc.access = 'edit'::text)))))));


--
-- Name: notifications Users can insert sent notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert sent notifications" ON public.notifications FOR INSERT WITH CHECK (true);


--
-- Name: calendar_settings Users can insert settings for accessible calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert settings for accessible calendars" ON public.calendar_settings FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ((public.calendars c
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((c.id = calendar_settings.calendar_id) AND ((c.owner_uid = auth.uid()) OR ((i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) AND (i.role = ANY (ARRAY['write'::text, 'admin'::text]))) OR ((sc.receiver_uid = auth.uid()) AND (sc.access = 'edit'::text)))))));


--
-- Name: shared_calendar_settings Users can insert shared calendar settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert shared calendar settings" ON public.shared_calendar_settings FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.shared_calendars sc
  WHERE ((sc.id = shared_calendar_settings.shared_calendar_id) AND (sc.receiver_uid = auth.uid())))));


--
-- Name: shared_calendars Users can insert shared calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert shared calendars" ON public.shared_calendars FOR INSERT WITH CHECK (((receiver_uid = auth.uid()) OR public.is_calendar_owner(calendar_id) OR public.is_invited_to_calendar(calendar_id)));


--
-- Name: shared_tokens Users can insert shared tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert shared tokens" ON public.shared_tokens FOR INSERT WITH CHECK (((owner_uid = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.calendars c
  WHERE ((c.id = shared_tokens.calendar_id) AND (c.owner_uid = auth.uid()))))));


--
-- Name: fcm_tokens Users can manage own fcm tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own fcm tokens" ON public.fcm_tokens USING ((auth.uid() = uid));


--
-- Name: ics_tokens Users can manage own ics tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own ics tokens" ON public.ics_tokens USING ((auth.uid() = owner_uid)) WITH CHECK (((auth.uid() = owner_uid) AND public.is_calendar_owner(calendar_id)));


--
-- Name: medicine_boxes Users can update boxes of accessible calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update boxes of accessible calendars" ON public.medicine_boxes FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ((public.calendars c
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((c.id = medicine_boxes.calendar_id) AND ((c.owner_uid = auth.uid()) OR ((i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) AND (i.role = ANY (ARRAY['write'::text, 'admin'::text]))) OR ((sc.receiver_uid = auth.uid()) AND (sc.access = 'edit'::text)))))));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: calendars Users can update own or shared calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own or shared calendars" ON public.calendars FOR UPDATE USING (((owner_uid = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.invitations
  WHERE ((invitations.calendar_id = calendars.id) AND (invitations.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) AND (invitations.role = ANY (ARRAY['write'::text, 'admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.shared_calendars
  WHERE ((shared_calendars.calendar_id = calendars.id) AND (shared_calendars.receiver_uid = auth.uid()) AND (shared_calendars.access = 'edit'::text))))));


--
-- Name: users Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- Name: shared_tokens Users can update own shared tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own shared tokens" ON public.shared_tokens FOR UPDATE USING ((owner_uid = auth.uid()));


--
-- Name: pillbox_uses Users can update pillbox uses of accessible calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update pillbox uses of accessible calendars" ON public.pillbox_uses FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ((public.calendars c
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((c.id = pillbox_uses.calendar_id) AND ((c.owner_uid = auth.uid()) OR ((i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) AND (i.role = ANY (ARRAY['write'::text, 'admin'::text]))) OR ((sc.receiver_uid = auth.uid()) AND (sc.access = 'edit'::text)))))));


--
-- Name: calendar_settings Users can update settings of accessible calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update settings of accessible calendars" ON public.calendar_settings FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ((public.calendars c
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((c.id = calendar_settings.calendar_id) AND ((c.owner_uid = auth.uid()) OR ((i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) AND (i.role = ANY (ARRAY['write'::text, 'admin'::text]))) OR ((sc.receiver_uid = auth.uid()) AND (sc.access = 'edit'::text)))))));


--
-- Name: shared_calendar_settings Users can update shared calendar settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update shared calendar settings" ON public.shared_calendar_settings FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.shared_calendars sc
  WHERE ((sc.id = shared_calendar_settings.shared_calendar_id) AND (sc.receiver_uid = auth.uid())))));


--
-- Name: shared_calendars Users can update shared calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update shared calendars" ON public.shared_calendars FOR UPDATE USING (((receiver_uid = auth.uid()) OR public.is_calendar_owner(calendar_id)));


--
-- Name: medicine_box_conditions Users can update/delete conditions of accessible boxes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update/delete conditions of accessible boxes" ON public.medicine_box_conditions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (((public.medicine_boxes mb
     JOIN public.calendars c ON ((c.id = mb.calendar_id)))
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((mb.id = medicine_box_conditions.box_id) AND ((c.owner_uid = auth.uid()) OR ((i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) AND (i.role = ANY (ARRAY['write'::text, 'admin'::text]))) OR ((sc.receiver_uid = auth.uid()) AND (sc.access = 'edit'::text)))))));


--
-- Name: medicine_boxes Users can view boxes of accessible calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view boxes of accessible calendars" ON public.medicine_boxes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((public.calendars c
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((c.id = medicine_boxes.calendar_id) AND ((c.owner_uid = auth.uid()) OR (i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) OR (sc.receiver_uid = auth.uid()))))));


--
-- Name: medicine_box_conditions Users can view conditions of accessible boxes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view conditions of accessible boxes" ON public.medicine_box_conditions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (((public.medicine_boxes mb
     JOIN public.calendars c ON ((c.id = mb.calendar_id)))
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((mb.id = medicine_box_conditions.box_id) AND ((c.owner_uid = auth.uid()) OR (i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) OR (sc.receiver_uid = auth.uid()))))));


--
-- Name: invitations Users can view invitations sent or received; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view invitations sent or received" ON public.invitations FOR SELECT USING (((invited_email = public.get_auth_email()) OR public.is_calendar_owner(calendar_id)));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: calendars Users can view own or shared calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own or shared calendars" ON public.calendars FOR SELECT USING (((owner_uid = auth.uid()) OR public.is_invited_to_calendar(id) OR public.is_calendar_receiver(id)));


--
-- Name: users Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: shared_tokens Users can view own shared tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own shared tokens" ON public.shared_tokens FOR SELECT USING (((owner_uid = auth.uid()) OR ((id)::text = current_setting('app.current_token'::text, true))));


--
-- Name: pillbox_uses Users can view pillbox uses of accessible calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view pillbox uses of accessible calendars" ON public.pillbox_uses FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((public.calendars c
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((c.id = pillbox_uses.calendar_id) AND ((c.owner_uid = auth.uid()) OR (i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) OR (sc.receiver_uid = auth.uid()))))));


--
-- Name: calendar_settings Users can view settings of accessible calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view settings of accessible calendars" ON public.calendar_settings FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((public.calendars c
     LEFT JOIN public.invitations i ON ((i.calendar_id = c.id)))
     LEFT JOIN public.shared_calendars sc ON ((sc.calendar_id = c.id)))
  WHERE ((c.id = calendar_settings.calendar_id) AND ((c.owner_uid = auth.uid()) OR (i.invited_email = ( SELECT (auth.jwt() ->> 'email'::text))) OR (sc.receiver_uid = auth.uid()))))));


--
-- Name: users Users can view shared calendar participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view shared calendar participants" ON public.users FOR SELECT USING (((EXISTS ( SELECT 1
   FROM (public.shared_calendars sc
     JOIN public.calendars c ON ((sc.calendar_id = c.id)))
  WHERE ((c.owner_uid = users.id) AND (sc.receiver_uid = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.shared_calendars sc
     JOIN public.calendars c ON ((sc.calendar_id = c.id)))
  WHERE ((sc.receiver_uid = users.id) AND (c.owner_uid = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.calendars c
  WHERE ((c.owner_uid = users.id) AND public.is_invited_to_calendar(c.id)))) OR (EXISTS ( SELECT 1
   FROM public.notifications n
  WHERE ((n.sender_uid = users.id) AND (n.user_id = auth.uid()))))));


--
-- Name: shared_calendar_settings Users can view shared calendar settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view shared calendar settings" ON public.shared_calendar_settings FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.shared_calendars sc
  WHERE ((sc.id = shared_calendar_settings.shared_calendar_id) AND (sc.receiver_uid = auth.uid())))));


--
-- Name: shared_calendars Users can view shared calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view shared calendars" ON public.shared_calendars FOR SELECT USING (((receiver_uid = auth.uid()) OR public.is_calendar_owner(calendar_id) OR public.is_calendar_receiver(calendar_id)));


--
-- Name: calendar_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: calendars; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;

--
-- Name: fcm_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: ics_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ics_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: medicaments_afmps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.medicaments_afmps ENABLE ROW LEVEL SECURITY;

--
-- Name: medicine_box_conditions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.medicine_box_conditions ENABLE ROW LEVEL SECURITY;

--
-- Name: medicine_boxes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.medicine_boxes ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: pillbox_uses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pillbox_uses ENABLE ROW LEVEL SECURITY;

--
-- Name: shared_calendar_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shared_calendar_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: shared_calendars; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shared_calendars ENABLE ROW LEVEL SECURITY;

--
-- Name: shared_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shared_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


