-- Family Plan Setup for TropiTrack
-- Run this in your Supabase SQL Editor to add the family plan

-- Add the family plan with full access
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, is_popular, sort_order) VALUES
(
  'Family',
  'family',
  'Full access for family and friends',
  0, -- Free
  0, -- Free
  '["Unlimited workers", "Unlimited projects", "All advanced features", "Document management", "Advanced analytics", "Equipment tracking", "API access", "Multi-company access", "Priority support", "No limits"]',
  '{"workers": -1, "projects": -1, "storage_gb": -1, "api_calls_per_month": -1, "document_management": true, "advanced_analytics": true, "equipment_tracking": true, "api_access": true, "multi_company": true, "priority_support": true}',
  false,
  -1
);

-- Update sort order of existing plans (family plan goes first)
UPDATE subscription_plans SET sort_order = sort_order + 1 WHERE slug != 'family';

-- To assign the family plan to your brother, run this after he signs up:
-- (Replace 'brother@example.com' with his actual email)

-- First, find his company_id:
-- SELECT id FROM companies WHERE email = 'brother@example.com';

-- Then assign the family plan:
-- INSERT INTO company_subscriptions (
--   company_id,
--   plan_id,
--   status,
--   billing_cycle,
--   current_period_start,
--   current_period_end,
--   trial_end,
--   cancel_at_period_end,
--   canceled_at,
--   ended_at,
--   stripe_subscription_id,
--   stripe_customer_id
-- ) VALUES (
--   (SELECT id FROM companies WHERE email = 'brother@example.com'),
--   (SELECT id FROM subscription_plans WHERE slug = 'family'),
--   'active',
--   'monthly',
--   NOW(),
--   NOW() + INTERVAL '1 year',
--   NULL,
--   false,
--   NULL,
--   NULL,
--   NULL,
--   NULL
-- ); 