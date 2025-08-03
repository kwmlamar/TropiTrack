"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { SetupGuideDropdown } from '@/components/onboarding/setup-guide-dropdown';
import { toast } from 'sonner';

function TestSetupGuideContent() {
  const { 
    state, 
    startOnboarding, 
    completeStep,
    getCurrentStep,
    getProgress
  } = useOnboarding();

  const currentStep = getCurrentStep();
  const progress = getProgress();

  const simulateCompanySetup = () => {
    completeStep('company-setup', {
      company_name: 'Test Construction Co.',
      industry: 'Construction',
      address: '123 Test Street',
      phone: '+1 (242) 555-0123'
    });
    toast.success('Company setup completed!');
  };

  const simulateWorkerSetup = () => {
    completeStep('workers', {
      name: 'John Smith',
      email: 'john@test.com',
      phone: '+1 (242) 555-0124',
      position: 'Carpenter',
      hourly_rate: '25.00',
      start_date: '2024-01-01'
    });
    toast.success('Worker setup completed!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Setup Guide Dropdown Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-600">
              This page tests the setup guide dropdown that appears in the bottom right corner.
              The dropdown shows all onboarding steps and their completion status.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold">Onboarding Status</h3>
                <div className="space-y-2">
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
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Test Actions</h3>
                <div className="space-y-2">
                  <Button onClick={startOnboarding} className="w-full">
                    Start Onboarding
                  </Button>
                  
                  <Button onClick={simulateCompanySetup} variant="outline" className="w-full">
                    Complete Company Setup
                  </Button>
                  
                  <Button onClick={simulateWorkerSetup} variant="outline" className="w-full">
                    Complete Worker Setup
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Click &quot;Start Onboarding&quot; to activate the setup guide</li>
                <li>Look for the &quot;Setup Guide&quot; button in the bottom right corner</li>
                <li>Click the dropdown to see all onboarding steps</li>
                <li>Use the &quot;Complete&quot; buttons to simulate step completion</li>
                <li>Watch the progress update in the dropdown</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Setup Guide Dropdown */}
      <SetupGuideDropdown />
    </div>
  );
}

export default function TestSetupGuidePage() {
  return (
    <OnboardingProvider>
      <TestSetupGuideContent />
    </OnboardingProvider>
  );
} 