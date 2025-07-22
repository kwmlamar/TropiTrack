-- Create core tables for user signup functionality
-- This migration establishes the foundational database structure

-- ============================================================================
-- STEP 1: Create companies table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  logo_url TEXT,
  industry TEXT,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);

-- Add comments
COMMENT ON TABLE companies IS 'Companies that users belong to';
COMMENT ON COLUMN companies.name IS 'Company name';
COMMENT ON COLUMN companies.email IS 'Primary company email';
COMMENT ON COLUMN companies.phone IS 'Company phone number';
COMMENT ON COLUMN companies.address IS 'Company address';
COMMENT ON COLUMN companies.website IS 'Company website URL';
COMMENT ON COLUMN companies.logo_url IS 'URL to company logo';
COMMENT ON COLUMN companies.industry IS 'Company industry';
COMMENT ON COLUMN companies.size IS 'Company size (small, medium, large)';

-- ============================================================================
-- STEP 2: Create profiles table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  phone TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Add comments
COMMENT ON TABLE profiles IS 'User profiles linked to auth.users';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN profiles.name IS 'User full name';
COMMENT ON COLUMN profiles.email IS 'User email address';
COMMENT ON COLUMN profiles.company_id IS 'Reference to the company this user belongs to';
COMMENT ON COLUMN profiles.role IS 'User role: admin, manager, or user';
COMMENT ON COLUMN profiles.phone IS 'User phone number';
COMMENT ON COLUMN profiles.bio IS 'User biography or description';
COMMENT ON COLUMN profiles.location IS 'User location or address';
COMMENT ON COLUMN profiles.website IS 'User website URL';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image';

-- ============================================================================
-- STEP 3: Create updated_at trigger function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Create triggers for updated_at
-- ============================================================================
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: Create user management function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_company_id UUID;
  user_name TEXT;
  company_name TEXT;
  user_email TEXT;
BEGIN
  -- Log the start of the trigger
  RAISE NOTICE 'handle_new_user trigger started for user: %', new.id;
  
  -- Get user email
  user_email := new.email;
  RAISE NOTICE 'User email: %', user_email;

  -- Extract name from user metadata or email
  user_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(user_email, '@', 1),
    'User'
  );
  RAISE NOTICE 'User name: %', user_name;

  -- Extract company name from user metadata or use default
  company_name := COALESCE(
    new.raw_user_meta_data->>'company_name',
    'My Company'
  );
  RAISE NOTICE 'Company name: %', company_name;

  -- Create a company for new users
  BEGIN
    INSERT INTO public.companies (name, email)
    VALUES (company_name, user_email)
    RETURNING id INTO new_company_id;
    
    RAISE NOTICE 'Successfully created company with ID: % for user: %', new_company_id, new.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating company: %', SQLERRM;
      RAISE;
  END;

  -- Create profile with company_id
  BEGIN
    INSERT INTO public.profiles (id, role, name, email, company_id)
    VALUES (new.id, 'admin', user_name, user_email, new_company_id);
    
    RAISE NOTICE 'Successfully created profile for user: % with company_id: %', new.id, new_company_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating profile: %', SQLERRM;
      RAISE;
  END;

  -- Update user metadata with company_id
  BEGIN
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('company_id', new_company_id, 'full_name', user_name)
    WHERE id = new.id;
    
    RAISE NOTICE 'Successfully updated user metadata for user: % with company_id: %', new.id, new_company_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error updating user metadata: %', SQLERRM;
      -- Don't raise here as the main operations succeeded
  END;

  RAISE NOTICE 'handle_new_user trigger completed successfully for user: %', new.id;
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors that occur
    RAISE NOTICE 'Error in handle_new_user trigger for user %: %', new.id, SQLERRM;
    -- Re-raise the error so the transaction is rolled back
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: Create trigger for new user creation
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 7: Create utility functions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- STEP 8: Enable Row Level Security
-- ============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: Create RLS Policies for companies
-- ============================================================================
-- Users can view their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update their own company
CREATE POLICY "Users can update own company" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- System can insert companies (for triggers)
CREATE POLICY "System can insert companies" ON companies
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- STEP 10: Create RLS Policies for profiles
-- ============================================================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- System can insert profiles (for triggers)
CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- Users can view profiles in their company
CREATE POLICY "Users can view company profiles" ON profiles
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 11: Grant permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON companies TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

-- ============================================================================
-- STEP 12: Create storage bucket for avatars
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  ); 