-- Fix OAuth company creation by updating the handle_new_user trigger
-- This trigger will now create a company and profile for new OAuth users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_company_id UUID;
  user_name TEXT;
  company_name TEXT;
BEGIN
  -- Extract name from user metadata or email
  user_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'User'
  );

  -- Extract company name from user metadata or use default
  company_name := COALESCE(
    new.raw_user_meta_data->>'company_name',
    'My Company'
  );

  -- Create a company for new users
  INSERT INTO public.companies (name, email)
  VALUES (company_name, new.email)
  RETURNING id INTO new_company_id;

  -- Log the company creation for debugging
  RAISE NOTICE 'Created company with ID: % for user: %', new_company_id, new.id;

  -- Create profile with company_id
  INSERT INTO public.profiles (id, role, created_at, name, email, company_id)
  VALUES (new.id, 'admin', now(), user_name, new.email, new_company_id);

  -- Log the profile creation for debugging
  RAISE NOTICE 'Created profile for user: % with company_id: %', new.id, new_company_id;

  -- Update user metadata with company_id
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('company_id', new_company_id, 'full_name', user_name)
  WHERE id = new.id;

  -- Log the metadata update for debugging
  RAISE NOTICE 'Updated user metadata for user: % with company_id: %', new.id, new_company_id;

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