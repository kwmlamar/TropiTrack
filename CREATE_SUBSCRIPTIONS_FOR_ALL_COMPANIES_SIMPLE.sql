-- Create trial subscriptions for all companies that don't have active subscriptions
-- This script creates subscriptions directly without using the problematic function

-- First, let's see what companies exist and their current subscription status
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.email as company_email,
    cs.id as subscription_id,
    cs.status as subscription_status,
    sp.name as plan_name
FROM companies c
LEFT JOIN company_subscriptions cs ON c.id = cs.company_id AND cs.status IN ('active', 'trialing')
LEFT JOIN subscription_plans sp ON cs.plan_id = sp.id
ORDER BY c.created_at;

-- Create trial subscriptions directly for companies that don't have active subscriptions
DO $$
DECLARE
    starter_plan_id UUID;
    company_record RECORD;
    admin_user_id UUID;
    now_timestamp TIMESTAMP WITH TIME ZONE;
    trial_end TIMESTAMP WITH TIME ZONE;
    period_end TIMESTAMP WITH TIME ZONE;
    subscription_id UUID;
BEGIN
    -- Set current timestamp
    now_timestamp := NOW();
    
    -- Get the starter plan ID
    SELECT id INTO starter_plan_id
    FROM subscription_plans
    WHERE slug = 'starter' AND is_active = true;
    
    IF starter_plan_id IS NULL THEN
        RAISE EXCEPTION 'Starter plan not found';
    END IF;
    
    RAISE NOTICE 'Found starter plan with ID: %', starter_plan_id;
    
    -- Loop through all companies that don't have active subscriptions
    FOR company_record IN 
        SELECT DISTINCT c.id, c.name
        FROM companies c
        WHERE NOT EXISTS (
            SELECT 1 FROM company_subscriptions cs
            WHERE cs.company_id = c.id 
            AND cs.status IN ('active', 'trialing')
        )
    LOOP
        -- Get the admin user for this company
        SELECT user_id INTO admin_user_id
        FROM profiles
        WHERE company_id = company_record.id AND role = 'admin'
        LIMIT 1;
        
        IF admin_user_id IS NOT NULL THEN
            -- Calculate trial and period end dates
            trial_end := now_timestamp + INTERVAL '14 days';
            period_end := now_timestamp + INTERVAL '30 days';
            
            -- Create subscription directly
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
                company_record.id,
                starter_plan_id,
                'trialing',
                'monthly',
                now_timestamp,
                period_end,
                now_timestamp,
                trial_end,
                jsonb_build_object(
                    'created_by', admin_user_id,
                    'trial_type', 'free_trial',
                    'plan_slug', 'starter',
                    'created_via', 'manual_script'
                )
            ) RETURNING id INTO subscription_id;
            
            RAISE NOTICE 'Successfully created trial subscription for company: % (ID: %) with subscription ID: %', company_record.name, company_record.id, subscription_id;
        ELSE
            RAISE NOTICE 'No admin user found for company: % (ID: %)', company_record.name, company_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Subscription creation process completed';
END $$;

-- Verify the results
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.email as company_email,
    cs.id as subscription_id,
    cs.status as subscription_status,
    cs.trial_start,
    cs.trial_end,
    sp.name as plan_name,
    sp.slug as plan_slug
FROM companies c
LEFT JOIN company_subscriptions cs ON c.id = cs.company_id AND cs.status IN ('active', 'trialing')
LEFT JOIN subscription_plans sp ON cs.plan_id = sp.id
ORDER BY c.created_at;
