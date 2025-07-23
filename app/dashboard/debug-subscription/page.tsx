"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { getCompanySubscription, getFeatureFlags } from "@/lib/data/subscriptions";
import type { ApiResponse } from "@/lib/types";
import type { CompanySubscriptionWithPlan, FeatureFlags } from "@/lib/types/subscription";

export default function DebugSubscriptionPage() {
  const [subscription, setSubscription] = useState<ApiResponse<CompanySubscriptionWithPlan> | null>(null);
  const [featureFlags, setFeatureFlags] = useState<ApiResponse<FeatureFlags> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load subscription data
      const subResult = await getCompanySubscription();
      console.log("Subscription result:", subResult);
      setSubscription(subResult);

      // Load feature flags
      const flagsResult = await getFeatureFlags();
      console.log("Feature flags result:", flagsResult);
      setFeatureFlags(flagsResult);

    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const assignFamilyPlan = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/assign-family-plan-to-self', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log("Assign family plan result:", result);

      if (response.ok) {
        // Reload data after successful assignment
        await loadData();
      } else {
        setError(result.error || "Failed to assign family plan");
      }
    } catch (err) {
      console.error("Error assigning family plan:", err);
      setError("Failed to assign family plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading subscription data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscription Debug</h1>
        <div className="flex gap-2">
          <Button onClick={assignFamilyPlan} disabled={loading} variant="outline">
            Assign Family Plan
          </Button>
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Subscription Data */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Data</CardTitle>
          <CardDescription>
            Current subscription information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Raw Response:</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(subscription, null, 2)}
              </pre>
            </div>

            {subscription?.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Plan Details:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Plan Name:</span>
                      <Badge variant="outline">{subscription.data.plan?.name || 'Unknown'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Plan Slug:</span>
                      <Badge variant="outline">{subscription.data.plan?.slug || 'Unknown'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={subscription.data.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.data.status || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Is Active:</span>
                      <Badge variant={['active', 'trialing'].includes(subscription.data.status) ? 'default' : 'secondary'}>
                        {['active', 'trialing'].includes(subscription.data.status) ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Limits:</h4>
                  <div className="space-y-2">
                    {subscription.data.plan?.limits && Object.entries(subscription.data.plan.limits).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                        <Badge variant="outline">{String(value)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>
            Current feature availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Raw Response:</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(featureFlags, null, 2)}
              </pre>
            </div>

            {featureFlags?.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(featureFlags.data).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <Badge variant={value ? 'default' : 'secondary'}>
                      {value ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {value ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 