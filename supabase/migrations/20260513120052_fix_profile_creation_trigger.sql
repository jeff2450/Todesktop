/*
  # Fix profile creation trigger and RLS policies

  1. Changes
    - Remove restrictive INSERT policy on profiles
    - Modify trigger to use proper error handling
    - Ensure profiles table can accept inserts from trigger without RLS blocking
    - Add UNIQUE constraint on user_id in user_roles to prevent duplicates

  2. Notes
    - INSERT policy is not needed since trigger runs as SECURITY DEFINER
    - SELECT and UPDATE policies remain for user data access
*/

-- Drop existing INSERT policy if it exists (it may be blocking the trigger)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Add unique constraint to user_roles if it doesn't exist (to prevent duplicate role assignments)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_roles' AND constraint_name = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name text;
  v_avatar_url text;
BEGIN
  -- Extract metadata safely
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, '');
  v_avatar_url := COALESCE(NEW.raw_user_meta_data->>'avatar_url', '');

  -- Insert profile
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (NEW.id, v_display_name, v_avatar_url)
  ON CONFLICT (id) DO NOTHING;

  -- Insert user role
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure trigger is properly set
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
