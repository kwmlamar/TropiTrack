"use client";

import { useOnboarding } from "@/context/onboarding-context";
import { Progress } from "@/components/ui/progress";

// Wrapper component that safely uses the onboarding context
function OnboardingProgressContent() {
  const { getProgress } = useOnboarding();
  const progress = getProgress();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>Setup Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

// Main component that handles provider availability
export function OnboardingProgress() {
  try {
    return <OnboardingProgressContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping OnboardingProgress render');
    return null;
  }
} 