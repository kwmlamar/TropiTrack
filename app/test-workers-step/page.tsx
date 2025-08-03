"use client";

import { StandaloneWorkersStep } from '@/components/onboarding/standalone-workers-step';
import { OnboardingProvider } from '@/context/onboarding-context';

export default function TestWorkersStepPage() {
  return (
    <OnboardingProvider>
      <StandaloneWorkersStep />
    </OnboardingProvider>
  );
} 