-- ==============================================================================
-- ROLLBACK RLS POUR MEDITIME (V2)
-- Ce script désactive le RLS et supprime toutes les politiques créées par rls_policies_v2.sql.
-- ==============================================================================

-- 1. SUPPRESSION DES POLITIQUES (POLICIES)
-- ==============================================================================

-- TABLE: users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view shared calendar participants" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- TABLE: calendars
DROP POLICY IF EXISTS "Users can view own or shared calendars" ON public.calendars;
DROP POLICY IF EXISTS "Users can insert own calendars" ON public.calendars;
DROP POLICY IF EXISTS "Users can update own or shared calendars" ON public.calendars;
DROP POLICY IF EXISTS "Users can delete own calendars" ON public.calendars;
DROP POLICY IF EXISTS "Public access via ics token" ON public.calendars;

-- TABLE: calendar_settings
DROP POLICY IF EXISTS "Users can view settings of accessible calendars" ON public.calendar_settings;
DROP POLICY IF EXISTS "Users can update settings of accessible calendars" ON public.calendar_settings;
DROP POLICY IF EXISTS "Users can insert settings for accessible calendars" ON public.calendar_settings;

-- TABLE: medicine_boxes
DROP POLICY IF EXISTS "Users can view boxes of accessible calendars" ON public.medicine_boxes;
DROP POLICY IF EXISTS "Users can insert boxes to accessible calendars" ON public.medicine_boxes;
DROP POLICY IF EXISTS "Users can update boxes of accessible calendars" ON public.medicine_boxes;
DROP POLICY IF EXISTS "Users can delete boxes of accessible calendars" ON public.medicine_boxes;
DROP POLICY IF EXISTS "Public access via shared token" ON public.medicine_boxes;
DROP POLICY IF EXISTS "Public access via ics token" ON public.medicine_boxes;

-- TABLE: medicine_box_conditions
DROP POLICY IF EXISTS "Users can view conditions of accessible boxes" ON public.medicine_box_conditions;
DROP POLICY IF EXISTS "Users can manage conditions of accessible boxes" ON public.medicine_box_conditions; -- Old
DROP POLICY IF EXISTS "Users can update/delete conditions of accessible boxes" ON public.medicine_box_conditions;
DROP POLICY IF EXISTS "Users can delete conditions of accessible boxes" ON public.medicine_box_conditions;
DROP POLICY IF EXISTS "Users can insert conditions" ON public.medicine_box_conditions;
DROP POLICY IF EXISTS "Public access via shared token" ON public.medicine_box_conditions;
DROP POLICY IF EXISTS "Public access via ics token" ON public.medicine_box_conditions;

-- TABLE: pillbox_uses
DROP POLICY IF EXISTS "Users can view pillbox uses of accessible calendars" ON public.pillbox_uses;
DROP POLICY IF EXISTS "Users can insert pillbox uses to accessible calendars" ON public.pillbox_uses;
DROP POLICY IF EXISTS "Users can delete pillbox uses of accessible calendars" ON public.pillbox_uses;

-- TABLE: notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert sent notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own or sent notifications" ON public.notifications;

-- TABLE: fcm_tokens
DROP POLICY IF EXISTS "Users can manage own fcm tokens" ON public.fcm_tokens;

-- TABLE: ics_tokens
DROP POLICY IF EXISTS "Users can manage own ics tokens" ON public.ics_tokens; -- Old name
DROP POLICY IF EXISTS "Owners can manage their ics tokens" ON public.ics_tokens; -- New name
DROP POLICY IF EXISTS "Public access via ics token" ON public.ics_tokens;

-- TABLE: invitations
DROP POLICY IF EXISTS "Users can view invitations sent or received" ON public.invitations;
DROP POLICY IF EXISTS "Calendar owners can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can delete invitations" ON public.invitations;

-- TABLE: shared_calendars
DROP POLICY IF EXISTS "Users can view shared calendars" ON public.shared_calendars;
DROP POLICY IF EXISTS "Users can insert shared calendars" ON public.shared_calendars;
DROP POLICY IF EXISTS "Users can update shared calendars" ON public.shared_calendars;
DROP POLICY IF EXISTS "Users can delete shared calendars" ON public.shared_calendars;

-- TABLE: shared_calendar_settings
DROP POLICY IF EXISTS "Users can view shared calendar settings" ON public.shared_calendar_settings;
DROP POLICY IF EXISTS "Users can update shared calendar settings" ON public.shared_calendar_settings;
DROP POLICY IF EXISTS "Users can insert shared calendar settings" ON public.shared_calendar_settings;

-- TABLE: shared_tokens
DROP POLICY IF EXISTS "Users can view own shared tokens" ON public.shared_tokens;
DROP POLICY IF EXISTS "Users can insert shared tokens" ON public.shared_tokens;
DROP POLICY IF EXISTS "Users can update own shared tokens" ON public.shared_tokens;
DROP POLICY IF EXISTS "Users can delete own shared tokens" ON public.shared_tokens;

-- TABLE: medicaments_afmps
DROP POLICY IF EXISTS "Public read access" ON public.medicaments_afmps;

-- 2. SUPPRESSION DES FONCTIONS
-- ==============================================================================
DROP FUNCTION IF EXISTS public.is_calendar_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_calendar_receiver(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_email() CASCADE;
DROP FUNCTION IF EXISTS public.is_invited_to_calendar(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_by_email(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_fcm_tokens_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_public_user_info(uuid) CASCADE;

-- 3. DÉSACTIVATION DU RLS SUR TOUTES LES TABLES
-- ==============================================================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_boxes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_box_conditions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillbox_uses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ics_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicaments_afmps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_calendars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_calendar_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_tokens DISABLE ROW LEVEL SECURITY;
