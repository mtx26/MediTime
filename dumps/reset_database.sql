-- Script pour réinitialiser complètement Supabase
-- Solution simple : supprimer tout le schéma public d'un coup

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

-- Supprimer TOUT le schéma public (tables, fonctions, policies, etc.)
DROP SCHEMA IF EXISTS public CASCADE;

-- Recréer le schéma public vierge
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
COMMENT ON SCHEMA public IS 'standard public schema';
