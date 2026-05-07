BEGIN;

-- 1. Ajouter les nouvelles colonnes
ALTER TABLE public.fcm_tokens
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS project_id text;

-- 2. Remplir provider pour les tokens existants
UPDATE public.fcm_tokens
SET provider = CASE
  WHEN token LIKE 'ExpoPushToken[%' OR token LIKE 'ExponentPushToken[%' THEN 'expo'
  ELSE 'fcm'
END
WHERE provider IS NULL;

ALTER TABLE public.fcm_tokens
  ALTER COLUMN provider SET DEFAULT 'fcm';

-- 3. Nettoyer les plateformes invalides
UPDATE public.fcm_tokens
SET platform = NULL
WHERE platform IS NOT NULL AND platform NOT IN ('ios', 'android', 'web');

ALTER TABLE public.fcm_tokens
  ALTER COLUMN provider SET NOT NULL;

-- 4. Ajouter les contraintes CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fcm_tokens_provider_check'
  ) THEN
    ALTER TABLE public.fcm_tokens
      ADD CONSTRAINT fcm_tokens_provider_check
      CHECK (provider = ANY (ARRAY['expo'::text, 'fcm'::text]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fcm_tokens_platform_check'
  ) THEN
    ALTER TABLE public.fcm_tokens
      ADD CONSTRAINT fcm_tokens_platform_check
      CHECK (platform = ANY (ARRAY['ios'::text, 'android'::text, 'web'::text]));
  END IF;
END $$;

-- 5. Renommer la table
ALTER TABLE public.fcm_tokens RENAME TO push_tokens;

-- 6. Supprimer l'ancienne fonction et créer la nouvelle avec le bon nom
DROP FUNCTION IF EXISTS public.get_fcm_tokens_for_user(uuid);
CREATE FUNCTION public.get_push_tokens_for_user(target_uid uuid)
  RETURNS TABLE(token text, provider text, platform text, project_id text)
  LANGUAGE sql SECURITY DEFINER
  SET search_path TO 'public'
  AS $$
    SELECT token, provider, platform, project_id
    FROM public.push_tokens
    WHERE uid = target_uid;
  $$;

COMMIT;