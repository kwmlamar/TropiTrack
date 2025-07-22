# TropiTrack Tiered Plan Setup Guide

This guide shows you how to set up and implement the tiered subscription plan system inside your TropiTrack app based on the features shown on the landing page.

## 🎯 **Overview**

The tiered plan system is already implemented in your database and includes three plans:

### **Starter Plan ($39/month)**
- Up to 15 workers
- 3 active projects
- Time tracking & approvals
- Basic payroll reports
- Mobile app access
- Email support

### **Professional Plan ($89/month)**
- Up to 50 workers
- Unlimited projects
- Advanced payroll features
- Project cost tracking
- Document management
- Priority support

### **Enterprise Plan ($179/month)**
- Unlimited workers
- Multi-company access
- Advanced analytics
- Equipment tracking
- API access
- Dedicated support

## 🗄️ **Database Setup**

### **1. Run the Migration**

First, run the subscription system migration if you haven't already:

```sql
-- Run this in your Supabase SQL Editor
-- File: supabase/migrations/20240317000000_create_subscription_system.sql
```

### **2. Update Subscription Plans**

Run this migration to update the plans to match your landing page exactly:

```sql
-- Update subscription plans to match landing page features
-- File: supabase/migrations/20240340000000_update_subscription_plans.sql

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
```

## 🔧 **Implementation Steps**

### **Step 1: Create Subscription Management Components**

Create a subscription management page:

```typescript
// app/dashboard/settings/subscription/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { getCompanySubscription, getSubscriptionStatus, getFeatureFlags } from "@/lib/data/subscriptions";
import type { SubscriptionPlan, FeatureFlags } from "@/lib/types/subscription";

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const [subResult, statusResult, flagsResult] = await Promise.all([
        getCompanySubscription(),
        getSubscriptionStatus(),
        getFeatureFlags()
      ]);

      if (subResult.success) setSubscription(subResult.data);
      if (statusResult.success) setStatus(statusResult.data);
      if (flagsResult.success) setFeatureFlags(flagsResult.data);
    } catch (error) {
      console.error("Error loading subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing settings
        </p>
      </div>

      {/* Current Plan */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your current subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{subscription.plan.name}</h3>
                  <p className="text-muted-foreground">{subscription.plan.description}</p>
                </div>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Billing Cycle</p>
                  <p className="text-sm text-muted-foreground capitalize">{subscription.billing_cycle}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Next Billing</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Flags */}
      {featureFlags && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Access</CardTitle>
            <CardDescription>
              Features available with your current plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureFlagItem
                title="Add Workers"
                enabled={featureFlags.can_add_workers}
                limit={featureFlags.workers_limit}
              />
              <FeatureFlagItem
                title="Create Projects"
                enabled={featureFlags.can_create_projects}
                limit={featureFlags.projects_limit}
              />
              <FeatureFlagItem
                title="Document Management"
                enabled={featureFlags.can_use_document_management}
              />
              <FeatureFlagItem
                title="Advanced Analytics"
                enabled={featureFlags.can_use_advanced_analytics}
              />
              <FeatureFlagItem
                title="Project Cost Tracking"
                enabled={featureFlags.can_use_project_cost_tracking}
              />
              <FeatureFlagItem
                title="Advanced Payroll"
                enabled={featureFlags.can_use_advanced_payroll}
              />
              <FeatureFlagItem
                title="Equipment Tracking"
                enabled={featureFlags.can_use_equipment_tracking}
              />
              <FeatureFlagItem
                title="API Access"
                enabled={featureFlags.can_use_api}
              />
              <FeatureFlagItem
                title="Multi-Company Access"
                enabled={featureFlags.can_use_multi_company}
              />
              <FeatureFlagItem
                title="Priority Support"
                enabled={featureFlags.can_use_priority_support}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeatureFlagItem({ title, enabled, limit }: { title: string; enabled: boolean; limit?: number }) {
  return (
    <div className="flex items-center space-x-3">
      {enabled ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        {limit !== undefined && (
          <p className="text-xs text-muted-foreground">
            {limit === -1 ? 'Unlimited' : `Limit: ${limit}`}
          </p>
        )}
      </div>
    </div>
  );
}
```

### **Step 2: Create Feature Restriction Hooks**

Create a hook to check feature access:

```typescript
// hooks/use-feature-flags.ts
import { useState, useEffect } from "react";
import { getFeatureFlags } from "@/lib/data/subscriptions";
import type { FeatureFlags } from "@/lib/types/subscription";

export function useFeatureFlags() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      setLoading(true);
      const result = await getFeatureFlags();
      if (result.success && result.data) {
        setFeatureFlags(result.data);
      } else {
        setError(result.error || "Failed to load feature flags");
      }
    } catch (err) {
      setError("Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  };

  const canUseFeature = (feature: keyof FeatureFlags): boolean => {
    if (!featureFlags) return false;
    return featureFlags[feature] as boolean;
  };

  const getLimit = (limitKey: keyof FeatureFlags): number => {
    if (!featureFlags) return 0;
    return featureFlags[limitKey] as number;
  };

  return {
    featureFlags,
    loading,
    error,
    canUseFeature,
    getLimit,
    refresh: loadFeatureFlags,
  };
}
```

### **Step 3: Create Feature Restriction Components**

Create components that restrict access based on subscription:

```typescript
// components/subscription/feature-gate.tsx
"use client";

import { ReactNode } from "react";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Upgrade } from "lucide-react";
import Link from "next/link";

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: FeatureGateProps) {
  const { canUseFeature, loading } = useFeatureFlags();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!canUseFeature(feature as any)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Feature Not Available
            </CardTitle>
            <CardDescription>
              This feature requires a higher subscription plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/settings/subscription">
                <Upgrade className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  return <>{children}</>;
}
```

### **Step 4: Create Usage Limit Components**

Create components to show usage limits:

```typescript
// components/subscription/usage-limit.tsx
"use client";

import { ReactNode } from "react";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

interface UsageLimitProps {
  feature: string;
  currentUsage: number;
  children: ReactNode;
  showWarning?: boolean;
}

export function UsageLimit({ 
  feature, 
  currentUsage, 
  children, 
  showWarning = true 
}: UsageLimitProps) {
  const { getLimit, canUseFeature } = useFeatureFlags();
  const limit = getLimit(feature as any);
  const isUnlimited = limit === -1;
  const usagePercentage = isUnlimited ? 0 : (currentUsage / limit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = usagePercentage >= 100;

  if (!canUseFeature(feature as any)) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This feature is not available with your current plan.
        </AlertDescription>
      </Alert>
    );
  }

  if (isOverLimit) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You have reached your limit for this feature. Please upgrade your plan.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {children}
      
      {!isUnlimited && showWarning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Usage</span>
            <span>{currentUsage} / {limit}</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          {isNearLimit && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You're approaching your limit. Consider upgrading your plan.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
```

### **Step 5: Implement Feature Restrictions**

Now use these components throughout your app:

```typescript
// Example: In workers page
import { FeatureGate } from "@/components/subscription/feature-gate";
import { UsageLimit } from "@/components/subscription/usage-limit";

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ... load workers data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Workers</h1>
        <FeatureGate feature="can_add_workers">
          <Button>Add Worker</Button>
        </FeatureGate>
      </div>

      <UsageLimit feature="workers_limit" currentUsage={workers.length}>
        <WorkersTable workers={workers} />
      </UsageLimit>
    </div>
  );
}

// Example: In projects page
export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Projects</h1>
        <FeatureGate feature="can_create_projects">
          <Button>Create Project</Button>
        </FeatureGate>
      </div>

      <UsageLimit feature="projects_limit" currentUsage={projects.length}>
        <ProjectsTable projects={projects} />
      </UsageLimit>

      <FeatureGate feature="can_use_project_cost_tracking">
        <ProjectCostTracking />
      </FeatureGate>
    </div>
  );
}

// Example: In payroll page
export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payroll</h1>
      
      <FeatureGate feature="can_use_advanced_payroll">
        <AdvancedPayrollFeatures />
      </FeatureGate>
      
      <BasicPayrollFeatures />
    </div>
  );
}
```

### **Step 6: Add Usage Tracking**

Track usage when users perform actions:

```typescript
// In your API routes or server actions
import { trackUsage } from "@/lib/data/subscriptions";

// When adding a worker
export async function addWorker(data: any) {
  // ... add worker logic
  
  // Track usage
  await trackUsage('workers_count', 1);
  
  return result;
}

// When creating a project
export async function createProject(data: any) {
  // ... create project logic
  
  // Track usage
  await trackUsage('projects_count', 1);
  
  return result;
}

// When uploading a document
export async function uploadDocument(file: File) {
  // ... upload logic
  
  // Track storage usage
  await trackUsage('storage_bytes', file.size);
  
  return result;
}
```

### **Step 7: Create Upgrade Prompts**

Create components that prompt users to upgrade:

```typescript
// components/subscription/upgrade-prompt.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, Star } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
  recommendedPlan: string;
  description: string;
}

export function UpgradePrompt({ 
  feature, 
  currentPlan, 
  recommendedPlan, 
  description 
}: UpgradePromptProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUp className="h-5 w-5 text-primary" />
          Upgrade Required
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Plan</p>
              <p className="text-sm text-muted-foreground">{currentPlan}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Recommended</p>
              <div className="flex items-center gap-2">
                <Badge variant="default">{recommendedPlan}</Badge>
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
          </div>
          
          <Button asChild className="w-full">
            <Link href="/dashboard/settings/subscription">
              Upgrade Now
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🎯 **Feature Mapping**

Here's how the landing page features map to your subscription system:

### **Starter Plan Features:**
- ✅ Up to 15 workers
- ✅ 3 active projects  
- ✅ Time tracking & approvals
- ✅ Basic payroll reports
- ✅ Mobile app access
- ✅ Email support

### **Professional Plan Features:**
- ✅ Up to 50 workers
- ✅ Unlimited projects
- ✅ Advanced payroll features
- ✅ Project cost tracking
- ✅ Document management
- ✅ Priority support

### **Enterprise Plan Features:**
- ✅ Unlimited workers
- ✅ Multi-company access
- ✅ Advanced analytics
- ✅ Equipment tracking
- ✅ API access
- ✅ Dedicated support

## 🔄 **Usage Tracking Implementation**

Track these metrics in your app:

```typescript
// Track when users perform actions
await trackUsage('workers_count', 1); // When adding worker
await trackUsage('projects_count', 1); // When creating project
await trackUsage('timesheets_count', 1); // When submitting timesheet
await trackUsage('payroll_records_count', 1); // When generating payroll
await trackUsage('storage_bytes', fileSize); // When uploading files
await trackUsage('api_calls', 1); // When making API calls
await trackUsage('biometric_enrollments', 1); // When enrolling biometrics
await trackUsage('qr_scans', 1); // When scanning QR codes
```

## 🛡️ **Security & Validation**

### **Server-Side Validation**

Always validate on the server side:

```typescript
// In your API routes
export async function POST(request: Request) {
  const { featureFlags } = await getFeatureFlags();
  
  if (!featureFlags.can_add_workers) {
    return new Response('Feature not available', { status: 403 });
  }
  
  // Check usage limits
  const currentUsage = await getCurrentUsage('workers_count');
  const limit = featureFlags.workers_limit;
  
  if (limit !== -1 && currentUsage >= limit) {
    return new Response('Usage limit exceeded', { status: 429 });
  }
  
  // Proceed with action
  // ...
}
```

### **Database Constraints**

Add database constraints to enforce limits:

```sql
-- Add triggers to check limits
CREATE OR REPLACE FUNCTION check_worker_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_workers INTEGER;
BEGIN
  -- Get current worker count
  SELECT COUNT(*) INTO current_count
  FROM workers 
  WHERE company_id = NEW.company_id;
  
  -- Get subscription limit
  SELECT limits->>'workers' INTO max_workers
  FROM company_subscriptions cs
  JOIN subscription_plans sp ON cs.plan_id = sp.id
  WHERE cs.company_id = NEW.company_id
  AND cs.status IN ('active', 'trialing');
  
  -- Check limit
  IF max_workers IS NOT NULL AND max_workers != -1 AND current_count >= max_workers THEN
    RAISE EXCEPTION 'Worker limit exceeded for current plan';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_worker_limit_trigger
  BEFORE INSERT ON workers
  FOR EACH ROW
  EXECUTE FUNCTION check_worker_limit();
```

## 📊 **Monitoring & Analytics**

### **Usage Dashboard**

Create a usage dashboard for users:

```typescript
// app/dashboard/settings/usage/page.tsx
export default function UsagePage() {
  const [usage, setUsage] = useState(null);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Usage Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UsageCard
          title="Workers"
          current={usage?.metrics.workers_count || 0}
          limit={usage?.limits.find(l => l.metric_name === 'workers_count')?.limit || 0}
        />
        <UsageCard
          title="Projects"
          current={usage?.metrics.projects_count || 0}
          limit={usage?.limits.find(l => l.metric_name === 'projects_count')?.limit || 0}
        />
        <UsageCard
          title="Storage"
          current={usage?.metrics.storage_bytes || 0}
          limit={usage?.limits.find(l => l.metric_name === 'storage_gb')?.limit || 0}
          unit="GB"
        />
      </div>
    </div>
  );
}
```

## 🚀 **Next Steps**

1. **Run the migrations** to set up the subscription system
2. **Implement the feature gates** in your existing components
3. **Add usage tracking** to your API routes
4. **Create the subscription management UI**
5. **Test the limits** with different subscription plans
6. **Add upgrade prompts** throughout the app
7. **Monitor usage** and adjust limits as needed

This system provides a solid foundation for monetizing your TropiTrack app while maintaining a great user experience with clear upgrade paths. 