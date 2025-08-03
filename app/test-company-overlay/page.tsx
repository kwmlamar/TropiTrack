"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { CompanySetupOverlay } from '@/components/onboarding/company-setup-overlay';
import { toast } from 'sonner';

function TestCompanyOverlayContent() {
  const { 
    state, 
    startOnboarding, 
    completeStep,
    getCurrentStep,
    getProgress
  } = useOnboarding();

  const [showOverlay, setShowOverlay] = useState(false);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Company Setup Overlay Test</h1>
        <p className="text-gray-500">Test the company setup overlay that appears above the dashboard</p>
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
            
            <Button onClick={() => setShowOverlay(true)} variant="outline" className="w-full">
              Show Company Setup Overlay
            </Button>
            
            <Button onClick={simulateCompanySetup} variant="outline" className="w-full">
              Simulate Company Setup
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Mock Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Mock Dashboard (Background)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This simulates the dashboard that would be visible behind the company setup overlay.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold">Total Workers</h3>
              <p className="text-2xl font-bold text-blue-600">0</p>
            </div>
            <div className="p-4 border rounded-lg bg-green-50">
              <h3 className="font-semibold">Active Projects</h3>
              <p className="text-2xl font-bold text-green-600">0</p>
            </div>
            <div className="p-4 border rounded-lg bg-purple-50">
              <h3 className="font-semibold">This Week&apos;s Hours</h3>
              <p className="text-2xl font-bold text-purple-600">0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Setup Overlay */}
      <CompanySetupOverlay 
        isVisible={showOverlay}
        onClose={() => setShowOverlay(false)}
      />
    </div>
  );
}

export default function TestCompanyOverlayPage() {
  return (
    <OnboardingProvider>
      <TestCompanyOverlayContent />
    </OnboardingProvider>
  );
} 