-- Fix the create_trial_subscription function to resolve ambiguous column reference
-- This migration ensures the function is properly updated

CREATE OR REPLACE FUNCTION public.create_trial_subscription(
  user_id UUID,
  plan_slug TEXT,
  trial_days INTEGER DEFAULT 14
)
RETURNS TABLE (
  success BOOLEAN,
  subscription_id UUID,
  error_message TEXT
) AS $$
DECLARE
  company_id UUID;
  plan_id UUID;
  subscription_record RECORD;
  now_timestamp TIMESTAMP WITH TIME ZONE;
  trial_end TIMESTAMP WITH TIME ZONE;
  period_end TIMESTAMP WITH TIME ZONE;
  user_metadata JSONB;
BEGIN
  -- Set current timestamp
  now_timestamp := NOW();
  
  -- Get the user's company ID from user metadata first, then fallback to profiles
  SELECT raw_user_meta_data INTO user_metadata
  FROM auth.users
  WHERE id = create_trial_subscription.user_id;
  
  IF user_metadata IS NOT NULL AND user_metadata ? 'company_id' THEN
    company_id := (user_metadata->>'company_id')::UUID;
  ELSE
    -- Fallback to profiles table
    SELECT company_id INTO company_id
    FROM profiles
    WHERE user_id = create_trial_subscription.user_id;
  END IF;
  
  IF company_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Company not found for user'::TEXT;
    RETURN;
  END IF;
  
  -- Get the plan ID by slug
  SELECT id INTO plan_id
  FROM subscription_plans
  WHERE slug = plan_slug AND is_active = true;
  
  IF plan_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Plan not found or inactive'::TEXT;
    RETURN;
  END IF;
  
  -- Check if company already has an active subscription (FIXED: Added table alias)
  IF EXISTS (
    SELECT 1 FROM company_subscriptions cs
    WHERE cs.company_id = company_id 
    AND cs.status IN ('active', 'trialing')
  ) THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Company already has an active subscription'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate trial and period end dates
  trial_end := now_timestamp + (trial_days || ' days')::INTERVAL;
  period_end := now_timestamp + '30 days'::INTERVAL;
  
  -- Create the subscription
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
    company_id,
    plan_id,
    'trialing',
    'monthly',
    now_timestamp,
    period_end,
    now_timestamp,
    trial_end,
    jsonb_build_object(
      'created_by', user_id,
      'trial_type', 'free_trial',
      'plan_slug', plan_slug,
      'created_via', 'database_function'
    )
  ) RETURNING id INTO subscription_record;
  
  -- Return success
  RETURN QUERY SELECT true, subscription_record.id, 'Trial subscription created successfully'::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY SELECT false, NULL::UUID, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_trial_subscription(UUID, TEXT, INTEGER) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_trial_subscription(UUID, TEXT, INTEGER) IS 'Creates a trial subscription for a user. Returns success status, subscription ID, and error message if any.';
