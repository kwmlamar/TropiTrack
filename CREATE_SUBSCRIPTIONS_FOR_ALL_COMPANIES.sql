-- Create trial subscriptions for all companies that don't have active subscriptions
-- This script will create starter plan trial subscriptions for existing companies

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

-- Now create trial subscriptions for companies that don't have active subscriptions
-- We'll use the create_trial_subscription function for each company

-- Get the starter plan ID
DO $$
DECLARE
    starter_plan_id UUID;
    company_record RECORD;
    trial_result RECORD;
    admin_user_id UUID;
BEGIN
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
            -- Create trial subscription using the function
            SELECT * INTO trial_result
            FROM create_trial_subscription(admin_user_id, 'starter', 14);
            
            IF trial_result.success THEN
                RAISE NOTICE 'Successfully created trial subscription for company: % (ID: %)', company_record.name, company_record.id;
            ELSE
                RAISE NOTICE 'Failed to create trial subscription for company: % (ID: %) - Error: %', company_record.name, company_record.id, trial_result.error_message;
            END IF;
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
