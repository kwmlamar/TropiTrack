-- Add a free plan for family/friends
-- Migration: 20240340000001_add_free_plan.sql

-- Insert the free plan
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, is_popular, sort_order) VALUES
(
  'Free',
  'free',
  'For family and friends',
  0, -- Free
  0, -- Free
  '["Up to 5 workers", "2 active projects", "Basic time tracking", "Basic reports", "Mobile app access", "Community support"]',
  '{"workers": 5, "projects": 2, "storage_gb": 0.5, "api_calls_per_month": 100, "document_management": false, "advanced_analytics": false, "equipment_tracking": false, "api_access": false, "multi_company": false, "priority_support": false}',
  false,
  0
);

-- Update sort order of existing plans
UPDATE subscription_plans SET sort_order = sort_order + 1 WHERE slug != 'free'; 