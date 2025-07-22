-- Down migration for core tables
-- This will clean up all the tables, functions, and policies created

-- ============================================================================
-- STEP 1: Drop storage policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- ============================================================================
-- STEP 2: Drop storage bucket
-- ============================================================================
DELETE FROM storage.buckets WHERE id = 'avatars';

-- ============================================================================
-- STEP 3: Drop triggers
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- ============================================================================
-- STEP 4: Drop functions
-- ============================================================================
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_company_id();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- ============================================================================
-- STEP 5: Drop RLS policies for profiles
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view company profiles" ON profiles;

-- ============================================================================
-- STEP 6: Drop RLS policies for companies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own company" ON companies;
DROP POLICY IF EXISTS "Users can update own company" ON companies;
DROP POLICY IF EXISTS "System can insert companies" ON companies;

-- ============================================================================
-- STEP 7: Drop tables (in correct order due to foreign keys)
-- ============================================================================
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- ============================================================================
-- STEP 8: Drop indexes (they will be dropped with tables, but being explicit)
-- ============================================================================
-- Indexes are automatically dropped when tables are dropped 