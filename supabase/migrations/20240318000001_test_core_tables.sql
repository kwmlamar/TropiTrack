-- Test migration to verify core tables are working
-- This migration tests the basic functionality without affecting production data

-- ============================================================================
-- STEP 1: Test that tables exist and have correct structure
-- ============================================================================
DO $$
BEGIN
  -- Test companies table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    RAISE EXCEPTION 'Companies table does not exist';
  END IF;
  
  -- Test profiles table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE EXCEPTION 'Profiles table does not exist';
  END IF;
  
  -- Test that profiles has correct foreign key to companies
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
    AND constraint_name LIKE '%company_id%'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE EXCEPTION 'Profiles table missing foreign key to companies';
  END IF;
  
  RAISE NOTICE 'Core tables structure verified successfully';
END $$;

-- ============================================================================
-- STEP 2: Test that functions exist
-- ============================================================================
DO $$
BEGIN
  -- Test handle_new_user function
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE EXCEPTION 'handle_new_user function does not exist';
  END IF;
  
  -- Test get_user_company_id function
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_company_id') THEN
    RAISE EXCEPTION 'get_user_company_id function does not exist';
  END IF;
  
  RAISE NOTICE 'Core functions verified successfully';
END $$;

-- ============================================================================
-- STEP 3: Test that triggers exist
-- ============================================================================
DO $$
BEGIN
  -- Test auth.users trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    RAISE EXCEPTION 'on_auth_user_created trigger does not exist on auth.users';
  END IF;
  
  RAISE NOTICE 'Core triggers verified successfully';
END $$;

-- ============================================================================
-- STEP 4: Test that RLS is enabled
-- ============================================================================
DO $$
BEGIN
  -- Test companies RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'companies' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'Companies table RLS not enabled';
  END IF;
  
  -- Test profiles RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'Profiles table RLS not enabled';
  END IF;
  
  RAISE NOTICE 'RLS policies verified successfully';
END $$;

-- ============================================================================
-- STEP 5: Test storage bucket
-- ============================================================================
DO $$
BEGIN
  -- Test avatars bucket exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    RAISE EXCEPTION 'Avatars storage bucket does not exist';
  END IF;
  
  RAISE NOTICE 'Storage bucket verified successfully';
END $$;

-- ============================================================================
-- STEP 6: Log successful verification
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'All core tables, functions, triggers, and policies verified successfully!';
  RAISE NOTICE 'Database is ready for user signup functionality.';
END $$; 