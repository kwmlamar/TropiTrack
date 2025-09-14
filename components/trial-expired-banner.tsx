"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, AlertTriangle } from 'lucide-react';
import { getSubscriptionStatus } from '@/lib/data/subscriptions';

interface TrialExpiredBannerProps {
  onSubscribe: () => void;
  onDismiss?: () => void;
}

export function TrialExpiredBanner({ onSubscribe, onDismiss }: TrialExpiredBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setSubscriptionStatus] = useState<Record<string, unknown> | null>(null);

  const checkTrialStatus = async () => {
    try {
      const result = await getSubscriptionStatus();
      if (result.success && result.data) {
        const { is_trialing, days_until_trial_end, status } = result.data;
        
        // Show banner if:
        // 1. Trial has ended (days_until_trial_end <= 0)
        // 2. Subscription is not active
        if ((!is_trialing && days_until_trial_end <= 0) || status === 'past_due') {
          setSubscriptionStatus(result.data);
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkTrialStatus();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
    // Store dismissal in localStorage to avoid showing again today
    localStorage.setItem('trial-expired-banner-dismissed', new Date().toDateString());
  };

  const handleSubscribe = () => {
    setIsVisible(false);
    onSubscribe();
  };

  if (isLoading || !isVisible) {
    return null;
  }

  // Check if user dismissed today
  const dismissedToday = localStorage.getItem('trial-expired-banner-dismissed') === new Date().toDateString();
  if (dismissedToday) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Trial Expired</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Your 14-day free trial has ended. Add your payment method to continue using TropiTrack.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-gray-600">
            <p>To continue using all features:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Add your payment method</li>
              <li>Choose your preferred plan</li>
              <li>Start your subscription</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button 
              onClick={handleSubscribe}
              className="flex-1"
              size="lg"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
            <Button 
              onClick={handleDismiss}
              variant="outline"
              size="lg"
            >
              Later
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You can dismiss this for now, but you&apos;ll need to add payment to continue using the app.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}




