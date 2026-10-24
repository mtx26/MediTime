CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id uuid NOT NULL PRIMARY KEY,
    email text NOT NULL,
    display_name text,
    photo_url text,
    role text NOT NULL DEFAULT 'user',
    created_at timestamptz DEFAULT now(),
    email_enabled boolean DEFAULT true,
    push_enabled boolean DEFAULT true,
    sms_enabled boolean NOT NULL DEFAULT false,
    phone text,
    updated_at timestamptz DEFAULT now(),
    notification_time time NOT NULL DEFAULT '08:00:00'
);

CREATE TABLE calendars (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_uid uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE calendar_settings (
    calendar_id uuid PRIMARY KEY REFERENCES calendars(id) ON DELETE CASCADE,
    stock_decrement_method text NOT NULL DEFAULT 'weekly_pillbox'
        CHECK (stock_decrement_method IN ('weekly_pillbox', 'daily_midnight')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    notifications_enabled boolean NOT NULL DEFAULT true
);

CREATE TABLE medicaments_afmps (
    name text,
    dose text,
    forme_pharmaceutique text,
    voie_administration text,
    conditionnement text,
    substance_active text,
    code_atc text,
    code_cnk text,
    code_fmd text UNIQUE,
    url_notice_fr text,
    url_notice_nl text,
    url_notice_de text,
    url_rcp text,
    url_summary_rmp_fr text,
    url_summary_rmp_nl text,
    url_summary_rmp_de text,
    date_derniere_publication_rcp_notice date,
    date_derniere_approbation_rcp_notice date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE medicine_boxes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    name text NOT NULL,
    stock_quantity double precision NOT NULL DEFAULT 0,
    stock_alert_threshold integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    box_capacity integer NOT NULL DEFAULT 0,
    dose integer,
    deleted_at timestamptz,
    code_fmd text REFERENCES medicaments_afmps(code_fmd) ON DELETE SET NULL
);

CREATE TABLE medicine_box_conditions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    box_id uuid NOT NULL REFERENCES medicine_boxes(id) ON DELETE CASCADE,
    time_of_day text NOT NULL DEFAULT 'morning'
        CHECK (time_of_day IN ('morning', 'noon', 'evening')),
    interval_days integer NOT NULL DEFAULT 1,
    start_date date,
    tablet_count double precision NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    max_date timestamptz
);

CREATE TABLE shared_calendars (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    receiver_uid uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access text NOT NULL DEFAULT 'edit',
    accepted_at timestamptz,
    token uuid UNIQUE DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE shared_calendar_settings (
    shared_calendar_id uuid PRIMARY KEY
        REFERENCES shared_calendars(id) ON DELETE CASCADE,
    notifications_enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE ics_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    owner_uid uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz,
    last_user_agent text,
    deleted_at timestamptz
);

CREATE TABLE invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    invited_email text,
    role text NOT NULL DEFAULT 'write'
        CHECK (role IN ('read', 'write', 'admin')),
    token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    accepted_at timestamptz,
    deleted_at timestamptz
);

CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type text,
    content jsonb,
    read boolean NOT NULL DEFAULT false,
    "timestamp" timestamptz DEFAULT now(),
    sender_uid uuid REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    shared_calendar_id uuid REFERENCES shared_calendars(id) ON DELETE CASCADE,
    calendar_id uuid REFERENCES calendars(id) ON DELETE CASCADE,
    medication_id uuid REFERENCES medicine_boxes(id) ON DELETE CASCADE
);

COMMENT ON COLUMN notifications.sender_uid IS
    'ID de l''expéditeur (nullable pour les notifications système ou si l''expéditeur est supprimé)';

CREATE TABLE pillbox_uses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    prepared_at timestamptz NOT NULL DEFAULT now(),
    prepared_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    restored_at timestamptz
);

CREATE TABLE push_tokens (
    uid uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token text PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    device_name text,
    provider text NOT NULL DEFAULT 'fcm'
        CHECK (provider IN ('expo', 'fcm')),
    platform text CHECK (platform IN ('ios', 'android', 'web')),
    project_id text,
    UNIQUE (uid, token)
);

CREATE TABLE shared_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    expires_at timestamptz,
    owner_uid uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE INDEX idx_medicaments_afmps_name_pattern
    ON medicaments_afmps (name text_pattern_ops);
CREATE INDEX invitations_calendar_id_idx ON invitations (calendar_id);

CREATE FUNCTION touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE FUNCTION ensure_calendar_settings() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO calendar_settings (calendar_id)
    VALUES (NEW.id)
    ON CONFLICT (calendar_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE FUNCTION ensure_shared_calendar_settings() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO shared_calendar_settings (shared_calendar_id)
    VALUES (NEW.id)
    ON CONFLICT (shared_calendar_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ensure_calendar_settings
    AFTER INSERT ON calendars
    FOR EACH ROW EXECUTE FUNCTION ensure_calendar_settings();
CREATE TRIGGER trg_ensure_shared_calendar_settings
    AFTER INSERT ON shared_calendars
    FOR EACH ROW EXECUTE FUNCTION ensure_shared_calendar_settings();

CREATE TRIGGER trg_touch_updated_at_bis_medicaments_afmps
    BEFORE UPDATE ON medicaments_afmps
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_calendar_settings
    BEFORE UPDATE ON calendar_settings
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_calendars
    BEFORE UPDATE ON calendars
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_push_tokens
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_ics_tokens
    BEFORE UPDATE ON ics_tokens
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_invitations
    BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_medicine_box_conditions
    BEFORE UPDATE ON medicine_box_conditions
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_medicine_boxes
    BEFORE UPDATE ON medicine_boxes
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_notifications
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_pillbox_uses
    BEFORE UPDATE ON pillbox_uses
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_shared_calendar_settings
    BEFORE UPDATE ON shared_calendar_settings
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_shared_calendars
    BEFORE UPDATE ON shared_calendars
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_shared_tokens
    BEFORE UPDATE ON shared_tokens
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_touch_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
