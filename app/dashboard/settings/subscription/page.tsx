"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ArrowUp } from "lucide-react";
import { getCompanySubscription, getSubscriptionStatus, getFeatureFlags } from "@/lib/data/subscriptions";
import type { FeatureFlags } from "@/lib/types/subscription";

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<import("@/lib/types/subscription").CompanySubscriptionWithPlan | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
          const [subResult, , flagsResult] = await Promise.all([
      getCompanySubscription(),
      getSubscriptionStatus(),
      getFeatureFlags()
    ]);

      if (subResult.success) setSubscription(subResult.data);
      if (flagsResult.success) setFeatureFlags(flagsResult.data);
    } catch (error) {
      console.error("Error loading subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-muted rounded animate-pulse"></div>
          <div className="h-64 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-gray-500">
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
                  <p className="text-gray-500">{subscription.plan.description}</p>
                </div>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Billing Cycle</p>
                  <p className="text-sm text-gray-500 capitalize">{subscription.billing_cycle}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Next Billing</p>
                  <p className="text-sm text-gray-500">
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

      {/* Upgrade CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <ArrowUp className="h-5 w-5" />
            Ready to Upgrade?
          </CardTitle>
          <CardDescription>
            Unlock more features and increase your limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/#pricing">
              View All Plans
            </Link>
          </Button>
        </CardContent>
      </Card>
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
          <p className="text-xs text-gray-500">
            {limit === -1 ? 'Unlimited' : `Limit: ${limit}`}
          </p>
        )}
      </div>
    </div>
  );
} 