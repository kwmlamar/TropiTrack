"use client";

import { ReactNode } from "react";
import { CompanySetupOverlay } from "./company-setup-overlay";
import { useOnboarding } from "@/context/onboarding-context";

// Wrapper component that safely uses the onboarding context
function CompanySetupOverlayContent() {
  const { state, getCurrentStep } = useOnboarding();
  
  const currentStep = getCurrentStep();
  const isCompanySetupVisible = state.isActive && currentStep?.id === 'company-setup';

  if (!isCompanySetupVisible) {
    return null;
  }

  return <CompanySetupOverlay />;
}

// Main component that handles provider availability
export function CompanySetupOverlayProvider({ children }: { children: ReactNode }) {
  try {
    return (
      <>
        {children}
        <CompanySetupOverlayContent />
      </>
    );
  } catch {
    console.warn('OnboardingProvider not available, skipping CompanySetupOverlayProvider render');
    return <>{children}</>;
  }
} 