-- Remove subscription creation from handle_new_user trigger
-- Subscription creation is now handled manually in the auth action

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_company_id UUID;
  user_name TEXT;
  company_name TEXT;
  user_email TEXT;
  existing_company_id UUID;
  first_name TEXT;
  last_name TEXT;
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

  -- Extract first and last name from user metadata or split full name
  first_name := COALESCE(
    new.raw_user_meta_data->>'first_name',
    split_part(user_name, ' ', 1)
  );
  
  last_name := COALESCE(
    new.raw_user_meta_data->>'last_name',
    CASE 
      WHEN array_length(string_to_array(user_name, ' '), 1) > 1 
      THEN substring(user_name from position(' ' in user_name) + 1)
      ELSE ''
    END
  );
  
  RAISE NOTICE 'First name: %, Last name: %', first_name, last_name;

  -- Check if user already has a company_id (invited user)
  existing_company_id := (new.raw_user_meta_data->>'company_id')::UUID;
  
  IF existing_company_id IS NOT NULL THEN
    -- User is joining an existing company (invited user)
    RAISE NOTICE 'User is joining existing company: %', existing_company_id;
    
    -- Create profile for invited user with all required fields
    BEGIN
      INSERT INTO public.profiles (
        id,
        user_id,
        email,
        name,
        first_name,
        last_name,
        company_id,
        role,
        is_active,
        onboarding_completed,
        created_at,
        updated_at
      )
      VALUES (
        new.id,
        new.id,
        user_email,
        user_name,
        first_name,
        last_name,
        existing_company_id,
        COALESCE(new.raw_user_meta_data->>'role', 'worker'),
        true,
        false,
        now(),
        now()
      );
      
      RAISE NOTICE 'Successfully created profile for invited user: % with company_id: %', new.id, existing_company_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error creating profile for invited user: %', SQLERRM;
        RAISE;
    END;
    
    -- Update user metadata (keep existing company_id)
    BEGIN
      UPDATE auth.users 
      SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
          jsonb_build_object('full_name', user_name, 'first_name', first_name, 'last_name', last_name)
      WHERE id = new.id;
      
      RAISE NOTICE 'Successfully updated user metadata for invited user: %', new.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error updating user metadata for invited user: %', SQLERRM;
        -- Don't raise here as the main operations succeeded
    END;
    
  ELSE
    -- User is creating a new company
    RAISE NOTICE 'User is creating new company';
    
    -- Generate new company ID
    new_company_id := gen_random_uuid();
    
    -- Extract company name from user metadata
    company_name := COALESCE(
      new.raw_user_meta_data->>'company_name',
      'My Company'
    );
    
    -- Create the company
    BEGIN
      INSERT INTO public.companies (
        id,
        name,
        email,
        created_at,
        updated_at
      )
      VALUES (
        new_company_id,
        company_name,
        user_email,
        now(),
        now()
      );
      
      RAISE NOTICE 'Successfully created company: % with ID: %', company_name, new_company_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error creating company: %', SQLERRM;
        RAISE;
    END;

    -- Create the user profile
    BEGIN
      INSERT INTO public.profiles (
        id,
        user_id,
        email,
        name,
        first_name,
        last_name,
        company_id,
        role,
        is_active,
        onboarding_completed,
        created_at,
        updated_at
      )
      VALUES (
        new.id,
        new.id,
        user_email,
        user_name,
        first_name,
        last_name,
        new_company_id,
        'admin',
        true,
        false,
        now(),
        now()
      );
      
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
          jsonb_build_object(
            'company_id', new_company_id, 
            'full_name', user_name,
            'first_name', first_name,
            'last_name', last_name
          )
      WHERE id = new.id;
      
      RAISE NOTICE 'Successfully updated user metadata for user: % with company_id: %', new.id, new_company_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error updating user metadata: %', SQLERRM;
        -- Don't raise here as the main operations succeeded
    END;
  END IF;

  -- Subscription creation is now handled manually in the auth action
  -- This prevents conflicts and ensures reliable subscription creation
  RAISE NOTICE 'Subscription creation will be handled by auth action for user: %', new.id;

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

-- Ensure the trigger is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Handles new user creation for both new company signups and invited users. Subscription creation is handled manually in the auth action.';
