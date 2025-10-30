-- Fix: Move pg_net extension to extensions schema if it's in public
-- This fixes the security linter warning about extensions in public schema

-- First check if extension exists in public and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_net' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    DROP EXTENSION IF EXISTS pg_net;
  END IF;
END $$;

-- Create pg_net extension in extensions schema (correct location)
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;