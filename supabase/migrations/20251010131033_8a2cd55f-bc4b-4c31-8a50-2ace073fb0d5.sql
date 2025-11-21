-- Fix email exposure vulnerability by making email visible only to profile owner
-- Remove the email column from profiles table since it's redundant with auth.users.email
-- Applications should use auth.users.email for the authenticated user's email

-- First, drop existing policies that might reference email
DROP POLICY IF EXISTS "Users can view group members profiles" ON public.profiles;

-- Recreate the policy without exposing email - only allow viewing basic profile info
CREATE POLICY "Users can view group members profiles" ON public.profiles
  FOR SELECT 
  USING (
    id IN (
      -- Members in same expense groups
      SELECT DISTINCT egm2.user_id
      FROM expense_group_members egm1
      JOIN expense_group_members egm2 ON egm1.group_id = egm2.group_id
      WHERE egm1.user_id = auth.uid()
      
      UNION
      
      -- Members in same challenges
      SELECT DISTINCT cp2.user_id
      FROM challenge_participants cp1
      JOIN challenge_participants cp2 ON cp1.challenge_id = cp2.challenge_id
      WHERE cp1.user_id = auth.uid()
    )
  );

-- Remove email column from profiles table entirely
-- Email should be accessed via auth.users for the current user only
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update the handle_new_user function to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;