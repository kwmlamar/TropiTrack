-- Add trial subscription creation directly to the handle_new_user trigger
-- This ensures trial subscriptions are created even if the function doesn't exist yet

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
  selected_plan TEXT;
  plan_id UUID;
  now_timestamp TIMESTAMP WITH TIME ZONE;
  trial_end TIMESTAMP WITH TIME ZONE;
  period_end TIMESTAMP WITH TIME ZONE;
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
    
    RETURN new;
  END IF;

  -- Extract company name from user metadata or use default (for new company signups)
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

  -- Create profile with company_id and all required fields
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

  -- Create trial subscription for new company signups
  BEGIN
    -- Get the selected plan from user metadata, default to 'starter'
    selected_plan := COALESCE(new.raw_user_meta_data->>'selected_plan', 'starter');
    RAISE NOTICE 'Selected plan: %', selected_plan;
    
    -- Get the plan ID
    SELECT id INTO plan_id
    FROM subscription_plans
    WHERE slug = selected_plan AND is_active = true;
    
    IF plan_id IS NULL THEN
      RAISE NOTICE 'Plan not found for slug: %, using starter as fallback', selected_plan;
      SELECT id INTO plan_id
      FROM subscription_plans
      WHERE slug = 'starter' AND is_active = true;
    END IF;
    
    IF plan_id IS NOT NULL THEN
      -- Set timestamps
      now_timestamp := NOW();
      trial_end := now_timestamp + INTERVAL '14 days';
      period_end := now_timestamp + INTERVAL '30 days';
      
      -- Check if company already has an active subscription
      IF NOT EXISTS (
        SELECT 1 FROM company_subscriptions 
        WHERE company_id = new_company_id 
        AND status IN ('active', 'trialing')
      ) THEN
        -- Create the trial subscription
        INSERT INTO company_subscriptions (
          company_id,
          plan_id,
          status,
          billing_cycle,
          current_period_start,
          current_period_end,
          trial_start,
          trial_end,
          metadata
        ) VALUES (
          new_company_id,
          plan_id,
          'trialing',
          'monthly',
          now_timestamp,
          period_end,
          now_timestamp,
          trial_end,
          jsonb_build_object(
            'created_by', new.id,
            'trial_type', 'free_trial',
            'plan_slug', selected_plan,
            'created_via', 'user_trigger'
          )
        );
        
        RAISE NOTICE 'Successfully created trial subscription for user: % with plan: %', new.id, selected_plan;
      ELSE
        RAISE NOTICE 'Company already has an active subscription, skipping trial creation';
      END IF;
    ELSE
      RAISE NOTICE 'No valid plan found, skipping trial subscription creation';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating trial subscription: %', SQLERRM;
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

-- Ensure the trigger is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comments for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Handles new user creation for both new company signups and invited users. Creates trial subscription automatically for new companies.';
