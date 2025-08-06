"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useOnboarding } from "@/context/onboarding-context";
import { getNextStep, getPreviousStep } from "@/lib/types/onboarding";
import { ArrowLeft, ArrowRight, CheckCircle, X } from "lucide-react";
import { TimesheetsStep } from "./steps/timesheets-step";
import { WorkersStep } from "./steps/workers-step";
import { ClientsStep } from "./steps/clients-step";
import { ProjectsStep } from "./steps/projects-step";
import { ApprovalsStep } from "./steps/approvals-step";
import { PayrollStep } from "./steps/payroll-step";
import { DashboardStep } from "./steps/dashboard-step";

// Component mapping
const COMPONENT_MAP: Record<string, React.ComponentType> = {
  'TimesheetsStep': TimesheetsStep,
  'WorkersStep': WorkersStep,
  'ClientsStep': ClientsStep,
  'ProjectsStep': ProjectsStep,
  'ApprovalsStep': ApprovalsStep,
  'PayrollStep': PayrollStep,
  'DashboardStep': DashboardStep,
  'CompanySetupOverlay': () => <div>Company Setup Component</div>,
};

// Wrapper component that safely uses the onboarding context
function OnboardingOverlayContent({ children }: { children: React.ReactNode }) {
  const { 
    state, 
    getCurrentStep, 
    goToNextStep, 
    goToPreviousStep, 
    closeCurrentStep,
    getProgress
  } = useOnboarding();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStep = getCurrentStep();
  const progress = getProgress();

  const handleNext = useCallback(() => {
    if (currentStep) {
      const nextStep = getNextStep(currentStep.id);
      if (nextStep) {
        goToNextStep();
      } else {
        // Onboarding is complete
        closeCurrentStep();
      }
    }
  }, [currentStep, goToNextStep, closeCurrentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep) {
      const previousStep = getPreviousStep(currentStep.id);
      if (previousStep) {
        goToPreviousStep();
      }
    }
  }, [currentStep, goToPreviousStep]);

  // Check if overlay should be visible
  useEffect(() => {
    const shouldShow = state.isActive && currentStep !== null;
    setIsVisible(shouldShow);
    
    if (shouldShow) {
      setLastCheckTime(Date.now());
    }
  }, [state.isActive, currentStep]);

  // Auto-hide overlay after inactivity
  useEffect(() => {
    if (!state.isActive || !currentStep) return;

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastCheckTime;
      
      if (timeSinceLastActivity > 30000) { // 30 seconds
        setIsMinimized(true);
      }
    };

    const interval = setInterval(checkInactivity, 5000);
    return () => clearInterval(interval);
  }, [lastCheckTime, state.isActive, currentStep]);

  // Update last activity time on user interaction
  const updateActivity = () => {
    setLastCheckTime(Date.now());
    setIsMinimized(false);
  };

  if (!isVisible) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {children}
      
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-all duration-300 ${
          isMinimized ? 'opacity-50' : 'opacity-100'
        }`}
        onClick={updateActivity}
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {currentStep?.title || 'Onboarding'}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {currentStep?.description || 'Complete the setup process'}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8 p-0"
                  >
                    {isMinimized ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmation(true)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {/* Step Content */}
              <div className="min-h-[200px]">
                {currentStep?.component && COMPONENT_MAP[currentStep.component] && (
                  React.createElement(COMPONENT_MAP[currentStep.component])
                )}
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex items-center gap-2">
                  {currentStep && getPreviousStep(currentStep.id) && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      className="gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {currentStep && (
                    <Button
                      onClick={handleNext}
                      className="gap-2"
                      disabled={state.isLoading}
                    >
                      {getNextStep(currentStep.id) ? (
                        <>
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Complete Setup
                          <CheckCircle className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Exit Onboarding?</CardTitle>
              <CardDescription>
                Are you sure you want to exit the onboarding process? You can always restart it later.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                className="flex-1"
              >
                Continue Setup
              </Button>
              <Button
                onClick={() => {
                  closeCurrentStep();
                  setShowConfirmation(false);
                }}
                className="flex-1"
              >
                Exit Setup
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Main component that handles provider availability
export function OnboardingOverlay({ children }: { children: React.ReactNode }) {
  try {
    return <OnboardingOverlayContent>{children}</OnboardingOverlayContent>;
  } catch {
    console.warn('OnboardingProvider not available, skipping OnboardingOverlay render');
    return <>{children}</>;
  }
} 