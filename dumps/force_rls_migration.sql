-- =====================================================================
-- MediTime — Rendre la RLS effectivement contraignante
-- =====================================================================
--
-- CONTEXTE
-- --------
-- Les tables du schéma public ont ENABLE ROW LEVEL SECURITY et des policies,
-- mais aucune n'a FORCE ROW LEVEL SECURITY. Or ENABLE seul ne s'applique pas :
--   - au propriétaire de la table,
--   - à tout rôle possédant l'attribut BYPASSRLS (dont les superusers).
--
-- Le backend se connecte avec `postgres.<project-ref>`, c'est-à-dire le rôle
-- `postgres` de Supabase, propriétaire des tables. Toutes les policies étaient
-- donc contournées sur chaque requête ne basculant pas explicitement de rôle.
--
-- POURQUOI CE SCRIPT N'ÉNUMÈRE PAS LES TABLES
-- -------------------------------------------
-- Une première version listait les tables à la main d'après
-- dumps/public_schema.sql. Ce dump est périmé (il contient encore `fcm_tokens`,
-- renommée depuis en `push_tokens`), ce qui faisait échouer la migration sur
-- « relation "public.fcm_tokens" does not exist ».
-- Le script lit désormais le catalogue système : il s'applique à ce qui existe
-- réellement dans la base, quelle que soit la dérive du dump.
--
-- ORDRE D'EXÉCUTION
-- -----------------
-- Exécuter les étapes 1 et 2 (lecture seule) AVANT l'étape 3.
-- Si l'étape 2 révèle des privilèges manquants, appliquer l'étape 2b : sinon
-- l'API renverra « permission denied for table ... » après bascule de rôle.
-- =====================================================================


-- ---------------------------------------------------------------------
-- ÉTAPE 1 — État actuel (lecture seule)
-- ---------------------------------------------------------------------
SELECT
    c.relname                   AS table_name,
    c.relrowsecurity            AS rls_enabled,
    c.relforcerowsecurity       AS rls_forced,
    pg_get_userbyid(c.relowner) AS owner,
    (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relrowsecurity, c.relname;

-- Signaler les tables SANS RLS ou SANS policy : FORCE RLS sur une table sans
-- policy bloque tout accès non-propriétaire. À traiter avant l'étape 3.
SELECT
    c.relname AS table_sans_protection,
    c.relrowsecurity AS rls_enabled,
    (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND (
      c.relrowsecurity = false
      OR (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) = 0
  )
ORDER BY c.relname;


-- ---------------------------------------------------------------------
-- ÉTAPE 2 — Privilèges des rôles applicatifs
-- ---------------------------------------------------------------------
-- Le backend bascule en SET LOCAL ROLE authenticated / anon. Sans GRANT, la
-- requête échoue sur un défaut de privilège avant même d'atteindre la RLS.
SELECT
    table_name,
    grantee,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('authenticated', 'anon')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

SELECT
    nspname AS schema_name,
    has_schema_privilege('authenticated', nspname, 'USAGE') AS authenticated_usage,
    has_schema_privilege('anon',          nspname, 'USAGE') AS anon_usage
FROM pg_namespace
WHERE nspname = 'public';

-- authenticated et anon DOIVENT avoir rolbypassrls = false.
SELECT rolname, rolbypassrls, rolsuper
FROM pg_roles
WHERE rolname IN ('authenticated', 'anon', 'postgres', 'service_role')
ORDER BY rolname;


-- ---------------------------------------------------------------------
-- ÉTAPE 2b — N'exécuter QUE si l'étape 2 montre des privilèges manquants
-- ---------------------------------------------------------------------
-- Privilèges standards d'un projet Supabase ; les rejouer est sans effet
-- s'ils sont déjà en place.
--
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
--
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public
--   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public
--   GRANT SELECT ON TABLES TO anon;


-- ---------------------------------------------------------------------
-- ÉTAPE 3 — Activer FORCE ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
-- Parcourt les tables réellement présentes. Conditions d'éligibilité :
--   - RLS déjà activée (ENABLE),
--   - au moins une policy (sinon FORCE couperait tout accès),
--   - pas dans la liste d'exclusion.
--
-- Exclusion : medicaments_afmps est un référentiel public de médicaments
-- (données AFMPS), pas des données utilisateur. Le forcer casserait les
-- imports batch exécutés par le propriétaire.
--
-- Transactionnel : en cas d'erreur, rien n'est appliqué.
BEGIN;

DO $$
DECLARE
    excluded_tables text[] := ARRAY['medicaments_afmps'];
    r record;
    forced_count int := 0;
    skipped_count int := 0;
BEGIN
    FOR r IN
        SELECT
            c.relname,
            c.relrowsecurity,
            (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND NOT (c.relname = ANY (excluded_tables))
        ORDER BY c.relname
    LOOP
        IF NOT r.relrowsecurity THEN
            RAISE WARNING 'IGNOREE (RLS desactivee) : %', r.relname;
            skipped_count := skipped_count + 1;
        ELSIF r.policy_count = 0 THEN
            RAISE WARNING 'IGNOREE (aucune policy, FORCE bloquerait tout acces) : %', r.relname;
            skipped_count := skipped_count + 1;
        ELSE
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.relname);
            RAISE NOTICE 'FORCE RLS activee : %', r.relname;
            forced_count := forced_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE '--- % table(s) forcee(s), % ignoree(s) ---', forced_count, skipped_count;
END
$$;

COMMIT;


-- ---------------------------------------------------------------------
-- ÉTAPE 4 — Contrôle post-migration
-- ---------------------------------------------------------------------
SELECT
    c.relname             AS table_name,
    c.relrowsecurity      AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relforcerowsecurity, c.relname;

-- Test de cloisonnement : doit renvoyer 0.
-- Simule ce que voit la route publique /api/tokens/<token>/medicines sans token.
BEGIN;
SET LOCAL ROLE anon;
SELECT count(*) AS lignes_visibles_sans_token FROM public.medicine_box_conditions;
ROLLBACK;
-- Avant migration, ce compteur renvoyait la totalité de la table.


-- ---------------------------------------------------------------------
-- ÉTAPE 5 — Rollback si l'application régresse
-- ---------------------------------------------------------------------
-- BEGIN;
-- DO $$
-- DECLARE r record;
-- BEGIN
--     FOR r IN
--         SELECT c.relname
--         FROM pg_class c
--         JOIN pg_namespace n ON n.oid = c.relnamespace
--         WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relforcerowsecurity
--     LOOP
--         EXECUTE format('ALTER TABLE public.%I NO FORCE ROW LEVEL SECURITY', r.relname);
--     END LOOP;
-- END
-- $$;
-- COMMIT;
--
-- Côté application, l'équivalent immédiat est de vider les variables
-- DB_RLS_AUTHENTICATED_ROLE et DB_RLS_ANON_ROLE : le backend cesse alors de
-- basculer de rôle. Les filtres SQL explicites ajoutés aux routes publiques
-- restent actifs dans tous les cas.
