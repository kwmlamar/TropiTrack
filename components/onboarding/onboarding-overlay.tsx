"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  X, 
  SkipForward,
  CheckCircle
} from 'lucide-react';
import { useOnboarding } from '@/context/onboarding-context';
import { ONBOARDING_STEPS } from '@/lib/types/onboarding';
import { 
  isStepSmartCompleted
} from '@/components/onboarding/smart-completion-checks';
import { toast } from 'sonner';

interface OnboardingOverlayProps {
  children: React.ReactNode;
}

export function OnboardingOverlay({ children }: OnboardingOverlayProps) {
  const router = useRouter();
  const { 
    state, 
    getCurrentStep, 
    getProgress, 
    goToNextStep, 
    goToPreviousStep, 
    skipOnboarding,
    isStepCompleted 
  } = useOnboarding();
  
  const [isVisible, setIsVisible] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [, setSmartCompletion] = useState<{ [key: string]: boolean | null }>({});
  const [lastCheckTime, setLastCheckTime] = useState<{ [key: string]: number }>({});
  const smartCompletionRef = useRef<{ [key: string]: boolean | null }>({});

  const currentStep = getCurrentStep();
  const progress = getProgress();

  const removeHighlight = useCallback(() => {
    if (highlightedElement) {
      highlightedElement.style.position = '';
      highlightedElement.style.zIndex = '';
      highlightedElement.style.boxShadow = '';
      highlightedElement.style.borderRadius = '';
      setHighlightedElement(null);
    }
  }, [highlightedElement]);

  const highlightElement = useCallback((stepId: string) => {
    // Remove previous highlight
    removeHighlight();

    // Find element to highlight based on step
    const element = findElementToHighlight(stepId);
    if (element) {
      element.style.position = 'relative';
      element.style.zIndex = '1000';
      element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
      element.style.borderRadius = '8px';
      setHighlightedElement(element);
    }
  }, [removeHighlight]);

  // Check smart completion for steps that support it
  useEffect(() => {
    let isMounted = true;
    
    async function checkSmartCompletion() {
      if (!currentStep?.id || !isMounted) return;
      
      // Only check for steps that support smart completion
      if (!['workers', 'clients', 'projects', 'timesheets', 'approvals', 'payroll'].includes(currentStep.id)) {
        return;
      }
      
      // Prevent excessive checks - only check once every 5 seconds per step
      const now = Date.now();
      const lastCheck = lastCheckTime[currentStep.id] || 0;
      if (now - lastCheck < 5000) {
        console.log(`Skipping smart completion check for ${currentStep.id} - too recent`);
        return;
      }
      
      try {
        console.log(`Checking smart completion for ${currentStep.id} step...`);
        setLastCheckTime(prev => ({ ...prev, [currentStep.id]: now }));
        
        const result = await isStepSmartCompleted(currentStep.id);
        
        if (isMounted) {
          console.log('Smart completion result:', result);
          const newSmartCompletion = {
            ...smartCompletionRef.current,
            [currentStep.id]: result.isCompleted
          };
          smartCompletionRef.current = newSmartCompletion;
          setSmartCompletion(newSmartCompletion);
        }
      } catch (error) {
        console.error('Error checking smart completion:', error);
        if (isMounted) {
          const newSmartCompletion = {
            ...smartCompletionRef.current,
            [currentStep.id]: false
          };
          smartCompletionRef.current = newSmartCompletion;
          setSmartCompletion(newSmartCompletion);
        }
      }
    }

    // Only check if onboarding is active and we have a current step
    if (state.isActive && currentStep?.id && !state.error && !state.isLoading) {
      console.log(`${currentStep.id} step active, checking smart completion...`);
      checkSmartCompletion();
    }
    
    return () => {
      isMounted = false;
    };
  }, [state.isActive, currentStep?.id]);

  useEffect(() => {
    if (state.isActive && currentStep) {
      // Skip company setup step as it's handled separately
      if (currentStep.id === 'company-setup') {
        setIsVisible(false);
      } else if (['workers', 'clients', 'projects', 'timesheets', 'approvals', 'payroll'].includes(currentStep.id)) {
        // For steps that support smart completion
        const stepCompletion = smartCompletionRef.current[currentStep.id];
        console.log(`${currentStep.id} step detected, smart completion:`, stepCompletion);
        
        if (stepCompletion === true) {
          // Step is smart-completed, move to next step
          console.log(`${currentStep.id} step smart-completed, advancing to next step`);
          setIsVisible(false);
          // Use setTimeout to prevent immediate re-render
          setTimeout(() => {
            goToNextStep();
          }, 100);
        } else if (stepCompletion === false) {
          // Step is not completed, but don't navigate - let the user stay on current page
          console.log(`${currentStep.id} step not completed, staying on current page`);
          setIsVisible(false);
        } else {
          // Still loading, wait for smart completion check
          console.log('Smart completion still loading...');
          setIsVisible(false);
        }
      } else if (['dashboard'].includes(currentStep.id)) {
        // For steps that should navigate to their respective pages
        console.log(`${currentStep.id} step detected, navigating to ${currentStep.path}`);
        setIsVisible(false);
        router.push(currentStep.path);
      } else {
        setIsVisible(true);
        highlightElement(currentStep.id);
      }
    } else {
      setIsVisible(false);
      removeHighlight();
    }
  }, [state.isActive, currentStep?.id, highlightElement, removeHighlight, router, goToNextStep]);

  const findElementToHighlight = (stepId: string): HTMLElement | null => {
    switch (stepId) {
      case 'workers':
        return document.querySelector('[data-onboarding="add-worker-button"]') as HTMLElement;
      case 'clients':
        return document.querySelector('[data-onboarding="add-client-button"]') as HTMLElement;
      case 'projects':
        return document.querySelector('[data-onboarding="add-project-button"]') as HTMLElement;
      case 'timesheets':
        return document.querySelector('[data-onboarding="add-timesheet-button"]') as HTMLElement;
      case 'approvals':
        return document.querySelector('[data-onboarding="approvals-list"]') as HTMLElement;
      case 'payroll':
        return document.querySelector('[data-onboarding="payroll-settings"]') as HTMLElement;
      case 'dashboard':
        return document.querySelector('[data-onboarding="dashboard-stats"]') as HTMLElement;
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep) {
      toast.success(`Completed: ${currentStep.title}`);
    }
    goToNextStep();
  };

  const handlePrevious = () => {
    goToPreviousStep();
  };

  const handleSkip = () => {
    toast.info('Onboarding skipped. You can restart anytime from settings.');
    skipOnboarding();
  };

  const handleClose = () => {
    setIsVisible(false);
    removeHighlight();
  };

  if (!state.isActive || !currentStep) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {children}
      
      {/* Regular Onboarding Overlay */}
      {isVisible && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          {/* Highlighted area */}
          <div className="absolute inset-0 pointer-events-none">
            {highlightedElement && (
              <div 
                className="absolute border-2 border-blue-500 rounded-lg shadow-lg"
                style={{
                  top: highlightedElement.offsetTop - 8,
                  left: highlightedElement.offsetLeft - 8,
                  width: highlightedElement.offsetWidth + 16,
                  height: highlightedElement.offsetHeight + 16,
                }}
              />
            )}
          </div>

          {/* Onboarding card */}
          <div className="absolute bottom-8 left-8 right-8 max-w-md">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      Step {ONBOARDING_STEPS.findIndex(s => s.id === currentStep.id) + 1} of {ONBOARDING_STEPS.length}
                    </Badge>
                    {isStepCompleted(currentStep.id) && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg">{currentStep.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  {currentStep.description}
                </p>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={ONBOARDING_STEPS.findIndex(s => s.id === currentStep.id) === 0}
                      className="flex items-center"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Previous
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSkip}
                      className="flex items-center text-gray-500 hover:text-gray-700"
                    >
                      <SkipForward className="h-3 w-3 mr-1" />
                      Skip
                    </Button>
                  </div>

                  <Button
                    onClick={handleNext}
                    className="flex items-center"
                    size="sm"
                  >
                    {ONBOARDING_STEPS.findIndex(s => s.id === currentStep.id) === ONBOARDING_STEPS.length - 1 ? (
                      <>
                        Complete
                        <CheckCircle className="h-3 w-3 ml-1" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 