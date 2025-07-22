-- Fix infinite recursion issue with profiles table RLS
-- This migration addresses the circular dependency between get_user_company_id() and profiles RLS

-- ============================================================================
-- STEP 1: Create a bypass function for getting user company_id
-- ============================================================================
-- This function will bypass RLS when querying profiles
CREATE OR REPLACE FUNCTION get_user_company_id_safe()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  -- This function runs with SECURITY DEFINER to bypass RLS
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- STEP 2: Update the main get_user_company_id function to use the safe version
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  -- Use the safe function that bypasses RLS
  SELECT get_user_company_id_safe();
$$;

-- ============================================================================
-- STEP 3: Ensure profiles table has proper RLS policies
-- ============================================================================
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

-- Recreate policies with proper structure
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- STEP 4: Grant necessary permissions
-- ============================================================================
-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION get_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_company_id_safe() TO authenticated;

-- ============================================================================
-- STEP 5: Test the function (this will be commented out in production)
-- ============================================================================
-- Uncomment the following line to test the function (remove in production)
-- SELECT get_user_company_id(); 