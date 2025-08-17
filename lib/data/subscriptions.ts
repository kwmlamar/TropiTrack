import { supabase } from "@/lib/supabaseClient";
import type { ApiResponse } from "@/lib/types";
import type {
  SubscriptionPlan,
  CompanySubscription,
  CompanySubscriptionWithPlan,
  BillingInvoice,
  UsageMetric,
  UsageMetricName,
  PaymentMethod,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
  CompanyUsage,
  UsageLimit,
  SubscriptionStatus,
  SubscriptionStatusInfo,
  FeatureFlags,
} from "@/lib/types/subscription";
import { getUserProfileWithCompany } from "@/lib/data/userProfiles";

// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================

export async function getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
  try {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching subscription plans:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as SubscriptionPlan[], error: null, success: true };
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return { data: null, error: "Failed to fetch subscription plans", success: false };
  }
}

export async function getSubscriptionPlan(slug: string): Promise<ApiResponse<SubscriptionPlan>> {
  try {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching subscription plan:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as SubscriptionPlan, error: null, success: true };
  } catch (error) {
    console.error("Error fetching subscription plan:", error);
    return { data: null, error: "Failed to fetch subscription plan", success: false };
  }
}

// ============================================================================
// COMPANY SUBSCRIPTIONS
// ============================================================================

export async function getCompanySubscription(): Promise<ApiResponse<CompanySubscriptionWithPlan>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false };
    }

    const { data, error } = await supabase
      .from("company_subscriptions")
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq("company_id", profile.company_id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching company subscription:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as CompanySubscriptionWithPlan, error: null, success: true };
  } catch (error) {
    console.error("Error fetching company subscription:", error);
    return { data: null, error: "Failed to fetch subscription", success: false };
  }
}

export async function createTrialSubscription(planSlug: string, trialDays: number = 14): Promise<ApiResponse<CompanySubscription>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false };
    }

    // Get the plan by slug
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("slug", planSlug)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      console.error("Error getting plan:", planError);
      return { data: null, error: "Plan not found", success: false };
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const subscriptionData = {
      company_id: profile.company_id,
      plan_id: plan.id,
      status: 'trialing',
      billing_cycle: 'monthly',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
      metadata: {
        created_by: profile.id,
        trial_type: 'free_trial',
        plan_slug: planSlug,
      },
    };

    const { data, error } = await supabase
      .from("company_subscriptions")
      .insert(subscriptionData)
      .select()
      .single();

    if (error) {
      console.error("Error creating trial subscription:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as CompanySubscription, error: null, success: true };
  } catch (error) {
    console.error("Error creating trial subscription:", error);
    return { data: null, error: "Failed to create trial subscription", success: false };
  }
}

export async function createTrialSubscriptionViaFunction(planSlug: string, trialDays: number = 14): Promise<ApiResponse<CompanySubscription>> {
  try {
    // Call the Supabase database function directly
    const { data, error } = await supabase
      .rpc('create_trial_subscription', {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        plan_slug: planSlug,
        trial_days: trialDays
      });

    if (error) {
      console.error("Error calling create_trial_subscription function:", error);
      return { data: null, error: error.message, success: false };
    }

    if (!data || data.length === 0) {
      return { data: null, error: "No result from trial subscription creation", success: false };
    }

    const result = data[0];
    
    if (!result.success) {
      return { data: null, error: result.error_message || "Failed to create trial subscription", success: false };
    }

    // Get the created subscription
    const { data: subscription, error: subError } = await supabase
      .from("company_subscriptions")
      .select("*")
      .eq("id", result.subscription_id)
      .single();

    if (subError) {
      console.error("Error fetching created subscription:", subError);
      return { data: null, error: subError.message, success: false };
    }

    return { data: subscription as CompanySubscription, error: null, success: true };
  } catch (error) {
    console.error("Error creating trial subscription via function:", error);
    return { data: null, error: "Failed to create trial subscription", success: false };
  }
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<ApiResponse<CompanySubscription>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false };
    }

    // Get the plan
    const planResult = await getSubscriptionPlan(input.plan_id);
    if (!planResult.success || !planResult.data) {
      return { data: null, error: "Plan not found", success: false };
    }

    const plan = planResult.data;
    const now = new Date();
    const trialEnd = input.trial_days ? new Date(now.getTime() + input.trial_days * 24 * 60 * 60 * 1000) : null;
    const periodEnd = new Date(now.getTime() + (input.billing_cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000);

    const subscriptionData = {
      company_id: profile.company_id,
      plan_id: plan.id,
      status: trialEnd ? 'trialing' : 'active',
      billing_cycle: input.billing_cycle,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_start: trialEnd ? now.toISOString() : null,
      trial_end: trialEnd ? trialEnd.toISOString() : null,
      metadata: {
        created_by: profile.id,
        payment_method_id: input.payment_method_id,
      },
    };

    const { data, error } = await supabase
      .from("company_subscriptions")
      .insert(subscriptionData)
      .select()
      .single();

    if (error) {
      console.error("Error creating subscription:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as CompanySubscription, error: null, success: true };
  } catch (error) {
    console.error("Error creating subscription:", error);
    return { data: null, error: "Failed to create subscription", success: false };
  }
}

export async function updateSubscription(input: UpdateSubscriptionInput): Promise<ApiResponse<CompanySubscription>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false };
    }

    // Get current subscription
    const currentSubscription = await getCompanySubscription();
    if (!currentSubscription.success || !currentSubscription.data) {
      return { data: null, error: "No active subscription found", success: false };
    }

    const updateData: Partial<CompanySubscription> = {};
    
    if (input.plan_id) updateData.plan_id = input.plan_id;
    if (input.billing_cycle) updateData.billing_cycle = input.billing_cycle;
    if (input.cancel_at_period_end !== undefined) {
      updateData.cancel_at_period_end = input.cancel_at_period_end;
      if (input.cancel_at_period_end) {
        updateData.canceled_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from("company_subscriptions")
      .update(updateData)
      .eq("id", currentSubscription.data.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subscription:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as CompanySubscription, error: null, success: true };
  } catch (error) {
    console.error("Error updating subscription:", error);
    return { data: null, error: "Failed to update subscription", success: false };
  }
}

export async function cancelSubscription(): Promise<ApiResponse<CompanySubscription>> {
  return updateSubscription({ cancel_at_period_end: true });
}

// ============================================================================
// BILLING INVOICES
// ============================================================================

export async function getBillingInvoices(): Promise<ApiResponse<BillingInvoice[]>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false };
    }

    const { data, error } = await supabase
      .from("billing_invoices")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching billing invoices:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as BillingInvoice[], error: null, success: true };
  } catch (error) {
    console.error("Error fetching billing invoices:", error);
    return { data: null, error: "Failed to fetch invoices", success: false };
  }
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

export async function getCompanyUsage(): Promise<ApiResponse<CompanyUsage>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false };
    }

    // Get current subscription to determine billing period
    const subscription = await getCompanySubscription();
    if (!subscription.success || !subscription.data) {
      return { data: null, error: "No active subscription found", success: false };
    }

    const periodStart = new Date(subscription.data.current_period_start);
    const periodEnd = new Date(subscription.data.current_period_end);

    // Get usage metrics for current period
    const { data: metrics, error } = await supabase
      .from("usage_metrics")
      .select("*")
      .eq("company_id", profile.company_id)
      .gte("metric_date", periodStart.toISOString().split('T')[0])
      .lte("metric_date", periodEnd.toISOString().split('T')[0]);

    if (error) {
      console.error("Error fetching usage metrics:", error);
      return { data: null, error: error.message, success: false };
    }

    // Aggregate metrics
    const aggregatedMetrics: Record<string, number> = {};
    (metrics as UsageMetric[]).forEach(metric => {
      aggregatedMetrics[metric.metric_name] = (aggregatedMetrics[metric.metric_name] || 0) + metric.metric_value;
    });

    // Get limits from plan
    const limits: UsageLimit[] = [];
    const planLimits = subscription.data.plan.limits;
    
    Object.entries(planLimits).forEach(([key, limit]) => {
      if (typeof limit === 'number') {
        if (limit !== undefined && limit !== -1) {
          limits.push({
            metric_name: key as UsageMetricName,
            limit,
            current_usage: aggregatedMetrics[key] || 0,
            is_unlimited: false,
          });
        } else if (limit === -1) {
          limits.push({
            metric_name: key as UsageMetricName,
            limit: 0,
            current_usage: aggregatedMetrics[key] || 0,
            is_unlimited: true,
          });
        }
      }
    });

    const usage: CompanyUsage = {
      company_id: profile.company_id,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      metrics: aggregatedMetrics,
      limits,
    };

    return { data: usage, error: null, success: true };
  } catch (error) {
    console.error("Error fetching company usage:", error);
    return { data: null, error: "Failed to fetch usage", success: false };
  }
}

export async function trackUsage(metricName: string, value: number = 1): Promise<ApiResponse<void>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false };
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Get current subscription for billing period
    const subscription = await getCompanySubscription();
    if (!subscription.success || !subscription.data) {
      return { data: null, error: "No active subscription found", success: false };
    }

    const periodStart = new Date(subscription.data.current_period_start);
    const periodEnd = new Date(subscription.data.current_period_end);

    // Upsert usage metric
    const { error } = await supabase
      .from("usage_metrics")
      .upsert({
        company_id: profile.company_id,
        metric_name: metricName,
        metric_value: value,
        metric_date: today,
        billing_period_start: periodStart.toISOString().split('T')[0],
        billing_period_end: periodEnd.toISOString().split('T')[0],
      }, {
        onConflict: 'company_id,metric_name,metric_date',
      });

    if (error) {
      console.error("Error tracking usage:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: null, error: null, success: true };
  } catch (error) {
    console.error("Error tracking usage:", error);
    return { data: null, error: "Failed to track usage", success: false };
  }
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

export async function getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false };
    }

    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payment methods:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as PaymentMethod[], error: null, success: true };
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return { data: null, error: "Failed to fetch payment methods", success: false };
  }
}

export async function createPaymentMethod(input: CreatePaymentMethodInput): Promise<ApiResponse<PaymentMethod>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false };
    }

    const paymentMethodData = {
      company_id: profile.company_id,
      stripe_payment_method_id: input.stripe_payment_method_id,
      is_default: input.is_default || false,
    };

    const { data, error } = await supabase
      .from("payment_methods")
      .insert(paymentMethodData)
      .select()
      .single();

    if (error) {
      console.error("Error creating payment method:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as PaymentMethod, error: null, success: true };
  } catch (error) {
    console.error("Error creating payment method:", error);
    return { data: null, error: "Failed to create payment method", success: false };
  }
}

export async function updatePaymentMethod(id: string, input: UpdatePaymentMethodInput): Promise<ApiResponse<PaymentMethod>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false };
    }

    const { data, error } = await supabase
      .from("payment_methods")
      .update(input)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating payment method:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data as PaymentMethod, error: null, success: true };
  } catch (error) {
    console.error("Error updating payment method:", error);
    return { data: null, error: "Failed to update payment method", success: false };
  }
}

export async function deletePaymentMethod(id: string): Promise<ApiResponse<void>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "Company ID not found", success: false };
    }

    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (error) {
      console.error("Error deleting payment method:", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: null, error: null, success: true };
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return { data: null, error: "Failed to delete payment method", success: false };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function getSubscriptionStatus(): Promise<ApiResponse<SubscriptionStatusInfo>> {
  try {
    const subscription = await getCompanySubscription();
    if (!subscription.success || !subscription.data) {
      return {
        data: {
          status: 'canceled' as const,
          is_active: false,
          is_trialing: false,
          is_past_due: false,
          days_until_renewal: 0,
          days_until_trial_end: 0,
          can_cancel: false,
          can_upgrade: false,
          can_downgrade: false,
        },
        error: null,
        success: true,
      };
    }

    const sub = subscription.data;
    const now = new Date();
    const periodEnd = new Date(sub.current_period_end);
    const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;

    const daysUntilRenewal = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilTrialEnd = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const statusInfo: SubscriptionStatusInfo = {
      status: sub.status as SubscriptionStatus,
      is_active: ['active', 'trialing'].includes(sub.status),
      is_trialing: sub.status === 'trialing',
      is_past_due: sub.status === 'past_due',
      days_until_renewal: Math.max(0, daysUntilRenewal),
      days_until_trial_end: Math.max(0, daysUntilTrialEnd),
      can_cancel: ['active', 'trialing'].includes(sub.status) && !sub.cancel_at_period_end,
      can_upgrade: ['active', 'trialing'].includes(sub.status),
      can_downgrade: ['active', 'trialing'].includes(sub.status),
    };

    return { data: statusInfo, error: null, success: true };
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return { data: null, error: "Failed to get subscription status", success: false };
  }
}

export async function getFeatureFlags(): Promise<ApiResponse<FeatureFlags>> {
  try {
    const subscription = await getCompanySubscription();
    if (!subscription.success || !subscription.data) {
      // Return default flags for no subscription - allow basic features with limits
      return {
        data: {
          can_add_workers: true,
          can_create_projects: true,
          can_use_biometrics: false,
          can_use_api: false,
          can_use_advanced_analytics: false,
          can_use_equipment_tracking: false,
          can_use_multi_company: false,
          can_use_priority_support: false,
          can_use_document_management: false,
          can_use_project_cost_tracking: false,
          can_use_advanced_payroll: false,
          can_use_unlimited_projects: false,
          can_use_dedicated_support: false,
          storage_limit_gb: 1,
          api_calls_limit: 100,
          workers_limit: 3,
          projects_limit: 2,
        },
        error: null,
        success: true,
      };
    }

    const plan = subscription.data.plan;
    const limits = plan.limits;

    const featureFlags: FeatureFlags = {
      can_add_workers: (limits.workers || 0) > 0 || limits.workers === -1,
      can_create_projects: (limits.projects || 0) > 0 || limits.projects === -1,
      can_use_biometrics: plan.slug !== 'starter',
      can_use_api: plan.slug === 'enterprise' || plan.slug === 'family',
      can_use_advanced_analytics: plan.slug !== 'starter',
      can_use_equipment_tracking: plan.slug === 'enterprise' || plan.slug === 'family',
      can_use_multi_company: plan.slug === 'enterprise' || plan.slug === 'family',
      can_use_priority_support: plan.slug !== 'starter',
      can_use_document_management: plan.slug !== 'starter',
      can_use_project_cost_tracking: plan.slug !== 'starter',
      can_use_advanced_payroll: plan.slug !== 'starter',
      can_use_unlimited_projects: plan.slug !== 'starter',
      can_use_dedicated_support: plan.slug === 'enterprise' || plan.slug === 'family',
      storage_limit_gb: typeof limits.storage_gb === 'number' ? limits.storage_gb : 0,
      api_calls_limit: typeof limits.api_calls_per_month === 'number' ? limits.api_calls_per_month : 0,
      workers_limit: typeof limits.workers === 'number' ? limits.workers : 0,
      projects_limit: typeof limits.projects === 'number' ? limits.projects : 0,
    };

    return { data: featureFlags, error: null, success: true };
  } catch (error) {
    console.error("Error getting feature flags:", error);
    return { data: null, error: "Failed to get feature flags", success: false };
  }
} 