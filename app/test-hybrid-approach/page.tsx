"use client";

import { useState } from 'react';
import { OnboardingProvider } from '@/context/onboarding-context';
import { isWorkersStepSmartCompleted } from '@/components/onboarding/smart-completion-checks';
import { useSmartCompletion } from '@/hooks/use-smart-completion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

function HybridApproachDemo() {
  const { isWorkersCompleted, loading, error, refresh } = useSmartCompletion();
  const [manualCheck, setManualCheck] = useState<Record<string, unknown> | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  const handleManualCheck = async () => {
    setManualLoading(true);
    try {
      const result = await isWorkersStepSmartCompleted();
      setManualCheck(result);
    } catch (err) {
      setManualCheck({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hybrid Approach Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Hook-based Check */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Hook-based Smart Completion</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status:</span>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <Badge variant="secondary">Loading...</Badge>
                  </div>
                ) : isWorkersCompleted ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge variant="default">Completed</Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <Badge variant="secondary">Not Completed</Badge>
                  </div>
                )}
              </div>
              {error && (
                <div className="text-sm text-red-600">
                  Error: {error}
                </div>
              )}
              <Button onClick={refresh} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Manual Check */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Manual Smart Completion Check</h3>
            <div className="space-y-2">
              <Button 
                onClick={handleManualCheck} 
                disabled={manualLoading}
                size="sm"
              >
                {manualLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Completion'
                )}
              </Button>
              
              {manualCheck && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Is Completed:</span>
                    <Badge variant={manualCheck.isCompleted ? "default" : "secondary"}>
                      {manualCheck.isCompleted ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Method:</span>
                    <Badge variant="outline">{String(manualCheck.method)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Worker Count:</span>
                    <Badge variant="outline">{String(manualCheck.workerCount)}</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* How it works */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How the Hybrid Approach Works</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>✅ <strong>Fast UI Updates:</strong> Uses context state for immediate feedback</p>
              <p>✅ <strong>Accurate Validation:</strong> Database check ensures reliability</p>
              <p>✅ <strong>Edge Case Handling:</strong> Catches manual worker creation</p>
              <p>✅ <strong>Performance Optimized:</strong> Only checks when needed</p>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

export default function TestHybridApproachPage() {
  return (
    <OnboardingProvider>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Hybrid Approach Test</h1>
        <HybridApproachDemo />
      </div>
    </OnboardingProvider>
  );
} 