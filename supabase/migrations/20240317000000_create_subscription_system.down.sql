-- Down migration for subscription and billing system
-- This will clean up all the tables, functions, and policies created

-- ============================================================================
-- STEP 1: Drop triggers
-- ============================================================================
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
DROP TRIGGER IF EXISTS update_company_subscriptions_updated_at ON company_subscriptions;
DROP TRIGGER IF EXISTS update_billing_invoices_updated_at ON billing_invoices;
DROP TRIGGER IF EXISTS update_usage_metrics_updated_at ON usage_metrics;
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;

-- ============================================================================
-- STEP 2: Drop functions
-- ============================================================================
DROP FUNCTION IF EXISTS get_company_subscription(UUID);
DROP FUNCTION IF EXISTS has_active_subscription(UUID);
DROP FUNCTION IF EXISTS get_company_usage(UUID, TEXT, DATE, DATE);

-- ============================================================================
-- STEP 3: Drop RLS policies for payment_methods
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own company payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert own company payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update own company payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete own company payment methods" ON payment_methods;

-- ============================================================================
-- STEP 4: Drop RLS policies for usage_metrics
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own company usage" ON usage_metrics;
DROP POLICY IF EXISTS "System can insert usage metrics" ON usage_metrics;
DROP POLICY IF EXISTS "System can update usage metrics" ON usage_metrics;

-- ============================================================================
-- STEP 5: Drop RLS policies for billing_invoices
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own company invoices" ON billing_invoices;
DROP POLICY IF EXISTS "System can insert billing invoices" ON billing_invoices;
DROP POLICY IF EXISTS "System can update billing invoices" ON billing_invoices;

-- ============================================================================
-- STEP 6: Drop RLS policies for company_subscriptions
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own company subscription" ON company_subscriptions;
DROP POLICY IF EXISTS "Users can update own company subscription" ON company_subscriptions;
DROP POLICY IF EXISTS "System can insert company subscriptions" ON company_subscriptions;

-- ============================================================================
-- STEP 7: Drop RLS policies for subscription_plans
-- ============================================================================
DROP POLICY IF EXISTS "Users can view subscription plans" ON subscription_plans;

-- ============================================================================
-- STEP 8: Drop tables (in correct order due to foreign keys)
-- ============================================================================
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS usage_metrics CASCADE;
DROP TABLE IF EXISTS billing_invoices CASCADE;
DROP TABLE IF EXISTS company_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- ============================================================================
-- STEP 9: Drop indexes (they will be dropped with tables, but being explicit)
-- ============================================================================
-- Indexes are automatically dropped when tables are dropped 