"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { OnboardingOverlay } from '@/components/onboarding/onboarding-overlay';
import { toast } from 'sonner';

function TestDashboardOverlayContent() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mock Dashboard Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Test User</Badge>
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Dashboard Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Workers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-gray-500">No workers added yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-gray-500">No projects created yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Week&apos;s Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">0</p>
              <p className="text-sm text-gray-500">No time logged yet</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button variant="outline" className="h-20">
                <div className="text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-sm">Add Worker</div>
                </div>
              </Button>
              <Button variant="outline" className="h-20">
                <div className="text-center">
                  <div className="text-2xl mb-2">🏢</div>
                  <div className="text-sm">Add Client</div>
                </div>
              </Button>
              <Button variant="outline" className="h-20">
                <div className="text-center">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-sm">Create Project</div>
                </div>
              </Button>
              <Button variant="outline" className="h-20">
                <div className="text-center">
                  <div className="text-2xl mb-2">⏰</div>
                  <div className="text-sm">Log Time</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Onboarding Status:</span>
              <Badge variant={state.isActive ? "default" : "secondary"}>
                {state.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            {currentStep && (
              <div className="flex items-center justify-between">
                <span>Current Step:</span>
                <span className="font-medium">{currentStep.title}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span>Progress:</span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div className="flex space-x-2">
              <Button onClick={startOnboarding} variant="outline">
                Start Onboarding
              </Button>
              <Button onClick={simulateCompanySetup} variant="outline">
                Simulate Company Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Overlay */}
      <OnboardingOverlay>
        <div></div>
      </OnboardingOverlay>
    </div>
  );
}

export default function TestDashboardOverlayPage() {
  return (
    <OnboardingProvider>
      <TestDashboardOverlayContent />
    </OnboardingProvider>
  );
} 