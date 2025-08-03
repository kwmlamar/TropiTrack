"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Test imports
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { ONBOARDING_STEPS } from '@/lib/types/onboarding';


function TestImportsContent() {
  const { state, startOnboarding } = useOnboarding();

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p>If you can see this page, all imports are working correctly!</p>
          <p>Onboarding state: {state.isActive ? 'Active' : 'Inactive'}</p>
          <p>Number of steps: {ONBOARDING_STEPS.length}</p>
          <Button onClick={startOnboarding}>
            Test Start Onboarding
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TestImportsPage() {
  return (
    <OnboardingProvider>
      <TestImportsContent />
    </OnboardingProvider>
  );
} 