"use client";

import { useState } from 'react';
import { OnboardingProvider } from '@/context/onboarding-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { isWorkersStepSmartCompleted } from '@/components/onboarding/smart-completion-checks';

function SmartCompletionDebug() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Starting smart completion check...');
      const checkResult = await isWorkersStepSmartCompleted();
      console.log('Smart completion result:', checkResult);
      setResult(checkResult);
    } catch (err) {
      console.error('Error in smart completion check:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Smart Completion Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <Button 
            onClick={handleCheck} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking Smart Completion...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Smart Completion
              </>
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Smart Completion Result</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Is Completed:</span>
                    <div className="flex items-center gap-2">
                      {result.isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge variant={result.isCompleted ? "default" : "secondary"}>
                        {result.isCompleted ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Method:</span>
                    <Badge variant="outline">{result.method}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Worker Count:</span>
                    <Badge variant="outline">{result.workerCount}</Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Raw Result</h3>
                <pre className="text-xs text-blue-700 bg-blue-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}

export default function TestSmartCompletionPage() {
  return (
    <OnboardingProvider>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Smart Completion Debug</h1>
        <SmartCompletionDebug />
      </div>
    </OnboardingProvider>
  );
} 