-- Add a family plan with full access for free
-- Migration: 20240340000002_add_family_plan.sql

-- Insert the family plan with full access
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