"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Maximize2, Minimize2 } from 'lucide-react';
import { useOnboarding } from '@/context/onboarding-context';
import { ONBOARDING_STEPS, getNextStep } from '@/lib/types/onboarding';
import { isStepSmartCompleted } from '@/components/onboarding/smart-completion-checks';

export function SetupGuideDropdown() {
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

  // Check smart completion for all supported steps
  useEffect(() => {
    async function checkSmartCompletion() {
      const supportedSteps = ['workers', 'clients', 'projects'];
      
      for (const stepId of supportedSteps) {
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
    }

    checkSmartCompletion();
  }, []);

  // Check if company setup overlay is visible
  const isCompanySetupVisible = state.isActive && currentStep?.id === 'company-setup';

  // Hide setup guide when company setup overlay is visible
  if (isCompanySetupVisible) {
    return null;
  }

  // Smart completion check function
  const isStepSmartCompletedLocal = (stepId: string): boolean => {
    if (['workers', 'clients', 'projects'].includes(stepId) && smartCompletion[stepId] !== null) {
      return smartCompletion[stepId] || false;
    }
    return isStepCompleted(stepId);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`bg-white/95 backdrop-blur-sm border shadow-2xl transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-64'
      }`}>
        <CardHeader className="pb-2">
          <div className="relative">
            <CardTitle className="text-sm font-semibold">
              Setup Guide
            </CardTitle>
            <div className="w-full bg-gray-300 rounded-full h-1.5 mt-3">
              <div 
                className="bg-muted-foreground h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(progress, 0)}%` }}
              />
            </div>
            {!isExpanded && state.isActive && currentStep && (
              <p className="text-sm text-gray-500 mt-2">
                Next: <span className="text-muted-foreground">{getNextStep(currentStep.id)?.title || 'Complete setup'}</span>
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
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
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
                        goToStep(step.id);
                        setIsExpanded(false);
                      }}
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 rounded-md transition-colors ${
                        isCurrent ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6">
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${
                              isCompleted ? 'text-green-600' : 
                              isCurrent ? 'text-blue-600' : 'text-gray-700'
                            }`}>
                              {step.title}
                            </span>
                            {isCurrent && (
                              <Badge variant="secondary" className="text-xs">
                                Current
                              </Badge>
                            )}

                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {index + 1}/{ONBOARDING_STEPS.length}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show overview of steps when not active
              <div className="space-y-2">
                {ONBOARDING_STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3 p-3 rounded-md">
                    <div className="flex items-center justify-center w-6 h-6">
                      <Circle className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">
                          {step.title}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {step.description}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {index + 1}/{ONBOARDING_STEPS.length}
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t">
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
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
} 