"use client";

import { WorkersCompletionCheck } from '@/components/onboarding/workers-completion-check';
import { OnboardingProvider } from '@/context/onboarding-context';

export default function TestWorkersCompletionPage() {
  return (
    <OnboardingProvider>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Workers Step Completion Check</h1>
        <WorkersCompletionCheck />
      </div>
    </OnboardingProvider>
  );
} 