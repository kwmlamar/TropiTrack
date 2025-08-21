"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCompanySubscription, getFeatureFlags } from '@/lib/data/subscriptions';
import { toast } from 'sonner';

interface SubscriptionResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

interface FeatureFlagsResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export default function TestSubscriptionLimits() {
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subResult, flagsResult] = await Promise.all([
        getCompanySubscription(),
        getFeatureFlags()
      ]);

      setSubscription(subResult);
      setFeatureFlags(flagsResult);
      
      toast.success("Subscription data loaded");
    } catch {
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Subscription Limits
          </h1>
          <p className="text-gray-600">
            Debug subscription limits and feature flags
          </p>
        </div>

        <Button 
          onClick={loadData} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Loading..." : "Load Subscription Data"}
        </Button>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Data</CardTitle>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Success:</span>
                    <Badge variant={subscription.success ? "default" : "destructive"}>
                      {subscription.success ? "Yes" : "No"}
                    </Badge>
                  </div>
                  
                  {subscription.data && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Plan:</span>
                        <span className="text-sm text-gray-600">
                          {subscription.data.plan?.name || "N/A"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Plan Slug:</span>
                        <span className="text-sm text-gray-600">
                          {subscription.data.plan?.slug || "N/A"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <Badge variant="outline">
                          {subscription.data.status || "N/A"}
                        </Badge>
                      </div>
                      
                      <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                        <strong>Raw Plan Limits:</strong>
                        <pre className="mt-1 overflow-auto">
                          {JSON.stringify(subscription.data.plan?.limits, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                  
                  {subscription.error && (
                    <div className="text-red-600 text-sm">
                      Error: {subscription.error}
                    </div>
                  )}
                  
                  <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                    <strong>Raw Subscription Response:</strong>
                    <pre className="mt-1 overflow-auto">
                      {JSON.stringify(subscription, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Click &quot;Load Subscription Data&quot; to see subscription information</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
            </CardHeader>
            <CardContent>
              {featureFlags ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Success:</span>
                    <Badge variant={featureFlags.success ? "default" : "destructive"}>
                      {featureFlags.success ? "Yes" : "No"}
                    </Badge>
                  </div>
                  
                  {featureFlags.data && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Can Create Projects:</span>
                        <Badge variant={featureFlags.data.can_create_projects ? "default" : "secondary"}>
                          {featureFlags.data.can_create_projects ? "Yes" : "No"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Projects Limit:</span>
                        <Badge variant="outline">
                          {featureFlags.data.projects_limit === -1 ? "Unlimited" : featureFlags.data.projects_limit}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Workers Limit:</span>
                        <Badge variant="outline">
                          {featureFlags.data.workers_limit === -1 ? "Unlimited" : featureFlags.data.workers_limit}
                        </Badge>
                      </div>
                      
                      <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                        <strong>Raw Feature Flags:</strong>
                        <pre className="mt-1 overflow-auto">
                          {JSON.stringify(featureFlags.data, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                  
                  {featureFlags.error && (
                    <div className="text-red-600 text-sm">
                      Error: {featureFlags.error}
                    </div>
                  )}
                  
                  <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                    <strong>Raw Feature Flags Response:</strong>
                    <pre className="mt-1 overflow-auto">
                      {JSON.stringify(featureFlags, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Click &quot;Load Subscription Data&quot; to see feature flags</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
