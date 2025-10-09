"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Circle, Maximize2, Minimize2 } from 'lucide-react';
import { useOnboarding } from '@/context/onboarding-context';
import { ONBOARDING_STEPS, getNextIncompleteStep } from '@/lib/types/onboarding';
import { isStepSmartCompleted } from '@/components/onboarding/smart-completion-checks';
import { checkOnboardingStatus } from '@/lib/actions/onboarding-actions';
import { getAuthUserId } from '@/lib/data/userProfiles';

// Wrapper component that safely uses the onboarding context
function SetupGuideDropdownContent() {
  const { theme } = useTheme();
  const { 
    state, 
    getCurrentStep, 
    goToStep, 
    isStepCompleted,
    getProgress,
    startOnboarding
  } = useOnboarding();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [smartCompletion, setSmartCompletion] = useState<{ [key: string]: boolean | null }>({});

  const currentStep = getCurrentStep();
  const progress = getProgress();

  // Ensure onboarding progress is loaded
  useEffect(() => {
    const ensureProgressLoaded = async () => {
      try {
        const userId = await getAuthUserId();
        const { completedSteps } = await checkOnboardingStatus(userId);
        console.log('SetupGuideDropdown - Loaded progress:', { 
          completedSteps, 
          isActive: state.isActive,
          currentStep: currentStep?.id,
          pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
        });
      } catch (error) {
        console.error('Error ensuring progress loaded:', error);
      }
    };
    if (state.isActive && state.completedSteps.length === 0 && !state.isLoading) {
      ensureProgressLoaded();
    }
  }, [state.isActive, state.completedSteps.length, state.isLoading, currentStep?.id]);

  // Debug logging for current state
  useEffect(() => {
    console.log('SetupGuideDropdown - State:', { 
      isActive: state.isActive,
      currentStep: currentStep?.id,
      completedSteps: state.completedSteps,
      progress,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      nextIncompleteStep: getNextIncompleteStep(state.completedSteps)?.id
    });
  }, [state.isActive, currentStep, state.completedSteps, progress]);

  // Check smart completion for all supported steps (optimized to run less frequently)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    async function checkSmartCompletion() {
      // Debounce smart completion checks to avoid excessive API calls
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const supportedSteps = ['workers', 'clients', 'projects', 'timesheets', 'approvals'];
        
        // Only check steps that are not already completed
        const stepsToCheck = supportedSteps.filter(stepId => !state.completedSteps.includes(stepId));
        
        if (stepsToCheck.length === 0) {
          return; // No need to check if all steps are already completed
        }
        
        for (const stepId of stepsToCheck) {
          try {
            const { isCompleted } = await isStepSmartCompleted(stepId);
            setSmartCompletion(prev => ({
              ...prev,
              [stepId]: isCompleted
            }));
          } catch (error) {
            console.error(`Error checking smart completion for ${stepId}:`, error);
            setSmartCompletion(prev => ({
              ...prev,
              [stepId]: false
            }));
          }
        }
      }, 1000); // 1 second debounce
    }

    // Only run smart completion checks if onboarding is active
    if (state.isActive) {
      checkSmartCompletion();
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [state.isActive, state.completedSteps]);

  // Hide setup guide when all steps are completed (progress = 100%)
  if (progress >= 100) {
    return null;
  }

  // Don't hide setup guide when company setup dialog is visible - it should remain visible
  // throughout the onboarding process

  // Smart completion check function
  const isStepSmartCompletedLocal = (stepId: string): boolean => {
    if (['workers', 'clients', 'projects', 'timesheets', 'approvals'].includes(stepId) && smartCompletion[stepId] !== null) {
      return smartCompletion[stepId] || false;
    }
    return isStepCompleted(stepId);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`backdrop-blur-sm shadow-2xl transition-all duration-300 rounded-lg ${
          isExpanded ? 'w-80' : 'w-64'
        }`}
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(23, 23, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240)'
        }}
      >
        <div className="p-4 pb-2 pt-2">
          <div className="relative">
            <h3 
              className="text-sm font-semibold"
              style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
            >
              Setup Guide
            </h3>
            <div 
              className="w-full rounded-full h-1.5 mt-3"
              style={{ backgroundColor: theme === 'dark' ? '#404040' : 'rgb(209 213 219)' }}
            >
              <div 
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.max(progress, 0)}%`,
                  backgroundColor: '#01a2be'
                }}
              />
            </div>
            {!isExpanded && state.isActive && currentStep && (
              <p 
                className="text-sm mt-2"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                Next: <span style={{ color: '#01a2be' }}>{getNextIncompleteStep(state.completedSteps)?.title || 'Complete setup'}</span>
              </p>
            )}
            {!isExpanded && !state.isActive && (
              <p 
                className="text-sm mt-2"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                <span style={{ color: '#01a2be' }}>Setup guide available</span>
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute top-0 right-0 h-6 w-6 p-0"
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="px-4 pb-4">
            {state.isActive ? (
              // Show onboarding steps when active
              <div className="space-y-2">
                {ONBOARDING_STEPS.map((step, index) => {
                  const isCompleted = isStepSmartCompletedLocal(step.id);
                  const isCurrent = currentStep?.id === step.id;
                  
                  return (
                    <div
                      key={step.id}
                      onClick={() => {
                        if (step.id === 'company-setup') {
                          // Company setup dialog removed - users go directly to dashboard
                        } else {
                          goToStep(step.id);
                        }
                        setIsExpanded(false);
                      }}
                      className="flex items-center justify-between p-3 cursor-pointer rounded-md transition-colors"
                      style={{
                        backgroundColor: isCurrent 
                          ? (theme === 'dark' ? '#262626' : 'rgba(195,209,239,0.2)') 
                          : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f1f1f' : 'rgb(249 250 251)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6">
                          {isCompleted ? (
                            <div 
                              className="w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: theme === 'dark' ? '#01a2be' : '#6b7280' }}
                            >
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                            </div>
                          ) : (
                            <Circle 
                              className="h-4 w-4"
                              style={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
                            />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span 
                              className="text-sm font-medium"
                              style={{
                                color: isCurrent 
                                  ? (theme === 'dark' ? '#01a2be' : '#6b7280')
                                  : (theme === 'dark' ? '#d1d5db' : '#374151')
                              }}
                            >
                              {step.title}
                            </span>

                          </div>
                          <p 
                            className="text-xs mt-1"
                            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                      
                      <div 
                        className="text-xs"
                        style={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
                      >
                        {index + 1}/{ONBOARDING_STEPS.length}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show overview of steps when not active
              <div className="space-y-2">
                {state.isLoading ? (
                  // Show loading state
                  <div className="text-center py-4">
                    <div 
                      className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto"
                      style={{ borderColor: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                    ></div>
                    <p 
                      className="text-sm mt-2"
                      style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                    >Loading progress...</p>
                  </div>
                ) : (
                  <>
                    {ONBOARDING_STEPS.map((step, index) => (
                      <div key={step.id} className="flex items-center space-x-3 p-3 rounded-md">
                        <div className="flex items-center justify-center w-6 h-6">
                          <Circle 
                            className="h-4 w-4"
                            style={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span 
                              className="text-sm font-medium"
                              style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
                            >
                              {step.title}
                            </span>
                          </div>
                          <p 
                            className="text-xs mt-1"
                            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                          >
                            {step.description}
                          </p>
                        </div>
                        <div 
                          className="text-xs"
                          style={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
                        >
                          {index + 1}/{ONBOARDING_STEPS.length}
                        </div>
                      </div>
                    ))}
                    <div 
                      className="pt-3"
                      style={{ 
                        borderTop: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240)' 
                      }}
                    >
                      <Button 
                        onClick={() => {
                          startOnboarding();
                          setIsExpanded(false);
                        }}
                        size="sm"
                        className="w-full"
                      >
                        Start Onboarding
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Main component that handles provider availability
export function SetupGuideDropdown() {
  try {
    return <SetupGuideDropdownContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping SetupGuideDropdown render');
    return null;
  }
} 