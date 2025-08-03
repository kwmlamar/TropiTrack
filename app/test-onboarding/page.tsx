"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  RotateCcw, 
  SkipForward,
  TestTube,
  ArrowRight
} from 'lucide-react';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { ONBOARDING_STEPS } from '@/lib/types/onboarding';
import { forceOnboardingMode, simulateOnboardingProgress } from '@/lib/actions/onboarding-actions';
import { testForceOnboardingMode, testSimulateOnboardingProgress } from '@/lib/actions/onboarding-test-actions';
import { toast } from 'sonner';

function TestOnboardingContent() {
  const { 
    state, 
    startOnboarding, 
    resetOnboarding, 
    skipOnboarding,
    getCurrentStep,
    getProgress,
    isStepCompleted,
    goToStep
  } = useOnboarding();
  
  const [isLoading, setIsLoading] = useState(false);
  const currentStep = getCurrentStep();
  const progress = getProgress();

  const handleForceOnboarding = async () => {
    setIsLoading(true);
    try {
      // Try the real function first, fallback to test function
      let result = await forceOnboardingMode();
      
      if (!result.success && result.error?.includes('table')) {
        // If database table doesn't exist, use test function
        result = await testForceOnboardingMode();
      }
      
      if (result.success) {
        startOnboarding();
        toast.success('Onboarding mode activated!');
      } else {
        toast.error(`Failed to activate onboarding mode: ${result.error}`);
      }
    } catch {
      toast.error('Error activating onboarding mode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateProgress = async (steps: string[]) => {
    setIsLoading(true);
    try {
      // Try the real function first, fallback to test function
      let result = await simulateOnboardingProgress(undefined, steps);
      
      if (!result.success && result.error?.includes('table')) {
        // If database table doesn't exist, use test function
        result = await testSimulateOnboardingProgress(steps);
      }
      
      if (result.success) {
        toast.success(`Simulated progress for ${steps.length} steps`);
      } else {
        toast.error(`Failed to simulate progress: ${result.error}`);
      }
    } catch {
      toast.error('Error simulating progress');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <TestTube className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Onboarding Test Page</span>
        </div>
        <p className="text-gray-500">Development only - Test the onboarding flow</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Status:</span>
              <Badge variant={state.isActive ? "default" : "secondary"}>
                {state.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            {currentStep && (
              <div className="flex justify-between">
                <span>Current Step:</span>
                <span className="font-medium">{currentStep.title}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Progress:</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleForceOnboarding}
              disabled={isLoading}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              {isLoading ? 'Activating...' : 'Force Onboarding'}
            </Button>

            <Button
              onClick={resetOnboarding}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Onboarding
            </Button>

            <Button
              onClick={skipOnboarding}
              variant="outline"
              className="w-full"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Step Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            {ONBOARDING_STEPS.map((step) => (
              <Button
                key={step.id}
                onClick={() => goToStep(step.id)}
                variant="outline"
                size="sm"
                className="justify-between"
                disabled={!state.isActive}
              >
                <span className="truncate">{step.title}</span>
                {isStepCompleted(step.id) && (
                  <Badge variant="default" className="ml-2 text-xs">
                    ✓
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulate Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Simulate Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Button
              onClick={() => handleSimulateProgress(['company-setup'])}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Step 1: Company Setup
            </Button>
            <Button
              onClick={() => handleSimulateProgress(['company-setup', 'workers'])}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Steps 1-2: Company &amp; Workers
            </Button>
            <Button
              onClick={() => handleSimulateProgress(['company-setup', 'workers', 'clients', 'projects'])}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Steps 1-4: Full Setup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ONBOARDING_STEPS.map((step) => (
              <div key={step.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{step.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    Step {step.order}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={isStepCompleted(step.id) ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {isStepCompleted(step.id) ? 'Completed' : 'Pending'}
                  </Badge>
                  {state.isActive && (
                    <Button
                      onClick={() => goToStep(step.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>1. Force Onboarding:</strong> Click &quot;Force Onboarding&quot; to start the flow
          </div>
          <div>
            <strong>2. Navigate Steps:</strong> Use the step navigation buttons to move between steps
          </div>
          <div>
            <strong>3. Simulate Progress:</strong> Use the simulate buttons to mark steps as completed
          </div>
          <div>
            <strong>4. Test Overlay:</strong> The onboarding overlay will appear on each page with guidance
          </div>
          <div>
            <strong>5. Reset:</strong> Use &quot;Reset Onboarding&quot; to start fresh
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TestOnboardingPage() {
  return (
    <OnboardingProvider>
      <TestOnboardingContent />
    </OnboardingProvider>
  );
} 