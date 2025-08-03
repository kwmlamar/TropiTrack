"use client";

import { OnboardingProvider } from '@/context/onboarding-context';
import { StandaloneTimesheetsStep } from '@/components/onboarding/standalone-timesheets-step';

export default function TestTimesheetsStepPage() {
  return (
    <OnboardingProvider>
      <StandaloneTimesheetsStep />
    </OnboardingProvider>
  );
} 