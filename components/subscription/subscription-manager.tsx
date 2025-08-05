"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { StripeElements } from './stripe-elements';
import type { SubscriptionPlan, CompanySubscriptionWithPlan } from '@/lib/types/subscription';

interface SubscriptionManagerProps {
  plans: SubscriptionPlan[];
  currentSubscription?: CompanySubscriptionWithPlan | null;
  onSuccess: () => void;
}

export function SubscriptionManager({ plans, currentSubscription, onSuccess }: SubscriptionManagerProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setError(null);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: selectedPlan.slug,
          billing_cycle: billingCycle,
          payment_method_id: 'pm_placeholder', // Will be replaced by Stripe Elements
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      setClientSecret(data.client_secret);
      setShowPaymentForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setClientSecret(null);
    onSuccess();
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    setShowPaymentForm(false);
    setClientSecret(null);
  };

  if (showPaymentForm && clientSecret) {
    return (
      <StripeElements
        clientSecret={clientSecret}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      {currentSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{currentSubscription.plan.name}</h3>
                <p className="text-gray-500">{currentSubscription.plan.description}</p>
              </div>
              <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                {currentSubscription.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlan?.id === plan.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-gray-300'
                }`}
                onClick={() => handlePlanSelect(plan)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    {plan.is_popular && (
                      <Badge variant="secondary">Popular</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-2xl font-bold">
                      ${billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly}
                    </div>
                    <div className="text-sm text-gray-500">
                      per {billingCycle === 'yearly' ? 'year' : 'month'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'outline'}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'outline'}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSubscribe}
            disabled={!selectedPlan || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Subscribe to ${selectedPlan?.name || 'Plan'}`
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 