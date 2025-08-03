"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { getOnboardingProgress } from '@/lib/actions/onboarding-actions';
import { getAuthUserId } from '@/lib/data/userProfiles';
import { RefreshCw, CheckCircle } from 'lucide-react';

function OnboardingStateDebug() {
  const { state } = useOnboarding();
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
    } finally {
      setIsLoading(false);
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
              Onboarding State Debug
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Context State */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Context State</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Active:</span>
                    <Badge variant={state.isActive ? "default" : "secondary"}>
                      {state.isActive ? "Yes" : "No"}
                    </Badge>
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
                    <span className="font-medium">Current Step:</span>
                    <span className="text-sm text-gray-600">{state.currentStep || "None"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Error:</span>
                    <span className="text-sm text-red-600">{state.error || "None"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Completed Steps:</span>
                    <span className="text-sm text-gray-600">{state.completedSteps.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Data Keys:</span>
                    <span className="text-sm text-gray-600">{Object.keys(state.data).length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Progress:</span>
                    <span className="text-sm text-gray-600">{Math.round((state.completedSteps.length / 8) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Steps List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Completed Steps (Context)</h3>
              {state.completedSteps.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No steps completed in context
                </div>
              ) : (
                <div className="space-y-2">
                  {state.completedSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Database Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Database Progress</h3>
                <button 
                  onClick={loadDatabaseProgress} 
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Refresh
                </button>
              </div>
              
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading...</p>
                </div>
              ) : databaseProgress.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
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
                            {new Date(progress.completed_at).toLocaleString()}
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

            {/* Debug Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Debug Information</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify({ 
                    contextState: state, 
                    databaseProgress,
                    isLoading 
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OnboardingStateDebugPage() {
  return (
    <OnboardingProvider>
      <OnboardingStateDebug />
    </OnboardingProvider>
  );
} 