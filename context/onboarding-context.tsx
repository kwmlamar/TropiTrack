"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { 
  OnboardingState, 
  OnboardingAction, 
  OnboardingData,
  OnboardingStep
} from '@/lib/types/onboarding';
import { 
  ONBOARDING_STEPS,
  getStepById,
  getNextStep,
  getPreviousStep
} from '@/lib/types/onboarding';

// Initial state
const initialState: OnboardingState = {
  isActive: false,
  currentStep: null,
  completedSteps: [],
  data: {},
  isLoading: false,
  error: null,
};

// Reducer function
function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'START_ONBOARDING':
      return {
        ...state,
        isActive: true,
        currentStep: ONBOARDING_STEPS[0]?.id || null,
        isLoading: false,
        error: null,
      };
    
    case 'COMPLETE_STEP':
      return {
        ...state,
        completedSteps: [...state.completedSteps, action.step],
        data: {
          ...state.data,
          ...action.data,
        },
      };
    
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.step,
      };
    
    case 'UPDATE_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          ...action.data,
        },
      };
    
    case 'RESET_ONBOARDING':
      return {
        ...initialState,
        isActive: false,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.loading,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false,
      };
    
    default:
      return state;
  }
}

// Context
interface OnboardingContextType {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  startOnboarding: () => void;
  completeStep: (stepId: string, data?: Record<string, any>) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (stepId: string) => void;
  resetOnboarding: () => void;
  skipOnboarding: () => void;
  getCurrentStep: () => OnboardingStep | null;
  getProgress: () => number;
  isStepCompleted: (stepId: string) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Provider component
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const router = useRouter();

  const startOnboarding = () => {
    dispatch({ type: 'START_ONBOARDING' });
    const firstStep = ONBOARDING_STEPS[0];
    if (firstStep) {
      router.push(firstStep.path);
    }
  };

  const completeStep = (stepId: string, data?: Record<string, any>) => {
    dispatch({ type: 'COMPLETE_STEP', step: stepId, data });
    
    // Auto-advance to next step
    const nextStep = getNextStep(stepId);
    if (nextStep) {
      dispatch({ type: 'SET_CURRENT_STEP', step: nextStep.id });
      router.push(nextStep.path);
    } else {
      // Onboarding is complete
      dispatch({ type: 'RESET_ONBOARDING' });
      toast.success('Onboarding completed! Welcome to TropiTrack!');
      router.push('/dashboard');
    }
  };

  const goToNextStep = () => {
    if (!state.currentStep) return;
    
    const nextStep = getNextStep(state.currentStep);
    if (nextStep) {
      dispatch({ type: 'SET_CURRENT_STEP', step: nextStep.id });
      router.push(nextStep.path);
    }
  };

  const goToPreviousStep = () => {
    if (!state.currentStep) return;
    
    const previousStep = getPreviousStep(state.currentStep);
    if (previousStep) {
      dispatch({ type: 'SET_CURRENT_STEP', step: previousStep.id });
      router.push(previousStep.path);
    }
  };

  const goToStep = (stepId: string) => {
    const step = getStepById(stepId);
    if (step) {
      dispatch({ type: 'SET_CURRENT_STEP', step: stepId });
      router.push(step.path);
    }
  };

  const resetOnboarding = () => {
    dispatch({ type: 'RESET_ONBOARDING' });
    toast.info('Onboarding reset. You can restart anytime from settings.');
  };

  const skipOnboarding = () => {
    dispatch({ type: 'RESET_ONBOARDING' });
    toast.info('Onboarding skipped. You can restart anytime from settings.');
    router.push('/dashboard');
  };

  const getCurrentStep = (): OnboardingStep | null => {
    if (!state.currentStep) return null;
    return getStepById(state.currentStep) || null;
  };

  const getProgress = (): number => {
    if (ONBOARDING_STEPS.length === 0) return 0;
    return (state.completedSteps.length / ONBOARDING_STEPS.length) * 100;
  };

  const isStepCompleted = (stepId: string): boolean => {
    return state.completedSteps.includes(stepId);
  };

  const value: OnboardingContextType = {
    state,
    dispatch,
    startOnboarding,
    completeStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetOnboarding,
    skipOnboarding,
    getCurrentStep,
    getProgress,
    isStepCompleted,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Hook to use onboarding context
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
} 