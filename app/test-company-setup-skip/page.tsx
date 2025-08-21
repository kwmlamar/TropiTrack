"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompanySetupDialog, triggerCompanySetupDialog } from '@/components/company-setup-dialog';
import { OnboardingCompanySetupDialog } from '@/components/onboarding/onboarding-company-setup-dialog';
import { OnboardingProvider } from '@/context/onboarding-context';
import { toast } from 'sonner';

interface CompanyStatus {
  needsSetup: boolean;
  company?: {
    name: string;
    setup_completed?: boolean;
  };
  error?: string;
}

export default function TestCompanySetupSkip() {
  const [companyStatus, setCompanyStatus] = useState<CompanyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false);

  const checkCompanySetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/check-company-setup");
      const data = await response.json();
      setCompanyStatus(data);
      toast.success("Company setup status checked");
    } catch {
      toast.error("Failed to check company setup status");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDialog = () => {
    triggerCompanySetupDialog();
    toast.success("Company setup dialog triggered");
  };

  const testSkipAPI = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/company-setup-skip", {
        method: "POST",
      });
      const data = await response.json();
      
      if (response.ok) {
        toast.success("Skip API called successfully");
        // Refresh the status
        await checkCompanySetup();
      } else {
        toast.error("Skip API failed: " + data.error);
      }
    } catch {
      toast.error("Failed to call skip API");
    } finally {
      setIsLoading(false);
    }
  };

  const resetCompanyName = async () => {
    setIsLoading(true);
    try {
      // This would need to be implemented as a separate API endpoint
      // For now, just show a message
      toast.info("Reset functionality would need a separate API endpoint");
    } catch {
      toast.error("Failed to reset company name");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Company Setup Skip
          </h1>
          <p className="text-gray-600">
            Test the company setup dialog skip functionality
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={checkCompanySetup} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Checking..." : "Check Company Setup Status"}
              </Button>
              
              <Button 
                onClick={triggerDialog}
                variant="outline"
                className="w-full"
              >
                Trigger Standalone Dialog
              </Button>

              <Button 
                onClick={() => setShowOnboardingDialog(true)}
                variant="outline"
                className="w-full"
              >
                Show Onboarding Dialog
              </Button>

              <Button 
                onClick={testSkipAPI}
                variant="outline"
                className="w-full"
              >
                Test Skip API Directly
              </Button>

              <Button 
                onClick={resetCompanyName}
                variant="destructive"
                className="w-full"
              >
                Reset Company Name (for testing)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              {companyStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Needs Setup:</span>
                    <Badge variant={companyStatus.needsSetup ? "destructive" : "default"}>
                      {companyStatus.needsSetup ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Company Name:</span>
                    <span className="text-sm text-gray-600">{companyStatus.company?.name || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Setup Completed:</span>
                    <Badge variant={companyStatus.company?.setup_completed ? "default" : "secondary"}>
                      {companyStatus.company?.setup_completed ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                    <strong>Raw API Response:</strong>
                    <pre className="mt-1 overflow-auto">
                      {JSON.stringify(companyStatus, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Click &quot;Check Company Setup Status&quot; to see current state</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
                          <p>1. Click &quot;Check Company Setup Status&quot; to see if setup is needed</p>
              <p>2. If setup is needed, try &quot;Trigger Standalone Dialog&quot; or &quot;Show Onboarding Dialog&quot;</p>
              <p>3. In the dialog, click &quot;Skip for now&quot; to test the skip functionality</p>
              <p>4. Check the status again to verify it shows setup is no longer needed</p>
              <p>5. The dialog should not appear again after skipping</p>
              <p>6. Use &quot;Test Skip API Directly&quot; to test the skip API without opening a dialog</p>
          </CardContent>
        </Card>
      </div>

      {/* Include the CompanySetupDialog component */}
      <CompanySetupDialog />

      {/* Include the OnboardingCompanySetupDialog component */}
      {showOnboardingDialog && (
        <OnboardingProvider>
          <OnboardingCompanySetupDialog />
        </OnboardingProvider>
      )}
    </div>
  );
}
