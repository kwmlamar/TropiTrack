"use client";

import { useOnboarding } from '@/context/onboarding-context';
import { isStepSmartCompleted } from '@/components/onboarding/smart-completion-checks';
import { useEffect, useState } from 'react';

interface OnboardingCheckProps {
  currentStep: string;
  fallback: React.ReactNode;
  children: React.ReactNode;
}

export function OnboardingCheck({ currentStep, fallback, children }: OnboardingCheckProps) {
  const { state, getCurrentStep } = useOnboarding();
  const [smartCompletion, setSmartCompletion] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  const currentOnboardingStep = getCurrentStep();

  useEffect(() => {
    async function checkSmartCompletion() {
      if (['workers', 'clients', 'projects', 'timesheets'].includes(currentStep)) {
        try {
          const { isCompleted } = await isStepSmartCompleted(currentStep);
          setSmartCompletion(isCompleted);
        } catch (error) {
          console.error('Error checking smart completion:', error);
          setSmartCompletion(false);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    checkSmartCompletion();
  }, [currentStep]);

  // For steps that support smart completion
  if (['workers', 'clients', 'projects', 'timesheets'].includes(currentStep)) {
    if (loading) {
      return <div className="flex items-center justify-center p-8">Loading...</div>;
    }
    
    // Show onboarding step if onboarding is active and step is not smart-completed
    if (state.isActive && currentOnboardingStep?.id === currentStep && !smartCompletion) {
      return <>{children}</>;
    }
    
    // Otherwise show the fallback (regular page content)
    return <>{fallback}</>;
  }

  // For other steps, use the original logic
  if (state.isActive && currentOnboardingStep?.id === currentStep) {
    return <>{children}</>;
  }

  // Otherwise show the fallback (regular page content)
  return <>{fallback}</>;
} 