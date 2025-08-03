"use client";

import React from 'react';
import { useOnboarding } from '@/context/onboarding-context';
import { CompanySetupOverlay } from '@/components/onboarding/company-setup-overlay';

export function CompanySetupOverlayProvider() {
  const { state, getCurrentStep, closeCurrentStep } = useOnboarding();
  
  const currentStep = getCurrentStep();
  const showCompanySetup = state.isActive && currentStep?.id === 'company-setup';

  return (
    <CompanySetupOverlay 
      isVisible={showCompanySetup}
      onClose={() => {
        closeCurrentStep();
      }}
    />
  );
} 