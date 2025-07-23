-- Add Family Plan to subscription_plans
-- Migration: 20240341000000_add_family_plan.sql

-- Insert the Family plan
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, is_popular, sort_order) VALUES
(
  'Family',
  'family',
  'Free access for family and friends',
  0, -- Free
  0, -- Free
  '["Unlimited workers", "Unlimited projects", "All advanced features", "Document management", "Advanced analytics", "Equipment tracking", "API access", "Multi-company access", "Priority support", "Unlimited storage", "Unlimited API calls"]',
  '{"workers": -1, "projects": -1, "storage_gb": -1, "api_calls_per_month": -1, "document_management": true, "advanced_analytics": true, "equipment_tracking": true, "api_access": true, "multi_company": true, "priority_support": true}',
  false,
  4
);

-- Add comment to explain the family plan
COMMENT ON COLUMN subscription_plans.limits IS 'JSON object containing feature limits and flags. Boolean flags: document_management, advanced_analytics, equipment_tracking, api_access, multi_company, priority_support. Family plan has unlimited access to all features.'; 