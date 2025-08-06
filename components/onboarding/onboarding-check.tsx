"use client";

import { ReactNode, useEffect, useState } from "react";
import { useOnboarding } from "@/context/onboarding-context";

// Wrapper component that safely uses the onboarding context
function OnboardingCheckContent({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { state, getCurrentStep } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      setIsLoading(true);
      try {
        // Check if onboarding should be shown
        const currentStep = getCurrentStep();
        const isActive = state.isActive;
        
        setShouldShowOnboarding(isActive && currentStep !== null);
      } catch {
        console.error('Error checking onboarding status');
        setShouldShowOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [state.isActive, getCurrentStep]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (shouldShowOnboarding) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Main component that handles provider availability
export function OnboardingCheck({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  try {
    return <OnboardingCheckContent>{children}</OnboardingCheckContent>;
  } catch {
    console.warn('OnboardingProvider not available, skipping OnboardingCheck render');
    return <>{fallback}</>;
  }
} 