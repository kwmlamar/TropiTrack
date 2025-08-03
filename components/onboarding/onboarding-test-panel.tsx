"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  RotateCcw, 
  SkipForward,
  TestTube
} from 'lucide-react';
import { useOnboarding } from '@/context/onboarding-context';
import { ONBOARDING_STEPS } from '@/lib/types/onboarding';
import { forceOnboardingMode, simulateOnboardingProgress } from '@/lib/actions/onboarding-actions';
import { testForceOnboardingMode, testSimulateOnboardingProgress, checkAuthenticationStatus } from '@/lib/actions/onboarding-test-actions';
import { toast } from 'sonner';

// Only show in development
const isDevelopment = process.env.NODE_ENV === 'development';

export function OnboardingTestPanel() {
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
  
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean;
    userId?: string;
    error?: string;
  } | null>(null);

  const currentStep = getCurrentStep();
  const progress = getProgress();

  // Check authentication status when panel opens
  useEffect(() => {
    if (isVisible && !authStatus) {
      checkAuthenticationStatus().then(setAuthStatus);
    }
  }, [isVisible, authStatus]);

  if (!isDevelopment) {
    return null;
  }

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

  const handleReset = () => {
    resetOnboarding();
    toast.info('Onboarding reset');
  };

  const handleSkip = () => {
    skipOnboarding();
    toast.info('Onboarding skipped');
  };

  return (
    <>
      {/* Floating test button */}
      <div className="fixed top-6 right-6 z-50">
        <Button
          onClick={() => setIsVisible(!isVisible)}
          size="sm"
          variant="outline"
          className="bg-white/90 backdrop-blur-sm shadow-lg"
        >
          <TestTube className="h-4 w-4 mr-2" />
          Test Onboarding
        </Button>
      </div>

      {/* Test panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-50 w-80">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Onboarding Test Panel</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  DEV ONLY
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Authentication status */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Auth Status:</span>
                  <span className={authStatus?.isAuthenticated ? 'text-green-600' : 'text-red-500'}>
                    {authStatus?.isAuthenticated ? 'Authenticated' : authStatus?.error || 'Checking...'}
                  </span>
                </div>
                
                {authStatus?.userId && (
                  <div className="flex justify-between text-xs">
                    <span>User ID:</span>
                    <span className="font-mono text-xs truncate max-w-24">
                      {authStatus.userId.slice(0, 8)}...
                    </span>
                  </div>
                )}
              </div>

              {/* Current status */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Status:</span>
                  <span className={state.isActive ? 'text-green-600' : 'text-gray-500'}>
                    {state.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {currentStep && (
                  <div className="flex justify-between text-xs">
                    <span>Current Step:</span>
                    <span className="font-medium">{currentStep.title}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-xs">
                  <span>Progress:</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>

              {/* Authentication warning */}
              {authStatus && !authStatus.isAuthenticated && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  ⚠️ Not authenticated. Some features may not work. Please log in first.
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleForceOnboarding}
                  disabled={isLoading}
                  size="sm"
                  className="w-full"
                >
                  <Play className="h-3 w-3 mr-2" />
                  {isLoading ? 'Activating...' : 'Force Onboarding'}
                </Button>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Reset Onboarding
                </Button>

                <Button
                  onClick={handleSkip}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <SkipForward className="h-3 w-3 mr-2" />
                  Skip Onboarding
                </Button>
              </div>

              {/* Quick step navigation */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600">Quick Navigation:</p>
                <div className="grid grid-cols-2 gap-1">
                  {ONBOARDING_STEPS.slice(0, 4).map((step) => (
                    <Button
                      key={step.id}
                      onClick={() => goToStep(step.id)}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6"
                      disabled={!state.isActive}
                    >
                      {step.title}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {ONBOARDING_STEPS.slice(4).map((step) => (
                    <Button
                      key={step.id}
                      onClick={() => goToStep(step.id)}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6"
                      disabled={!state.isActive}
                    >
                      {step.title}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Step completion status */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600">Step Status:</p>
                <div className="space-y-1">
                  {ONBOARDING_STEPS.map((step) => (
                    <div key={step.id} className="flex items-center justify-between text-xs">
                      <span className="truncate">{step.title}</span>
                      <Badge 
                        variant={isStepCompleted(step.id) ? "default" : "secondary"}
                        className="text-xs px-1"
                      >
                        {isStepCompleted(step.id) ? '✓' : '○'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulate progress buttons */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600">Simulate Progress:</p>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    onClick={() => handleSimulateProgress(['company-setup', 'workers'])}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    disabled={isLoading}
                  >
                    Steps 1-2
                  </Button>
                  <Button
                    onClick={() => handleSimulateProgress(['company-setup', 'workers', 'clients', 'projects'])}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    disabled={isLoading}
                  >
                    Steps 1-4
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
} 