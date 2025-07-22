-- Create comprehensive subscription and billing system
-- This migration establishes the foundation for subscription management

-- ============================================================================
-- STEP 1: Create subscription plans table
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for subscription_plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON subscription_plans(sort_order);

-- Add comments
COMMENT ON TABLE subscription_plans IS 'Available subscription plans';
COMMENT ON COLUMN subscription_plans.name IS 'Display name of the plan';
COMMENT ON COLUMN subscription_plans.slug IS 'Unique identifier for the plan';
COMMENT ON COLUMN subscription_plans.price_monthly IS 'Monthly price in cents';
COMMENT ON COLUMN subscription_plans.price_yearly IS 'Yearly price in cents';
COMMENT ON COLUMN subscription_plans.features IS 'JSON array of feature descriptions';
COMMENT ON COLUMN subscription_plans.limits IS 'JSON object of usage limits';

-- ============================================================================
-- STEP 2: Create company subscriptions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for company_subscriptions
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company_id ON company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status ON company_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_stripe_id ON company_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_period_end ON company_subscriptions(current_period_end);

-- Add comments
COMMENT ON TABLE company_subscriptions IS 'Company subscription records';
COMMENT ON COLUMN company_subscriptions.status IS 'Current subscription status';
COMMENT ON COLUMN company_subscriptions.billing_cycle IS 'Billing frequency';
COMMENT ON COLUMN company_subscriptions.current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN company_subscriptions.current_period_end IS 'End of current billing period';
COMMENT ON COLUMN company_subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';
COMMENT ON COLUMN company_subscriptions.stripe_subscription_id IS 'Stripe subscription ID for payment processing';

-- ============================================================================
-- STEP 3: Create billing invoices table
-- ============================================================================
CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES company_subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  billing_reason TEXT CHECK (billing_reason IN ('subscription_cycle', 'subscription_create', 'subscription_update', 'subscription_threshold', 'manual', 'upcoming')),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for billing_invoices
CREATE INDEX IF NOT EXISTS idx_billing_invoices_company_id ON billing_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_stripe_id ON billing_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_due_date ON billing_invoices(due_date);

-- Add comments
COMMENT ON TABLE billing_invoices IS 'Billing invoices for subscriptions';
COMMENT ON COLUMN billing_invoices.invoice_number IS 'Unique invoice number';
COMMENT ON COLUMN billing_invoices.amount IS 'Invoice amount in cents';
COMMENT ON COLUMN billing_invoices.status IS 'Current invoice status';
COMMENT ON COLUMN billing_invoices.billing_reason IS 'Reason for invoice generation';

-- ============================================================================
-- STEP 4: Create usage tracking table
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value INTEGER NOT NULL DEFAULT 0,
  metric_date DATE NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, metric_name, metric_date)
);

-- Add indexes for usage_metrics
CREATE INDEX IF NOT EXISTS idx_usage_metrics_company_id ON usage_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_name ON usage_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_date ON usage_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_period ON usage_metrics(billing_period_start, billing_period_end);

-- Add comments
COMMENT ON TABLE usage_metrics IS 'Usage tracking for billing and limits';
COMMENT ON COLUMN usage_metrics.metric_name IS 'Name of the metric being tracked';
COMMENT ON COLUMN usage_metrics.metric_value IS 'Value of the metric for the date';
COMMENT ON COLUMN usage_metrics.metric_date IS 'Date for which the metric is recorded';

-- ============================================================================
-- STEP 5: Create payment methods table
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account', 'sepa_debit')),
  brand TEXT,
  last4 TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_company_id ON payment_methods(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(is_default);

-- Add comments
COMMENT ON TABLE payment_methods IS 'Payment methods for companies';
COMMENT ON COLUMN payment_methods.stripe_payment_method_id IS 'Stripe payment method ID';
COMMENT ON COLUMN payment_methods.type IS 'Type of payment method';
COMMENT ON COLUMN payment_methods.brand IS 'Card brand (Visa, Mastercard, etc.)';
COMMENT ON COLUMN payment_methods.last4 IS 'Last 4 digits of card/account';

-- ============================================================================
-- STEP 6: Create updated_at trigger function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Create triggers for updated_at
-- ============================================================================
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_subscriptions_updated_at
  BEFORE UPDATE ON company_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_invoices_updated_at
  BEFORE UPDATE ON billing_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_metrics_updated_at
  BEFORE UPDATE ON usage_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: Create utility functions
-- ============================================================================
-- Function to get current subscription for a company
CREATE OR REPLACE FUNCTION get_company_subscription(company_uuid UUID)
RETURNS TABLE (
  id UUID,
  plan_id UUID,
  plan_name TEXT,
  plan_slug TEXT,
  status TEXT,
  billing_cycle TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN,
  trial_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.plan_id,
    sp.name as plan_name,
    sp.slug as plan_slug,
    cs.status,
    cs.billing_cycle,
    cs.current_period_start,
    cs.current_period_end,
    cs.cancel_at_period_end,
    cs.trial_end
  FROM company_subscriptions cs
  JOIN subscription_plans sp ON cs.plan_id = sp.id
  WHERE cs.company_id = company_uuid
  AND cs.status IN ('active', 'trialing')
  ORDER BY cs.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if company has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(company_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM company_subscriptions 
    WHERE company_id = company_uuid 
    AND status IN ('active', 'trialing')
    AND (trial_end IS NULL OR trial_end > NOW())
  ) INTO subscription_exists;
  
  RETURN subscription_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get usage for a company
CREATE OR REPLACE FUNCTION get_company_usage(company_uuid UUID, metric_name TEXT, period_start DATE, period_end DATE)
RETURNS INTEGER AS $$
DECLARE
  total_usage INTEGER;
BEGIN
  SELECT COALESCE(SUM(metric_value), 0)
  FROM usage_metrics
  WHERE company_id = company_uuid
  AND metric_name = get_company_usage.metric_name
  AND metric_date BETWEEN period_start AND period_end
  INTO total_usage;
  
  RETURN total_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 9: Enable Row Level Security
-- ============================================================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 10: Create RLS Policies
-- ============================================================================
-- Subscription plans (read-only for all authenticated users)
CREATE POLICY "Users can view subscription plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Company subscriptions
CREATE POLICY "Users can view own company subscription" ON company_subscriptions
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company subscription" ON company_subscriptions
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert company subscriptions" ON company_subscriptions
  FOR INSERT WITH CHECK (true);

-- Billing invoices
CREATE POLICY "Users can view own company invoices" ON billing_invoices
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert billing invoices" ON billing_invoices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update billing invoices" ON billing_invoices
  FOR UPDATE USING (true);

-- Usage metrics
CREATE POLICY "Users can view own company usage" ON usage_metrics
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert usage metrics" ON usage_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update usage metrics" ON usage_metrics
  FOR UPDATE USING (true);

-- Payment methods
CREATE POLICY "Users can view own company payment methods" ON payment_methods
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own company payment methods" ON payment_methods
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company payment methods" ON payment_methods
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own company payment methods" ON payment_methods
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 11: Grant permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON subscription_plans TO authenticated;
GRANT ALL ON company_subscriptions TO authenticated;
GRANT ALL ON billing_invoices TO authenticated;
GRANT ALL ON usage_metrics TO authenticated;
GRANT ALL ON payment_methods TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_usage(UUID, TEXT, DATE, DATE) TO authenticated;

-- ============================================================================
-- STEP 12: Insert default subscription plans
-- ============================================================================
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, is_popular, sort_order) VALUES
(
  'Starter',
  'starter',
  'Perfect for small crews',
  3900, -- $39.00
  37440, -- $39.00 * 12 * 0.8 (20% yearly discount)
  '["Up to 10 workers", "Basic timesheet tracking", "QR code clock-in", "Payroll calculations", "Project management", "Mobile app access"]',
  '{"workers": 10, "projects": 5, "storage_gb": 1, "api_calls_per_month": 1000}',
  false,
  1
),
(
  'Professional',
  'professional',
  'For growing companies',
  8900, -- $89.00
  85440, -- $89.00 * 12 * 0.8 (20% yearly discount)
  '["Up to 50 workers", "Advanced timesheet features", "Biometric authentication", "Advanced payroll", "Project analytics", "Team management", "Priority support"]',
  '{"workers": 50, "projects": 20, "storage_gb": 10, "api_calls_per_month": 10000}',
  true,
  2
),
(
  'Enterprise',
  'enterprise',
  'For large operations',
  17900, -- $179.00
  171840, -- $179.00 * 12 * 0.8 (20% yearly discount)
  '["Unlimited workers", "Multi-company access", "Advanced analytics", "Equipment tracking", "API access", "Custom integrations", "Dedicated support"]',
  '{"workers": -1, "projects": -1, "storage_gb": 100, "api_calls_per_month": 100000}',
  false,
  3
); 