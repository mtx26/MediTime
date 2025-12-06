-- ==============================================================================
-- PLAN RLS COMPLET POUR MEDITIME (CORRIGÉ - RECURSION FIX + SHARED_CALENDARS)
-- Généré après analyse du code backend (services/*.py)
-- ==============================================================================

-- 1. ACTIVATION DU RLS SUR TOUTES LES TABLES SENSIBLES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_box_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ics_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicaments_afmps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillbox_uses ENABLE ROW LEVEL SECURITY;

-- 1.1 FONCTIONS UTILITAIRES (SECURITY DEFINER)
-- Permet de briser la récursion infinie (Calendars -> Invitations/Shared -> Calendars)
-- En s'exécutant avec les droits du créateur (admin), cette fonction contourne le RLS sur 'calendars'.
CREATE OR REPLACE FUNCTION public.is_calendar_owner(cal_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM calendars
    WHERE id = cal_id
    AND owner_uid = auth.uid()
  );
$$;

-- Permet de briser la récursion infinie (SharedCalendars -> SharedCalendars)
CREATE OR REPLACE FUNCTION public.is_calendar_receiver(cal_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shared_calendars
    WHERE calendar_id = cal_id
    AND receiver_uid = auth.uid()
  );
$$;

-- 2. POLITIQUES (POLICIES)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TABLE: users
-- Usage: app/services/user.py
-- ------------------------------------------------------------------------------
-- Lecture : Un utilisateur ne peut voir que son propre profil.
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Lecture : Voir le profil des participants aux calendriers partagés (Propriétaire <-> Receveur)
CREATE POLICY "Users can view shared calendar participants" 
ON public.users FOR SELECT 
USING (
  -- Cas 1: Je suis le receveur, je veux voir le propriétaire (users.id)
  EXISTS (
    SELECT 1 FROM public.shared_calendars sc
    JOIN public.calendars c ON sc.calendar_id = c.id
    WHERE c.owner_uid = users.id
    AND sc.receiver_uid = auth.uid()
  )
  OR
  -- Cas 2: Je suis le propriétaire, je veux voir le receveur (users.id)
  EXISTS (
    SELECT 1 FROM public.shared_calendars sc
    JOIN public.calendars c ON sc.calendar_id = c.id
    WHERE sc.receiver_uid = users.id
    AND c.owner_uid = auth.uid()
  )
  OR
  -- Cas 3: Je suis invité, je veux voir le propriétaire (users.id)
  EXISTS (
    SELECT 1 FROM public.invitations i
    JOIN public.calendars c ON i.calendar_id = c.id
    WHERE c.owner_uid = users.id
    AND i.invited_email = (select auth.jwt() ->> 'email')
  )
);

-- Modification : Un utilisateur ne peut modifier que son propre profil.
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Insertion : Un utilisateur peut créer son propre profil (lors de l'inscription).
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);


-- ------------------------------------------------------------------------------
-- TABLE: calendars
-- Usage: app/services/medication/pillbox.py, app/services/medication/boxes.py
-- ------------------------------------------------------------------------------
-- Lecture : Propriétaire OU Invité (via invitations) OU Partagé (via shared_calendars)
CREATE POLICY "Users can view own or shared calendars" 
ON public.calendars FOR SELECT 
USING (
  owner_uid = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.invitations 
    WHERE calendar_id = calendars.id 
    AND invited_email = (select auth.jwt() ->> 'email')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_calendars
    WHERE calendar_id = calendars.id
    AND receiver_uid = auth.uid()
  )
);

-- Insertion : On ne peut créer un calendrier que si on en est le propriétaire.
CREATE POLICY "Users can insert own calendars" 
ON public.calendars FOR INSERT 
WITH CHECK (auth.uid() = owner_uid);

-- Modification : Propriétaire OU Invité/Partagé avec droits d'écriture
CREATE POLICY "Users can update own or shared calendars" 
ON public.calendars FOR UPDATE 
USING (
  owner_uid = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.invitations 
    WHERE calendar_id = calendars.id 
    AND invited_email = (select auth.jwt() ->> 'email')
    AND role IN ('write', 'admin')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_calendars
    WHERE calendar_id = calendars.id
    AND receiver_uid = auth.uid()
    AND access = 'edit'
  )
);

-- Suppression : Propriétaire uniquement.
CREATE POLICY "Users can delete own calendars" 
ON public.calendars FOR DELETE 
USING (auth.uid() = owner_uid);


-- ------------------------------------------------------------------------------
-- TABLE: calendar_settings
-- Usage: app/services/medication/pillbox.py (via JOIN)
-- ------------------------------------------------------------------------------
-- Accès lié au calendrier parent (Propriétaire ou Invité/Partagé)
CREATE POLICY "Users can view settings of accessible calendars" 
ON public.calendar_settings FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.calendars c
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE c.id = calendar_settings.calendar_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      i.invited_email = (select auth.jwt() ->> 'email')
      OR
      sc.receiver_uid = auth.uid()
    )
  )
);

CREATE POLICY "Users can update settings of accessible calendars" 
ON public.calendar_settings FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.calendars c
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE c.id = calendar_settings.calendar_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      (i.invited_email = (select auth.jwt() ->> 'email') AND i.role IN ('write', 'admin'))
      OR
      (sc.receiver_uid = auth.uid() AND sc.access = 'edit')
    )
  )
);

CREATE POLICY "Users can insert settings for accessible calendars" 
ON public.calendar_settings FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.calendars c
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE c.id = calendar_settings.calendar_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      (i.invited_email = (select auth.jwt() ->> 'email') AND i.role IN ('write', 'admin'))
      OR
      (sc.receiver_uid = auth.uid() AND sc.access = 'edit')
    )
  )
);


-- ------------------------------------------------------------------------------
-- TABLE: medicine_boxes
-- Usage: app/services/medication/boxes.py, app/services/medication/stock.py
-- ------------------------------------------------------------------------------
-- Accès lié au calendrier parent (Propriétaire ou Invité/Partagé)
CREATE POLICY "Users can view boxes of accessible calendars" 
ON public.medicine_boxes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.calendars c
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE c.id = medicine_boxes.calendar_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      i.invited_email = (select auth.jwt() ->> 'email')
      OR
      sc.receiver_uid = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert boxes to accessible calendars" 
ON public.medicine_boxes FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.calendars c
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE c.id = medicine_boxes.calendar_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      (i.invited_email = (select auth.jwt() ->> 'email') AND i.role IN ('write', 'admin'))
      OR
      (sc.receiver_uid = auth.uid() AND sc.access = 'edit')
    )
  )
);

CREATE POLICY "Users can update boxes of accessible calendars" 
ON public.medicine_boxes FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.calendars c
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE c.id = medicine_boxes.calendar_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      (i.invited_email = (select auth.jwt() ->> 'email') AND i.role IN ('write', 'admin'))
      OR
      (sc.receiver_uid = auth.uid() AND sc.access = 'edit')
    )
  )
);

CREATE POLICY "Users can delete boxes of accessible calendars" 
ON public.medicine_boxes FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.calendars c
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE c.id = medicine_boxes.calendar_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      (i.invited_email = (select auth.jwt() ->> 'email') AND i.role IN ('write', 'admin'))
      OR
      (sc.receiver_uid = auth.uid() AND sc.access = 'edit')
    )
  )
);


-- ------------------------------------------------------------------------------
-- TABLE: medicine_box_conditions
-- Usage: app/services/medication/stock.py
-- ------------------------------------------------------------------------------
-- Accès lié à la boîte parente (et donc au calendrier).
CREATE POLICY "Users can view conditions of accessible boxes" 
ON public.medicine_box_conditions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.medicine_boxes mb
    JOIN public.calendars c ON c.id = mb.calendar_id
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE mb.id = medicine_box_conditions.box_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      i.invited_email = (select auth.jwt() ->> 'email')
      OR
      sc.receiver_uid = auth.uid()
    )
  )
);

-- UPDATE/DELETE : La boîte doit exister et être accessible
CREATE POLICY "Users can update/delete conditions of accessible boxes" 
ON public.medicine_box_conditions FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.medicine_boxes mb
    JOIN public.calendars c ON c.id = mb.calendar_id
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE mb.id = medicine_box_conditions.box_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      (i.invited_email = (select auth.jwt() ->> 'email') AND i.role IN ('write', 'admin'))
      OR
      (sc.receiver_uid = auth.uid() AND sc.access = 'edit')
    )
  )
);

CREATE POLICY "Users can delete conditions of accessible boxes" 
ON public.medicine_box_conditions FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.medicine_boxes mb
    JOIN public.calendars c ON c.id = mb.calendar_id
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE mb.id = medicine_box_conditions.box_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      (i.invited_email = (select auth.jwt() ->> 'email') AND i.role IN ('write', 'admin'))
      OR
      (sc.receiver_uid = auth.uid() AND sc.access = 'edit')
    )
  )
);

-- INSERT : Cas spécial pour supporter l'insertion via CTE (boîte créée dans la même transaction)
-- On autorise l'insertion SI :
-- 1. La boîte existe et on a les droits (cas normal)
-- 2. OU la boîte n'existe PAS DU TOUT dans la base (cas création simultanée)
--    Pour vérifier l'inexistence globale de manière sûre (sans être filtré par le RLS de medicine_boxes),
--    on utilise une fonction SECURITY DEFINER.
CREATE POLICY "Users can insert conditions" 
ON public.medicine_box_conditions FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.medicine_boxes mb
    JOIN public.calendars c ON c.id = mb.calendar_id
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE mb.id = medicine_box_conditions.box_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      (i.invited_email = (select auth.jwt() ->> 'email') AND i.role IN ('write', 'admin'))
      OR
      (sc.receiver_uid = auth.uid() AND sc.access = 'edit')
    )
  )
);

-- ------------------------------------------------------------------------------
-- POLITIQUES POUR ACCÈS PUBLIC VIA TOKEN (medicine_boxes & conditions)
-- ------------------------------------------------------------------------------
-- Ces politiques permettent l'accès si la variable de session 'app.current_token'
-- correspond à un token valide dans shared_tokens pour le calendrier concerné.

CREATE POLICY "Public access via shared token" ON medicine_boxes
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 
        FROM shared_tokens st
        WHERE st.id::text = current_setting('app.current_token', true)
        AND st.calendar_id = medicine_boxes.calendar_id
        AND st.revoked = false
        AND (st.expires_at IS NULL OR st.expires_at > NOW())
    )
);

CREATE POLICY "Public access via shared token" ON medicine_box_conditions
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 
        FROM medicine_boxes box
        JOIN shared_tokens st ON st.calendar_id = box.calendar_id
        WHERE box.id = medicine_box_conditions.box_id
        AND st.id::text = current_setting('app.current_token', true)
        AND st.revoked = false
        AND (st.expires_at IS NULL OR st.expires_at > NOW())
    )
);


-- ------------------------------------------------------------------------------
-- POLITIQUES POUR ACCÈS ICS (ics_tokens, medicine_boxes, conditions)
-- ------------------------------------------------------------------------------

-- Permettre aux propriétaires de gérer leurs tokens ICS
CREATE POLICY "Owners can manage their ics tokens" ON ics_tokens
FOR ALL
TO authenticated
USING (owner_uid = auth.uid())
WITH CHECK (owner_uid = auth.uid());

-- Permettre l'accès public à la table ics_tokens SI on connait le token (pour la validation/update)
CREATE POLICY "Public access via ics token" ON ics_tokens
FOR ALL
TO public
USING (
    token = current_setting('app.current_ics_token', true)
    AND revoked_at IS NULL
);

-- Permettre l'accès en lecture au calendrier via token ICS (pour récupérer le nom)
CREATE POLICY "Public access via ics token" ON calendars
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 
        FROM ics_tokens it
        WHERE it.token = current_setting('app.current_ics_token', true)
        AND it.calendar_id = calendars.id
        AND it.revoked_at IS NULL
    )
);

-- Permettre l'accès aux boîtes via token ICS
CREATE POLICY "Public access via ics token" ON medicine_boxes
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 
        FROM ics_tokens it
        WHERE it.token = current_setting('app.current_ics_token', true)
        AND it.calendar_id = medicine_boxes.calendar_id
        AND it.revoked_at IS NULL
    )
);

-- Permettre l'accès aux conditions via token ICS
CREATE POLICY "Public access via ics token" ON medicine_box_conditions
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 
        FROM medicine_boxes box
        JOIN ics_tokens it ON it.calendar_id = box.calendar_id
        WHERE box.id = medicine_box_conditions.box_id
        AND it.token = current_setting('app.current_ics_token', true)
        AND it.revoked_at IS NULL
    )
);



-- ------------------------------------------------------------------------------
-- TABLE: pillbox_uses
-- Usage: app/services/medication/pillbox.py, app/services/calendar/core.py
-- ------------------------------------------------------------------------------

-- Lecture : Accès si on a accès au calendrier (Propriétaire, Invité, Partagé)
CREATE POLICY "Users can view pillbox uses of accessible calendars" 
ON public.pillbox_uses FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.calendars c
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE c.id = pillbox_uses.calendar_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      i.invited_email = (select auth.jwt() ->> 'email')
      OR
      sc.receiver_uid = auth.uid()
    )
  )
);

-- Insertion : Accès écriture requis
CREATE POLICY "Users can insert pillbox uses to accessible calendars" 
ON public.pillbox_uses FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.calendars c
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE c.id = pillbox_uses.calendar_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      (i.invited_email = (select auth.jwt() ->> 'email') AND i.role IN ('write', 'admin'))
      OR
      (sc.receiver_uid = auth.uid() AND sc.access = 'edit')
    )
  )
);

-- Suppression : Accès écriture requis
CREATE POLICY "Users can delete pillbox uses of accessible calendars" 
ON public.pillbox_uses FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.calendars c
    LEFT JOIN public.invitations i ON i.calendar_id = c.id
    LEFT JOIN public.shared_calendars sc ON sc.calendar_id = c.id
    WHERE c.id = pillbox_uses.calendar_id 
    AND (
      c.owner_uid = auth.uid()
      OR 
      (i.invited_email = (select auth.jwt() ->> 'email') AND i.role IN ('write', 'admin'))
      OR
      (sc.receiver_uid = auth.uid() AND sc.access = 'edit')
    )
  )
);


-- ------------------------------------------------------------------------------
-- TABLE: notifications
-- Usage: app/services/notifications/core.py
-- ------------------------------------------------------------------------------
-- Chacun ne voit que ses propres notifications.
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Insertion : Le système (via sender_uid) ou l'utilisateur (invitations)
CREATE POLICY "Users can insert sent notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (sender_uid = auth.uid());

-- Modification : Marquer comme lu (propre notif)
CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Suppression : L'utilisateur peut supprimer ses notifs (nettoyage) 
-- OU l'expéditeur peut supprimer une notif qu'il a envoyée (ex: annulation invitation)
CREATE POLICY "Users can delete own or sent notifications" 
ON public.notifications FOR DELETE 
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() = sender_uid
);


-- ------------------------------------------------------------------------------
-- TABLE: fcm_tokens
-- Usage: app/auth/fcm.py (supposé)
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can manage own fcm tokens" 
ON public.fcm_tokens FOR ALL 
USING (auth.uid() = uid);


-- ------------------------------------------------------------------------------
-- TABLE: ics_tokens
-- Usage: app/services/ics/ics.py
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can manage own ics tokens" 
ON public.ics_tokens FOR ALL 
USING (auth.uid() = owner_uid)
WITH CHECK (
  auth.uid() = owner_uid
  AND EXISTS (
    SELECT 1 FROM calendars c 
    WHERE c.id = calendar_id 
    AND c.owner_uid = auth.uid()
  )
);


-- ------------------------------------------------------------------------------
-- TABLE: invitations
-- Usage: Gestion des partages (en attente)
-- ------------------------------------------------------------------------------
-- Voir les invitations reçues (basé sur l'email) OU envoyées (basé sur le calendrier).
-- UTILISATION DE is_calendar_owner() POUR ÉVITER LA RÉCURSION INFINIE
CREATE POLICY "Users can view invitations sent or received" 
ON public.invitations FOR SELECT 
USING (
  -- Je suis l'invité (basé sur l'email du token JWT)
  (invited_email = (select auth.jwt() ->> 'email'))
  OR 
  -- Je suis le propriétaire du calendrier qui invite (via fonction sécurisée)
  is_calendar_owner(calendar_id)
);

-- Créer une invitation : Seul le propriétaire du calendrier peut le faire.
CREATE POLICY "Calendar owners can create invitations" 
ON public.invitations FOR INSERT 
WITH CHECK (
  is_calendar_owner(calendar_id)
);

-- Supprimer/Révoquer une invitation : Propriétaire ou Invité (refuser).
CREATE POLICY "Users can delete invitations" 
ON public.invitations FOR DELETE 
USING (
  (invited_email = (select auth.jwt() ->> 'email'))
  OR 
  is_calendar_owner(calendar_id)
);


-- ------------------------------------------------------------------------------
-- TABLE: shared_calendars
-- Usage: Gestion des partages (actifs)
-- ------------------------------------------------------------------------------
-- Voir les partages où je suis le receveur OU le propriétaire du calendrier OU un autre partage du même calendrier.
-- Utilisation de is_calendar_owner() pour éviter la récursion avec la policy de 'calendars'.
-- Utilisation de is_calendar_receiver() pour éviter la récursion avec la policy de 'shared_calendars'.
CREATE POLICY "Users can view shared calendars" 
ON public.shared_calendars FOR SELECT 
USING (
  receiver_uid = auth.uid()
  OR
  is_calendar_owner(calendar_id)
  OR
  is_calendar_receiver(calendar_id)
);

-- Insertion : Le receveur (acceptation invitation) ou le propriétaire (création invitation).
CREATE POLICY "Users can insert shared calendars" 
ON public.shared_calendars FOR INSERT 
WITH CHECK (
  receiver_uid = auth.uid()
  OR
  is_calendar_owner(calendar_id)
);

-- Mise à jour : Le receveur peut accepter (passer accepted à true).
CREATE POLICY "Users can update shared calendars" 
ON public.shared_calendars FOR UPDATE 
USING (
  receiver_uid = auth.uid()
);

-- Supprimer un partage : Le receveur (quitter) ou le propriétaire (révoquer).
CREATE POLICY "Users can delete shared calendars" 
ON public.shared_calendars FOR DELETE 
USING (
  receiver_uid = auth.uid()
  OR
  is_calendar_owner(calendar_id)
);


-- ------------------------------------------------------------------------------
-- TABLE: shared_calendar_settings
-- Usage: Paramètres spécifiques au partage (ex: notifications)
-- ------------------------------------------------------------------------------
-- Accès si on est le receveur du partage correspondant.
CREATE POLICY "Users can view shared calendar settings" 
ON public.shared_calendar_settings FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shared_calendars sc
    WHERE sc.id = shared_calendar_settings.shared_calendar_id
    AND sc.receiver_uid = auth.uid()
  )
);

CREATE POLICY "Users can update shared calendar settings" 
ON public.shared_calendar_settings FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.shared_calendars sc
    WHERE sc.id = shared_calendar_settings.shared_calendar_id
    AND sc.receiver_uid = auth.uid()
  )
);

CREATE POLICY "Users can insert shared calendar settings" 
ON public.shared_calendar_settings FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shared_calendars sc
    WHERE sc.id = shared_calendar_settings.shared_calendar_id
    AND sc.receiver_uid = auth.uid()
  )
);


-- ------------------------------------------------------------------------------
-- TABLE: shared_tokens
-- Usage: app/routes/tokens.py
-- ------------------------------------------------------------------------------
-- Lecture : Le propriétaire du token (celui qui l'a créé) ou accès public via le token lui-même (pour validation)
CREATE POLICY "Users can view own shared tokens" 
ON public.shared_tokens FOR SELECT 
USING (
  owner_uid = auth.uid()
  OR
  -- Permet de lire le token s'il correspond à celui stocké en session (pour validation publique)
  id::text = current_setting('app.current_token', true)
);

-- Insertion : Seul le propriétaire du calendrier peut créer un token.
CREATE POLICY "Users can insert shared tokens" 
ON public.shared_tokens FOR INSERT 
WITH CHECK (
  owner_uid = auth.uid()
  AND EXISTS (
    SELECT 1 FROM calendars c 
    WHERE c.id = calendar_id 
    AND c.owner_uid = auth.uid()
  )
);

-- Mise à jour : Seul le propriétaire peut modifier (révoquer, changer expiration/permissions).
CREATE POLICY "Users can update own shared tokens" 
ON public.shared_tokens FOR UPDATE 
USING (owner_uid = auth.uid());

-- Suppression : Seul le propriétaire peut supprimer.
CREATE POLICY "Users can delete own shared tokens" 
ON public.shared_tokens FOR DELETE 
USING (owner_uid = auth.uid());


-- ------------------------------------------------------------------------------
-- TABLE: medicaments_afmps
-- Usage: Référence publique
-- ------------------------------------------------------------------------------
CREATE POLICY "Public read access" 
ON public.medicaments_afmps FOR SELECT 
USING (true);

-- 3. FONCTIONS RPC (SECURITY DEFINER)
-- ==============================================================================

-- Récupérer un utilisateur par email (pour les invitations)
-- Contourne le RLS sur 'users' de manière contrôlée.
CREATE OR REPLACE FUNCTION public.get_user_by_email(lookup_email text)
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.users WHERE email = lookup_email;
$$;

-- Récupérer les tokens FCM d'un utilisateur (pour les notifications)
-- Contourne le RLS sur 'fcm_tokens' de manière contrôlée.
CREATE OR REPLACE FUNCTION public.get_fcm_tokens_for_user(target_uid uuid)
RETURNS TABLE (token text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT token FROM public.fcm_tokens WHERE uid = target_uid;
$$;

-- Récupérer les infos publiques d'un utilisateur par ID (pour notifications/affichage)
CREATE OR REPLACE FUNCTION public.get_public_user_info(target_uid uuid)
RETURNS TABLE (display_name text, photo_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_name, photo_url FROM public.users WHERE id = target_uid;
$$;

