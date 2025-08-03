"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { ONBOARDING_STEPS } from '@/lib/types/onboarding';
import { toast } from 'sonner';

function TestOnboardingFlowContent() {
  const { 
    state, 
    startOnboarding, 
    completeStep, 
    goToStep,
    getCurrentStep,
    getProgress,
    isStepCompleted 
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Onboarding Flow Test</h1>
        <p className="text-gray-500">Test the complete onboarding flow</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={startOnboarding} className="w-full">
              Start Onboarding
            </Button>
            
            <Button onClick={simulateCompanySetup} variant="outline" className="w-full">
              Simulate Company Setup
            </Button>
            
            <Button onClick={simulateWorkerSetup} variant="outline" className="w-full">
              Simulate Worker Setup
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Step Status */}
      <Card>
        <CardHeader>
          <CardTitle>Step Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ONBOARDING_STEPS.map((step) => (
              <div key={step.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{step.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    Step {step.order}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={isStepCompleted(step.id) ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {isStepCompleted(step.id) ? 'Completed' : 'Pending'}
                  </Badge>
                  <Button
                    onClick={() => goToStep(step.id)}
                    size="sm"
                    variant="ghost"
                  >
                    Go to Step
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Test */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            After completing company setup, you should be automatically redirected to the workers page 
            where the &quot;Add Worker&quot; button will be highlighted.
          </p>
          <div className="grid gap-2 md:grid-cols-3">
            <Button 
              onClick={() => window.open('/dashboard/workers', '_blank')}
              variant="outline"
              size="sm"
            >
              Open Workers Page
            </Button>
            <Button 
              onClick={() => window.open('/dashboard/clients', '_blank')}
              variant="outline"
              size="sm"
            >
              Open Clients Page
            </Button>
            <Button 
              onClick={() => window.open('/dashboard/projects', '_blank')}
              variant="outline"
              size="sm"
            >
              Open Projects Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TestOnboardingFlowPage() {
  return (
    <OnboardingProvider>
      <TestOnboardingFlowContent />
    </OnboardingProvider>
  );
} 