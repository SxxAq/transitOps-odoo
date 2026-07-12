-- TransitOps Database Fix
-- Run this ENTIRE script in Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor → Paste → Run

-- Step 1: Remove the broken trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 2: Fix profiles constraint to allow NULL
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('fleet_manager', 'driver', 'safety_officer', 'financial_analyst'));

-- Step 3: Add insert policy so app can create profiles
DO $$ BEGIN
  CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 4: Verify - should show is_nullable = YES
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'role';
