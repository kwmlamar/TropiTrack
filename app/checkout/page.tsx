"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Price IDs for each plan - these should match your Stripe dashboard
// TODO: Replace these with actual Stripe price IDs from your dashboard
const PRICE_IDS = {
  starter: 'price_test_starter_monthly', // Replace with actual Stripe price ID for $39/month
  professional: 'price_test_professional_monthly', // Replace with actual Stripe price ID for $89/month
  enterprise: 'price_test_enterprise_monthly', // Replace with actual Stripe price ID for $179/month
};

const PLAN_DETAILS = {
  starter: {
    name: 'Starter',
    price: '$39',
    description: 'Perfect for small crews',
    features: [
      'Up to 15 workers',
      '3 active projects',
      'Time tracking & approvals',
      'Basic payroll reports',
      'Mobile app access',
      'Email support'
    ]
  },
  professional: {
    name: 'Professional',
    price: '$89',
    description: 'For growing companies',
    features: [
      'Up to 50 workers',
      'Unlimited projects',
      'Advanced payroll features',
      'Project cost tracking',
      'Document management',
      'Priority support'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: '$179',
    description: 'For large operations',
    features: [
      'Unlimited workers',
      'Multi-company access',
      'Advanced analytics',
      'Equipment tracking',
      'API access',
      'Dedicated support'
    ]
  }
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') as keyof typeof PLAN_DETAILS;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plan || !PLAN_DETAILS[plan]) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Plan</h1>
            <p className="text-gray-500 mb-6">The selected plan is not valid.</p>
            <Button asChild>
              <Link href="/#pricing">View Pricing Plans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPlan = PLAN_DETAILS[plan];
  const priceId = PRICE_IDS[plan];

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planName: selectedPlan.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/#pricing">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pricing
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">TropiTrack</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Complete Your Subscription</h1>
            <p className="text-gray-500">
              Start your 2-week free trial with the {selectedPlan.name} plan
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Plan Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold">{selectedPlan.name}</h3>
                  <p className="text-gray-500">{selectedPlan.description}</p>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{selectedPlan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </div>

                <div>
                   <h4 className="font-semibold mb-3">What&apos;s included:</h4>
                  <ul className="space-y-2">
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">14-day free trial</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    No charge for 2 weeks. Cancel anytime during trial.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Checkout Form */}
            <Card>
              <CardHeader>
                <CardTitle>Start Your Free Trial</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
                     <ul className="text-sm text-blue-700 space-y-1">
                       <li>• You&apos;ll be redirected to secure Stripe checkout</li>
                      <li>• Enter your payment details</li>
                      <li>• Start your 14-day free trial immediately</li>
                      <li>• No charges until trial ends</li>
                    </ul>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }}>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirecting to checkout...
                        </>
                      ) : (
                        'Start Free Trial'
                      )}
                    </Button>
                  </form>

                  <p className="text-xs text-gray-500 text-center">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                    You can cancel anytime during your free trial.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading checkout...</span>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
