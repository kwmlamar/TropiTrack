"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CreditCard, X } from 'lucide-react';
import { getSubscriptionStatus } from '@/lib/data/subscriptions';

interface TrialExpiryBannerProps {
  onSubscribe: () => void;
  onDismiss?: () => void;
}

export function TrialExpiryBanner({ onSubscribe, onDismiss }: TrialExpiryBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkTrialStatus();
  }, []);

  const checkTrialStatus = async () => {
    try {
      const result = await getSubscriptionStatus();
      if (result.success && result.data) {
        const { is_trialing, days_until_trial_end } = result.data;
        
        // Show banner if:
        // 1. User is in trial
        // 2. Trial ends in 3 days or less
        // 3. User hasn't dismissed it
        if (is_trialing && days_until_trial_end <= 3 && days_until_trial_end > 0) {
          setDaysLeft(days_until_trial_end);
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
    // Store dismissal in localStorage to avoid showing again today
    localStorage.setItem('trial-banner-dismissed', new Date().toDateString());
  };

  const handleSubscribe = () => {
    setIsVisible(false);
    onSubscribe();
  };

  if (isLoading || !isVisible) {
    return null;
  }

  // Check if user dismissed today
  const dismissedToday = localStorage.getItem('trial-banner-dismissed') === new Date().toDateString();
  if (dismissedToday) {
    return null;
  }

  const getMessage = () => {
    if (daysLeft === 1) {
      return "Your trial ends tomorrow! Add your card to keep your workers clocking in.";
    } else if (daysLeft === 2) {
      return "Your trial ends in 2 days. Add your card to keep your workers clocking in.";
    } else {
      return `Your trial ends in ${daysLeft} days. Add your card to keep your workers clocking in.`;
    }
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
      <Card className="border-yellow-200 bg-yellow-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-yellow-800 mb-1">
                Trial Ending Soon
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                {getMessage()}
              </p>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSubscribe}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDismiss}
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
