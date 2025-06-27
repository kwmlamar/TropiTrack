-- Fix OAuth trigger with better error handling and debugging
-- This should resolve the "Database error saving new user" issue

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

  -- Check if companies table exists and has the right structure
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    RAISE EXCEPTION 'Companies table does not exist';
  END IF;

  -- Check if profiles table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE EXCEPTION 'Profiles table does not exist';
  END IF;

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
    INSERT INTO public.profiles (id, role, created_at, name, email, company_id)
    VALUES (new.id, 'admin', now(), user_name, user_email, new_company_id);
    
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

-- Ensure the trigger is attached to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON companies TO authenticated;
GRANT ALL ON profiles TO authenticated; 