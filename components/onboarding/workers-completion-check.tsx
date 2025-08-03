"use client";

import { useEffect, useState } from 'react';
import { useOnboarding } from '@/context/onboarding-context';
import { getAuthUserId } from '@/lib/data/userProfiles';
import { getOnboardingProgress } from '@/lib/actions/onboarding-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export function WorkersCompletionCheck() {
  const { isStepCompleted, state } = useOnboarding();
  const [dbCompletedSteps, setDbCompletedSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Method 1: Check using the onboarding context (in-memory)
  const isWorkersCompletedInContext = isStepCompleted('workers');

  // Method 2: Check from database
  useEffect(() => {
    async function checkDatabaseCompletion() {
      try {
        const userId = await getAuthUserId();
        const progress = await getOnboardingProgress(userId);
        const completedSteps = progress.map(p => p.step_name);
        setDbCompletedSteps(completedSteps);
      } catch (error) {
        console.error('Error checking database completion:', error);
      } finally {
        setLoading(false);
      }
    }

    checkDatabaseCompletion();
  }, []);

  const isWorkersCompletedInDB = dbCompletedSteps.includes('workers');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workers Step Completion Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Method 1: Context-based check */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium">Context Check (In-Memory)</h4>
              <p className="text-sm text-gray-500">
                Uses the onboarding context state
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isWorkersCompletedInContext ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Completed
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    Not Completed
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Method 2: Database check */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium">Database Check</h4>
              <p className="text-sm text-gray-500">
                Checks the onboarding_progress table
              </p>
            </div>
            <div className="flex items-center gap-2">
              {loading ? (
                <>
                  <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Loading...
                  </Badge>
                </>
              ) : isWorkersCompletedInDB ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Completed
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    Not Completed
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Onboarding State Info */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Onboarding State</h4>
            <div className="text-sm text-blue-700 mt-2 space-y-1">
              <p>Is Active: {state.isActive ? 'Yes' : 'No'}</p>
              <p>Current Step: {state.currentStep || 'None'}</p>
              <p>Completed Steps: {state.completedSteps.join(', ') || 'None'}</p>
            </div>
          </div>

          {/* Database Steps Info */}
          {!loading && (
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Database Completed Steps</h4>
              <div className="text-sm text-green-700 mt-2">
                <p>{dbCompletedSteps.length > 0 ? dbCompletedSteps.join(', ') : 'None'}</p>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}

// Utility functions for checking completion
export function useWorkersCompletion() {
  const { isStepCompleted } = useOnboarding();
  
  return {
    isCompleted: isStepCompleted('workers'),
    checkCompletion: () => isStepCompleted('workers'),
  };
}

export async function checkWorkersCompletionFromDB(userId?: string): Promise<boolean> {
  try {
    const actualUserId = userId || await getAuthUserId();
    const progress = await getOnboardingProgress(actualUserId);
    const completedSteps = progress.map(p => p.step_name);
    return completedSteps.includes('workers');
  } catch (error) {
    console.error('Error checking workers completion from DB:', error);
    return false;
  }
} 