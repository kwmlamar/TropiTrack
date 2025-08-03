"use client";

import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { ONBOARDING_STEPS } from '@/lib/types/onboarding';
import { useOnboarding } from '@/context/onboarding-context';

export function OnboardingProgress() {
  const { isStepCompleted } = useOnboarding();

  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {ONBOARDING_STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
            isStepCompleted(step.id) 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 text-gray-500'
          }`}>
            {isStepCompleted(step.id) ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </div>
          {index < ONBOARDING_STEPS.length - 1 && (
            <div className={`w-12 h-0.5 mx-2 ${
              isStepCompleted(step.id) ? 'bg-green-500' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
} 