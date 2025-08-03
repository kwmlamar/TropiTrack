"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { getOnboardingProgress, resetOnboardingForUser } from '@/lib/actions/onboarding-actions';
import { getAuthUserId } from '@/lib/data/userProfiles';
import { CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function OnboardingDatabaseTest() {
  const { state, startOnboarding, completeStep } = useOnboarding();
  const [databaseProgress, setDatabaseProgress] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDatabaseProgress = async () => {
    try {
      setIsLoading(true);
      const userId = await getAuthUserId();
      const progress = await getOnboardingProgress(userId);
      setDatabaseProgress(progress);
    } catch (error) {
      console.error('Error loading database progress:', error);
      toast.error('Failed to load database progress');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetOnboarding = async () => {
    try {
      const userId = await getAuthUserId();
      await resetOnboardingForUser(userId);
      await loadDatabaseProgress();
      toast.success('Onboarding reset successfully');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      toast.error('Failed to reset onboarding');
    }
  };

  useEffect(() => {
    loadDatabaseProgress();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Onboarding Database Integration Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current State */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Context State</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Active:</span>
                    <Badge variant={state.isActive ? "default" : "secondary"}>
                      {state.isActive ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Current Step:</span>
                    <span className="text-sm text-gray-600">{state.currentStep || "None"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Loading:</span>
                    <Badge variant={state.isLoading ? "default" : "secondary"}>
                      {state.isLoading ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Completed Steps:</span>
                    <span className="text-sm text-gray-600">{state.completedSteps.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Error:</span>
                    <span className="text-sm text-red-600">{state.error || "None"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Database Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Database Progress</h3>
                <Button 
                  onClick={loadDatabaseProgress} 
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {databaseProgress.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No progress found in database
                </div>
              ) : (
                <div className="space-y-2">
                  {databaseProgress.map((progress, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">{progress.step_name}</div>
                          <div className="text-sm text-gray-500">
                            Completed: {new Date(progress.completed_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {progress.data ? Object.keys(progress.data).length : 0} data points
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={startOnboarding} disabled={state.isActive}>
                  Start Onboarding
                </Button>
                <Button 
                  onClick={() => completeStep('company-setup', { company_name: 'Test Company' })}
                  disabled={!state.isActive}
                  variant="outline"
                >
                  Complete Company Setup
                </Button>
                <Button 
                  onClick={() => completeStep('workers', { worker_count: '5' })}
                  disabled={!state.isActive}
                  variant="outline"
                >
                  Complete Workers Step
                </Button>
                <Button 
                  onClick={handleResetOnboarding}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset Onboarding
                </Button>
              </div>
            </div>

            {/* Debug Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Debug Information</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify({ state, databaseProgress }, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OnboardingDatabaseTestPage() {
  return (
    <OnboardingProvider>
      <OnboardingDatabaseTest />
    </OnboardingProvider>
  );
} 