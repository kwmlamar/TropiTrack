-- Update subscription plans to match landing page features exactly
-- Migration: 20240340000000_update_subscription_plans.sql

-- Clear existing plans
DELETE FROM subscription_plans;

-- Insert updated plans based on landing page
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, is_popular, sort_order) VALUES
(
  'Starter',
  'starter',
  'Perfect for small crews',
  3900, -- $39.00
  37440, -- $39.00 * 12 * 0.8 (20% yearly discount)
  '["Up to 15 workers", "3 active projects", "Time tracking & approvals", "Basic payroll reports", "Mobile app access", "Email support"]',
  '{"workers": 15, "projects": 3, "storage_gb": 1, "api_calls_per_month": 1000, "document_management": false, "advanced_analytics": false, "equipment_tracking": false, "api_access": false, "multi_company": false, "priority_support": false}',
  false,
  1
),
(
  'Professional',
  'professional',
  'For growing companies',
  8900, -- $89.00
  85440, -- $89.00 * 12 * 0.8 (20% yearly discount)
  '["Up to 50 workers", "Unlimited projects", "Advanced payroll features", "Project cost tracking", "Document management", "Priority support"]',
  '{"workers": 50, "projects": -1, "storage_gb": 10, "api_calls_per_month": 10000, "document_management": true, "advanced_analytics": true, "equipment_tracking": false, "api_access": false, "multi_company": false, "priority_support": true}',
  true,
  2
),
(
  'Enterprise',
  'enterprise',
  'For large operations',
  17900, -- $179.00
  171840, -- $179.00 * 12 * 0.8 (20% yearly discount)
  '["Unlimited workers", "Multi-company access", "Advanced analytics", "Equipment tracking", "API access", "Dedicated support"]',
  '{"workers": -1, "projects": -1, "storage_gb": 100, "api_calls_per_month": 100000, "document_management": true, "advanced_analytics": true, "equipment_tracking": true, "api_access": true, "multi_company": true, "priority_support": true}',
  false,
  3
);

-- Add comments to explain the feature flags
COMMENT ON COLUMN subscription_plans.limits IS 'JSON object containing feature limits and flags. Boolean flags: document_management, advanced_analytics, equipment_tracking, api_access, multi_company, priority_support'; 