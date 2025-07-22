// Subscription and billing types for TropiTrack

export type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price_monthly: number; // in cents
  price_yearly: number; // in cents
  currency: string;
  features: string[];
  limits: {
    workers?: number;
    projects?: number;
    storage_gb?: number;
    api_calls_per_month?: number;
    // Feature flags based on landing page
    document_management?: boolean;
    advanced_analytics?: boolean;
    equipment_tracking?: boolean;
    api_access?: boolean;
    multi_company?: boolean;
    priority_support?: boolean;
    [key: string]: number | boolean | undefined;
  };
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CompanySubscription = {
  id: string;
  company_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CompanySubscriptionWithPlan = CompanySubscription & {
  plan: SubscriptionPlan;
};

export type BillingInvoice = {
  id: string;
  company_id: string;
  subscription_id?: string;
  invoice_number: string;
  amount: number; // in cents
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  billing_reason?: 'subscription_cycle' | 'subscription_create' | 'subscription_update' | 'subscription_threshold' | 'manual' | 'upcoming';
  period_start?: string;
  period_end?: string;
  due_date?: string;
  paid_at?: string;
  stripe_invoice_id?: string;
  stripe_payment_intent_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type UsageMetric = {
  id: string;
  company_id: string;
  metric_name: string;
  metric_value: number;
  metric_date: string;
  billing_period_start: string;
  billing_period_end: string;
  created_at: string;
  updated_at: string;
};

export type PaymentMethod = {
  id: string;
  company_id: string;
  stripe_payment_method_id: string;
  type: 'card' | 'bank_account' | 'sepa_debit';
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

// API Response types
export type CreateSubscriptionInput = {
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  payment_method_id?: string;
  trial_days?: number;
};

export type UpdateSubscriptionInput = {
  plan_id?: string;
  billing_cycle?: 'monthly' | 'yearly';
  cancel_at_period_end?: boolean;
};

export type CreatePaymentMethodInput = {
  stripe_payment_method_id: string;
  is_default?: boolean;
};

export type UpdatePaymentMethodInput = {
  is_default?: boolean;
  is_active?: boolean;
};

// Usage tracking types
export type UsageMetricName = 
  | 'workers_count'
  | 'projects_count'
  | 'timesheets_count'
  | 'payroll_records_count'
  | 'storage_bytes'
  | 'api_calls'
  | 'biometric_enrollments'
  | 'qr_scans';

export type UsageLimit = {
  metric_name: UsageMetricName;
  limit: number;
  current_usage: number;
  is_unlimited: boolean;
};

export type CompanyUsage = {
  company_id: string;
  period_start: string;
  period_end: string;
  metrics: Record<UsageMetricName, number>;
  limits: UsageLimit[];
};

// Billing cycle types
export type BillingCycle = 'monthly' | 'yearly';

export type PricingDisplay = {
  monthly: number;
  yearly: number;
  yearly_savings: number;
  currency: string;
};

// Subscription status helpers
export type SubscriptionStatus = 
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired';

export type SubscriptionStatusInfo = {
  status: SubscriptionStatus;
  is_active: boolean;
  is_trialing: boolean;
  is_past_due: boolean;
  days_until_renewal: number;
  days_until_trial_end: number;
  can_cancel: boolean;
  can_upgrade: boolean;
  can_downgrade: boolean;
};

// Invoice status helpers
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export type InvoiceStatusInfo = {
  status: InvoiceStatus;
  is_paid: boolean;
  is_overdue: boolean;
  days_overdue: number;
  can_pay: boolean;
  can_void: boolean;
};

// Payment processing types
export type PaymentIntent = {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret?: string;
  payment_method_types: string[];
  created_at: string;
};

export type PaymentMethodSetup = {
  payment_method_id: string;
  client_secret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded';
};

// Webhook event types
export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: unknown;
  };
  created: number;
  livemode: boolean;
};

export type WebhookHandler = {
  event: string;
  handler: (event: StripeWebhookEvent) => Promise<void>;
};

// Subscription analytics types
export type SubscriptionAnalytics = {
  total_subscriptions: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  canceled_subscriptions: number;
  monthly_revenue: number;
  yearly_revenue: number;
  average_subscription_value: number;
  churn_rate: number;
  trial_conversion_rate: number;
  plan_distribution: Record<string, number>;
};

// Feature flags based on subscription
export type FeatureFlags = {
  can_add_workers: boolean;
  can_create_projects: boolean;
  can_use_biometrics: boolean;
  can_use_api: boolean;
  can_use_advanced_analytics: boolean;
  can_use_equipment_tracking: boolean;
  can_use_multi_company: boolean;
  can_use_priority_support: boolean;
  can_use_document_management: boolean;
  storage_limit_gb: number;
  api_calls_limit: number;
  workers_limit: number;
  projects_limit: number;
  // New feature flags based on landing page
  can_use_project_cost_tracking: boolean;
  can_use_advanced_payroll: boolean;
  can_use_unlimited_projects: boolean;
  can_use_dedicated_support: boolean;
};

// Error types
export type SubscriptionError = 
  | 'plan_not_found'
  | 'subscription_already_exists'
  | 'payment_method_required'
  | 'payment_failed'
  | 'limit_exceeded'
  | 'trial_expired'
  | 'subscription_canceled'
  | 'invalid_billing_cycle'
  | 'stripe_error';

export type SubscriptionErrorInfo = {
  error: SubscriptionError;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}; 