"use client";

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
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
import { 
  completeOnboardingStep, 
  getOnboardingProgress, 
  markOnboardingComplete,
  startOnboardingForUser,
  saveOnboardingData,
  getOnboardingData
} from '@/lib/actions/onboarding-actions';
import { getAuthUserId } from '@/lib/data/userProfiles';

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
    
    case 'LOAD_PROGRESS':
      return {
        ...state,
        completedSteps: action.completedSteps || [],
        data: action.data || {},
        isLoading: false,
        error: null,
      };
    
    default:
      return state;
  }
}

// Context
interface OnboardingContextType {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  startOnboarding: () => Promise<void>;
  completeStep: (stepId: string, data?: Record<string, any>) => Promise<void>;
  saveOnboardingData: (data: Record<string, any>) => Promise<void>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (stepId: string) => void;
  resetOnboarding: () => void;
  skipOnboarding: () => void;
  closeCurrentStep: () => void;
  getCurrentStep: () => OnboardingStep | null;
  getProgress: () => number;
  isStepCompleted: (stepId: string) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Provider component
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const router = useRouter();
  const isLoadingRef = useRef(false);

  // Load onboarding progress from database on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadOnboardingProgress = async () => {
      try {
        if (!isMounted) return;
        
        // Prevent multiple simultaneous loads
        if (isLoadingRef.current) {
          return;
        }
        
        isLoadingRef.current = true;
        dispatch({ type: 'SET_LOADING', loading: true });
        
        let userId;
        try {
          userId = await getAuthUserId();
        } catch (authError) {
          console.log('User not authenticated, skipping onboarding load');
          if (isMounted) {
            isLoadingRef.current = false;
            dispatch({ type: 'SET_LOADING', loading: false });
          }
          return;
        }
        
        if (!isMounted) return;
        
        const progress = await getOnboardingProgress(userId);
        const onboardingData = await getOnboardingData(userId);
        
        if (!isMounted) return;
        
        // Extract completed steps from database
        const completedSteps = progress.map(p => p.step_name);
        
        // Update state with database data
        dispatch({ 
          type: 'LOAD_PROGRESS', 
          completedSteps, 
          data: onboardingData || {} 
        });
        
        // Check if onboarding is complete
        const isOnboardingComplete = completedSteps.length >= ONBOARDING_STEPS.length;
        
        if (!isOnboardingComplete) {
          // Activate onboarding if not complete
          dispatch({ type: 'START_ONBOARDING' });
          
          // Set current step based on progress
          const nextIncompleteStep = ONBOARDING_STEPS.find(step => 
            !completedSteps.includes(step.id)
          );
          
          if (nextIncompleteStep) {
            dispatch({ type: 'SET_CURRENT_STEP', step: nextIncompleteStep.id });
          }
        }
        
        if (isMounted) {
          isLoadingRef.current = false;
          dispatch({ type: 'SET_LOADING', loading: false });
        }
      } catch (error) {
        console.error('Error loading onboarding progress:', error);
        if (isMounted) {
          isLoadingRef.current = false;
          dispatch({ type: 'SET_ERROR', error: 'Failed to load onboarding progress' });
        }
      }
    };

    loadOnboardingProgress();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-navigate to current step page when onboarding is active
  // Disabled to prevent navigation loops
  /*
  useEffect(() => {
    // Only run navigation after progress has been loaded and onboarding is active
    if (typeof window !== 'undefined' && !state.isLoading && !state.error && state.isActive && state.currentStep) {
      const currentStep = getStepById(state.currentStep);
      if (currentStep && currentStep.path !== window.location.pathname) {
        // Only navigate if we're not already on the correct page
        // This prevents navigation loops
        console.log(`Auto-navigating from ${window.location.pathname} to ${currentStep.path}`);
        router.push(currentStep.path);
      }
    }
  }, [state.currentStep, state.isActive, state.isLoading, state.error, router]);
  */

  const startOnboarding = async () => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      
      const userId = await getAuthUserId();
      await startOnboardingForUser(userId);
      
      dispatch({ type: 'START_ONBOARDING' });
      const firstStep = ONBOARDING_STEPS[0];
      if (firstStep) {
        // For company setup, don't navigate - it will show as overlay
        if (firstStep.id === 'company-setup') {
          dispatch({ type: 'SET_CURRENT_STEP', step: firstStep.id });
        } else {
          router.push(firstStep.path);
        }
      }
      
      dispatch({ type: 'SET_LOADING', loading: false });
    } catch (error) {
      console.error('Error starting onboarding:', error);
      dispatch({ type: 'SET_ERROR', error: 'Failed to start onboarding' });
    }
  };

  const completeStep = async (stepId: string, data?: Record<string, any>) => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      
      const userId = await getAuthUserId();
      
      // Save step completion to database
      const result = await completeOnboardingStep(userId, stepId, data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save step completion');
      }
      
      // Update local state
      dispatch({ type: 'COMPLETE_STEP', step: stepId, data });
      
      // Auto-advance to next step
      const nextStep = getNextStep(stepId);
      if (nextStep) {
        dispatch({ type: 'SET_CURRENT_STEP', step: nextStep.id });
        // For company setup completion, navigate to workers page
        if (stepId === 'company-setup') {
          router.push('/dashboard/workers');
        } else {
          router.push(nextStep.path);
        }
      } else {
        // Onboarding is complete - mark as complete in database
        const completeResult = await markOnboardingComplete(userId);
        if (!completeResult.success) {
          console.error('Error marking onboarding complete:', completeResult.error);
        }
        
        dispatch({ type: 'RESET_ONBOARDING' });
        toast.success('Onboarding completed! Welcome to TropiTrack!');
        router.push('/dashboard');
      }
      
      dispatch({ type: 'SET_LOADING', loading: false });
    } catch (error) {
      console.error('Error completing step:', error);
      dispatch({ type: 'SET_ERROR', error: 'Failed to save progress' });
      toast.error('Failed to save progress. Please try again.');
    }
  };

  const saveOnboardingData = async (data: Record<string, any>) => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      
      const userId = await getAuthUserId();
      const result = await saveOnboardingData(userId, data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save onboarding data');
      }
      
      // Update local state
      dispatch({ type: 'UPDATE_DATA', data });
      
      dispatch({ type: 'SET_LOADING', loading: false });
      toast.success('Progress saved!');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      dispatch({ type: 'SET_ERROR', error: 'Failed to save data' });
      toast.error('Failed to save data. Please try again.');
    }
  };

  const goToNextStep = () => {
    if (!state.currentStep) return;
    
    const nextStep = getNextStep(state.currentStep);
    if (nextStep) {
      dispatch({ type: 'SET_CURRENT_STEP', step: nextStep.id });
      // For company setup, navigate to workers page
      if (state.currentStep === 'company-setup') {
        router.push('/dashboard/workers');
      } else {
        router.push(nextStep.path);
      }
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
      // For company setup, don't navigate - it will show as overlay
      if (stepId === 'company-setup') {
        // Don't navigate, just set the step
      } else {
        router.push(step.path);
      }
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

  const closeCurrentStep = () => {
    if (state.currentStep === 'company-setup') {
      // For company setup, just close the overlay without resetting onboarding
      dispatch({ type: 'SET_CURRENT_STEP', step: null });
    } else {
      // For other steps, skip the entire onboarding
      skipOnboarding();
    }
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
    saveOnboardingData,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetOnboarding,
    skipOnboarding,
    closeCurrentStep,
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