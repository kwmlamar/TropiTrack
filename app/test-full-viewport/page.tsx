"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { CompanySetupOverlayProvider } from '@/components/onboarding/company-setup-overlay-provider';
import { toast } from 'sonner';

function TestFullViewportContent() {
  const { 
    startOnboarding, 
    completeStep
  } = useOnboarding();

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
      {/* Mock Site Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Site Header</h1>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">User Menu</Badge>
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Sidebar</h2>
          <div className="space-y-2">
            <div className="p-2 hover:bg-gray-100 rounded">Dashboard</div>
            <div className="p-2 hover:bg-gray-100 rounded">Workers</div>
            <div className="p-2 hover:bg-gray-100 rounded">Clients</div>
            <div className="p-2 hover:bg-gray-100 rounded">Projects</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        <div className="max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Full Viewport Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                This page simulates the full dashboard layout with header and sidebar. 
                The company setup overlay should cover the entire viewport including the header and sidebar.
              </p>
              
              <div className="flex space-x-2">
                <Button onClick={startOnboarding} variant="outline">
                  Start Onboarding
                </Button>
                <Button onClick={simulateCompanySetup} variant="outline">
                  Simulate Company Setup
                </Button>
              </div>

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
        </div>
      </div>

      {/* Company Setup Overlay Provider */}
      <CompanySetupOverlayProvider />
    </div>
  );
}

export default function TestFullViewportPage() {
  return (
    <OnboardingProvider>
      <TestFullViewportContent />
    </OnboardingProvider>
  );
} 