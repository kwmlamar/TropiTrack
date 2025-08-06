"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/context/onboarding-context";

// Wrapper component that safely uses the onboarding context
function WorkersCompletionCheckContent() {
  const { state, getCurrentStep } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);
  const [hasWorkers, setHasWorkers] = useState(false);

  useEffect(() => {
    const checkWorkersCompletion = async () => {
      setIsLoading(true);
      try {
        // Simulate checking if workers exist
        // In a real implementation, this would check the database
        const currentStep = getCurrentStep();
        const isActive = state.isActive;
        
        // For now, just check if onboarding is active and we're on the workers step
        setHasWorkers(isActive && currentStep?.id === 'workers');
      } catch (error) {
        console.error('Error checking workers completion:', error);
        setHasWorkers(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkWorkersCompletion();
  }, [state.isActive, getCurrentStep]);

  if (isLoading) {
    return <div>Checking workers...</div>;
  }

  return hasWorkers ? <div>Workers step is active</div> : <div>No workers step active</div>;
}

// Main component that handles provider availability
export function WorkersCompletionCheck() {
  try {
    return <WorkersCompletionCheckContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping WorkersCompletionCheck render');
    return null;
  }
}

// Hook for checking workers completion
function useWorkersCompletionContent() {
  const { state, getCurrentStep } = useOnboarding();
  const currentStep = getCurrentStep();
  return {
    isCompleted: state.isActive && currentStep?.id === 'workers',
    isLoading: state.isLoading,
    error: state.error
  };
}

export function useWorkersCompletion() {
  try {
    return useWorkersCompletionContent();
  } catch {
    console.warn('OnboardingProvider not available in useWorkersCompletion');
    return {
      isCompleted: false,
      isLoading: false,
      error: 'Provider not available'
    };
  }
} 