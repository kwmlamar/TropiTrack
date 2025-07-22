-- Down migration to revert the profiles RLS recursion fix

-- ============================================================================
-- STEP 1: Drop the safe function
-- ============================================================================
DROP FUNCTION IF EXISTS get_user_company_id_safe();

-- ============================================================================
-- STEP 2: Revert the main function to its original form
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- STEP 3: Drop the RLS policies on profiles
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

-- ============================================================================
-- STEP 4: Disable RLS on profiles table
-- ============================================================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY; 