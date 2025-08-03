"use client";

import { useState } from 'react';
import { OnboardingProvider } from '@/context/onboarding-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { 
  isWorkersStepSmartCompleted,
  isClientsStepSmartCompleted,
  isProjectsStepSmartCompleted,
  isStepSmartCompleted
} from '@/components/onboarding/smart-completion-checks';

function AllSmartCompletionDemo() {
  const [results, setResults] = useState<{ [key: string]: Record<string, unknown> }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (stepId: string) => {
    setLoading(prev => ({ ...prev, [stepId]: true }));
    setError(null);
    
    try {
      console.log(`Starting smart completion check for ${stepId}...`);
      let result;
      
      switch (stepId) {
        case 'workers':
          result = await isWorkersStepSmartCompleted();
          break;
        case 'clients':
          result = await isClientsStepSmartCompleted();
          break;
        case 'projects':
          result = await isProjectsStepSmartCompleted();
          break;
        default:
          result = await isStepSmartCompleted(stepId);
      }
      
      console.log(`${stepId} smart completion result:`, result);
      setResults(prev => ({ ...prev, [stepId]: result }));
    } catch (err) {
      console.error(`Error in ${stepId} smart completion check:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(prev => ({ ...prev, [stepId]: false }));
    }
  };

  const handleCheckAll = async () => {
    const steps = ['workers', 'clients', 'projects'];
    for (const stepId of steps) {
      await handleCheck(stepId);
    }
  };

  const getStepTitle = (stepId: string) => {
    switch (stepId) {
      case 'workers': return 'Workers';
      case 'clients': return 'Clients';
      case 'projects': return 'Projects';
      default: return stepId;
    }
  };

  const getCountLabel = (stepId: string) => {
    switch (stepId) {
      case 'workers': return 'Worker Count';
      case 'clients': return 'Client Count';
      case 'projects': return 'Project Count';
      default: return 'Count';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Smart Completion Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Check All Button */}
          <div className="flex gap-2">
            <Button 
              onClick={handleCheckAll}
              disabled={Object.values(loading).some(Boolean)}
              className="flex-1"
            >
              {Object.values(loading).some(Boolean) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking All...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check All Steps
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Individual Step Checks */}
          <div className="grid gap-4 md:grid-cols-3">
            {['workers', 'clients', 'projects'].map((stepId) => (
              <Card key={stepId} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{getStepTitle(stepId)}</h3>
                    <Button 
                      onClick={() => handleCheck(stepId)}
                      disabled={loading[stepId]}
                      size="sm"
                      variant="outline"
                    >
                      {loading[stepId] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Check'
                      )}
                    </Button>
                  </div>

                  {results[stepId] && (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Is Completed:</span>
                        <div className="flex items-center gap-2">
                          {results[stepId].isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Badge variant={results[stepId].isCompleted ? "default" : "secondary"}>
                            {results[stepId].isCompleted ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Method:</span>
                        <Badge variant="outline">{results[stepId].method}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{getCountLabel(stepId)}:</span>
                        <Badge variant="outline">{results[stepId].workerCount || results[stepId].clientCount || results[stepId].projectCount || results[stepId].count}</Badge>
                      </div>
                    </div>
                  )}

                  {!results[stepId] && !loading[stepId] && (
                    <div className="text-sm text-gray-500 text-center py-4">
                      Click &quot;Check&quot; to test this step
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* How it works */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How Smart Completion Works</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>✅ <strong>Workers:</strong> Checks if any workers exist in the database</p>
              <p>✅ <strong>Clients:</strong> Checks if any clients exist in the database</p>
              <p>✅ <strong>Projects:</strong> Checks if any projects exist in the database</p>
              <p>✅ <strong>Hybrid Approach:</strong> Combines explicit and implicit completion</p>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

export default function TestAllSmartCompletionPage() {
  return (
    <OnboardingProvider>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">All Smart Completion Test</h1>
        <AllSmartCompletionDemo />
      </div>
    </OnboardingProvider>
  );
} 