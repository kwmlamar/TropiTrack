-- Create function to create trial subscription for a user
-- This function can be called from triggers or with admin privileges

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
BEGIN
  -- Set current timestamp
  now_timestamp := NOW();
  
  -- Get the user's company ID
  SELECT company_id INTO company_id
  FROM profiles
  WHERE user_id = create_trial_subscription.user_id;
  
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
  
  -- Check if company already has an active subscription
  IF EXISTS (
    SELECT 1 FROM company_subscriptions 
    WHERE company_id = company_id 
    AND status IN ('active', 'trialing')
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
