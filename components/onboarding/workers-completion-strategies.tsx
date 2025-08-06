"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/context/onboarding-context";

// Wrapper component that safely uses the onboarding context
function WorkersCompletionStrategiesContent() {
  const { state, getCurrentStep } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);
  const [completionStrategy, setCompletionStrategy] = useState<string>("");
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
        const workersActive = isActive && currentStep?.id === 'workers';
        setHasWorkers(workersActive);
        
        if (workersActive) {
          setCompletionStrategy("Workers step is currently active");
        } else {
          setCompletionStrategy("No workers step active");
        }
      } catch (error) {
        console.error('Error checking workers completion:', error);
        setHasWorkers(false);
        setCompletionStrategy("Error checking completion");
      } finally {
        setIsLoading(false);
      }
    };

    checkWorkersCompletion();
  }, [state.isActive, getCurrentStep]);

  if (isLoading) {
    return <div>Checking workers completion strategies...</div>;
  }

  return (
    <div>
      <h3>Workers Completion Strategy</h3>
      <p>{completionStrategy}</p>
      <p>Has Workers: {hasWorkers ? 'Yes' : 'No'}</p>
    </div>
  );
}

// Main component that handles provider availability
export function WorkersCompletionStrategies() {
  try {
    return <WorkersCompletionStrategiesContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping WorkersCompletionStrategies render');
    return null;
  }
} 