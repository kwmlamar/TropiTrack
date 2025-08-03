"use client";

import { useEffect, useState } from 'react';
import { useOnboarding } from '@/context/onboarding-context';
import { getAuthUserId, getUserProfile } from '@/lib/data/userProfiles';
import { getWorkers } from '@/lib/data/workers';
import { getOnboardingProgress } from '@/lib/actions/onboarding-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

export function WorkersCompletionStrategies() {
  const { isStepCompleted } = useOnboarding();
  const [explicitCompletion, setExplicitCompletion] = useState<boolean>(false);
  const [implicitCompletion, setImplicitCompletion] = useState<boolean>(false);
  const [workerCount, setWorkerCount] = useState<number>(0);


  useEffect(() => {
    async function checkCompletionStrategies() {
      try {
        const userId = await getAuthUserId();
        const userProfile = await getUserProfile();
        const companyId = userProfile.company_id;
        
        // Strategy 1: Check explicit step completion
        const progress = await getOnboardingProgress(userId);
        const completedSteps = progress.map(p => p.step_name);
        setExplicitCompletion(completedSteps.includes('workers'));

        // Strategy 2: Check if workers exist in database
        if (companyId) {
          const workersResponse = await getWorkers(companyId, {});
          if (workersResponse.success && workersResponse.data) {
            setWorkerCount(workersResponse.data.length);
            setImplicitCompletion(workersResponse.data.length > 0);
          }
        }

      } catch (error) {
        console.error('Error checking completion strategies:', error);
      }
    }

    checkCompletionStrategies();
  }, []);

  const contextCompletion = isStepCompleted('workers');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Workers Step Completion Strategies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Strategy 1: Explicit Completion */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Strategy 1: Explicit Step Completion</h3>
            <p className="text-sm text-gray-600 mb-3">
              Step is marked as completed when user explicitly completes the onboarding step.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Context State:</span>
                <Badge variant={contextCompletion ? "default" : "secondary"}>
                  {contextCompletion ? "Completed" : "Not Completed"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Record:</span>
                <Badge variant={explicitCompletion ? "default" : "secondary"}>
                  {explicitCompletion ? "Completed" : "Not Completed"}
                </Badge>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
              <strong>Pros:</strong> Fast, explicit, clear user intent
              <br />
              <strong>Cons:</strong> Doesn&apos;t handle edge cases (manual worker creation)
            </div>
          </div>

          {/* Strategy 2: Implicit Completion */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Strategy 2: Implicit Database Check</h3>
            <p className="text-sm text-gray-600 mb-3">
              Step is considered completed if any workers exist for the company.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Workers in Database:</span>
                <Badge variant="outline">{workerCount} workers</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Implicit Completion:</span>
                <Badge variant={implicitCompletion ? "default" : "secondary"}>
                  {implicitCompletion ? "Completed" : "Not Completed"}
                </Badge>
              </div>
            </div>
            <div className="mt-3 p-2 bg-green-50 rounded text-sm">
              <strong>Pros:</strong> Handles edge cases, always accurate
              <br />
              <strong>Cons:</strong> Slower, requires database query
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Smart Recommendation
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              <strong>Hybrid Approach:</strong> Use explicit completion for fast UI updates, 
              but validate with database check for accuracy.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Fast UI updates using context state</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Database validation for edge cases</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Handles manual worker creation outside onboarding</span>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

// Smart completion check function
export async function isWorkersStepSmartCompleted(userId?: string): Promise<{
  isCompleted: boolean;
  method: 'explicit' | 'implicit' | 'both';
  workerCount: number;
}> {
  try {
    const actualUserId = userId || await getAuthUserId();
    
    // Get user profile to get company ID
    const userProfile = await getUserProfile();
    const companyId = userProfile.company_id;
    
    if (!companyId) {
      console.error('No company ID found for user');
      return {
        isCompleted: false,
        method: 'explicit',
        workerCount: 0
      };
    }
    
    // Check explicit completion
    const progress = await getOnboardingProgress(actualUserId);
    const completedSteps = progress.map(p => p.step_name);
    const explicitCompleted = completedSteps.includes('workers');
    
    // Check implicit completion
    const workersResponse = await getWorkers(companyId, {});
    const workerCount = workersResponse.success && workersResponse.data ? workersResponse.data.length : 0;
    const implicitCompleted = workerCount > 0;
    
    console.log('Smart completion check:', {
      explicitCompleted,
      implicitCompleted,
      workerCount,
      companyId
    });
    
    // Determine completion method
    let method: 'explicit' | 'implicit' | 'both' = 'both';
    if (explicitCompleted && !implicitCompleted) method = 'explicit';
    if (!explicitCompleted && implicitCompleted) method = 'implicit';
    
    return {
      isCompleted: explicitCompleted || implicitCompleted,
      method,
      workerCount
    };
  } catch (error) {
    console.error('Error in smart completion check:', error);
    return {
      isCompleted: false,
      method: 'explicit',
      workerCount: 0
    };
  }
} 