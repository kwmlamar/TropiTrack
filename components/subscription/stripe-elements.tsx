"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeElementsProps {
  clientSecret: string;
  onSuccess: (subscriptionId: string) => void;
  onError: (error: string) => void;
}

function CheckoutForm({ onSuccess }: { onSuccess: (subscriptionId: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setIsLoading(false);
      return;
    }

    // Confirm payment
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/settings/subscription?success=true`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setIsLoading(false);
      return;
    }

    // Payment successful
    setIsLoading(false);
    onSuccess('subscription_created');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Subscribe Now'
        )}
      </Button>
    </form>
  );
}

export function StripeElements({ clientSecret, onSuccess, onError }: StripeElementsProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clientSecret) {
      setIsLoading(false);
    }
  }, [clientSecret]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckoutForm onSuccess={onSuccess} onError={onError} />
        </CardContent>
      </Card>
    </Elements>
  );
}

export function PaymentSuccess() {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="flex items-center justify-center py-8">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Payment Successful!
          </h3>
          <p className="text-green-600">
            Your subscription has been activated. You can now access all features.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 