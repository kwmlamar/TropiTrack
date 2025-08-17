"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@/context/onboarding-context";
import { OnboardingCompanySetupDialog } from "./onboarding-company-setup-dialog";
import { checkOnboardingStatus } from "@/lib/actions/onboarding-actions";
import { getAuthUserId } from "@/lib/data/userProfiles";

export function OnboardingCheck() {
  const { state, startOnboarding, getCurrentStep } = useOnboarding();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const userId = await getAuthUserId();
        if (!userId) return;

        const { shouldShowOnboarding: needsOnboarding, completedSteps: steps } = await checkOnboardingStatus(userId);
        
        setCompletedSteps(steps);
        
        if (needsOnboarding) {
          // Start onboarding if it's not already active
          if (!state.isActive) {
            await startOnboarding();
          }
          setShouldShowOnboarding(true);
        } else {
          setShouldShowOnboarding(false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If there's an error, don't show onboarding to avoid blocking the user
        setShouldShowOnboarding(false);
      } finally {
        setIsChecking(false);
      }
    }

    checkOnboarding();
  }, [state.isActive, startOnboarding]);

  // Don't render anything while checking
  if (isChecking) {
    return null;
  }

  // Don't render if onboarding shouldn't be shown
  if (!shouldShowOnboarding) {
    return null;
  }

  // Don't render if onboarding is not active
  if (!state.isActive) {
    return null;
  }

  const currentStep = getCurrentStep();
  
  // Only show company setup dialog for the company-setup step AND if it hasn't been completed
  if (currentStep?.id === 'company-setup' && !completedSteps.includes('company-setup')) {
    return <OnboardingCompanySetupDialog />;
  }

  return null;
} 