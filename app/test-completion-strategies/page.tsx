"use client";

import { WorkersCompletionStrategies } from '@/components/onboarding/workers-completion-strategies';
import { OnboardingProvider } from '@/context/onboarding-context';

export default function TestCompletionStrategiesPage() {
  return (
    <OnboardingProvider>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Workers Step Completion Strategies</h1>
        <WorkersCompletionStrategies />
      </div>
    </OnboardingProvider>
  );
} 