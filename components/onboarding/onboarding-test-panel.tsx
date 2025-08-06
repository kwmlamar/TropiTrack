"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/context/onboarding-context";

// Wrapper component that safely uses the onboarding context
function OnboardingTestPanelContent() {
  const { state, getCurrentStep, startOnboarding, skipOnboarding } = useOnboarding();
  const [isVisible, setIsVisible] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    // Only show in development
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  if (!isVisible) {
    return null;
  }

  const currentStep = getCurrentStep();

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Onboarding Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs space-y-1">
            <div>Status: {state.isActive ? 'Active' : 'Inactive'}</div>
            <div>Loading: {state.isLoading ? 'Yes' : 'No'}</div>
            <div>Error: {state.error || 'None'}</div>
            <div>Current Step: {currentStep?.id || 'None'}</div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              onClick={() => startOnboarding()}
              className="text-xs"
            >
              Start
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => skipOnboarding()}
              className="text-xs"
            >
              Skip
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="text-xs"
            >
              {showDebugInfo ? 'Hide' : 'Show'} Debug
            </Button>
          </div>
          
          {showDebugInfo && (
            <div className="text-xs bg-gray-100 p-2 rounded">
              <pre>{JSON.stringify(state, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Main component that handles provider availability
export function OnboardingTestPanel() {
  try {
    return <OnboardingTestPanelContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping OnboardingTestPanel render');
    return null;
  }
} 