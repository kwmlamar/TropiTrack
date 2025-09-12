"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function TestCompleteFlowPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testSignupFlow = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      // Test data
      const testData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User',
        company_name: 'Test Company',
        plan: 'starter'
      };

      console.log('Testing signup with:', testData);

      const response = await fetch('/api/test-signup-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      console.log('Signup result:', data);

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Test error:', error);
      setError('Test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testTrialSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const testData = {
        userId: 'test-user-id',
        planId: 'starter',
        userEmail: 'test@example.com'
      };

      console.log('Testing trial subscription creation:', testData);

      const response = await fetch('/api/create-trial-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      console.log('Trial subscription result:', data);

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Trial subscription creation failed');
      }
    } catch (error) {
      console.error('Test error:', error);
      setError('Test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">🧪 Complete Flow Test</h1>
          <p className="text-gray-600 mb-6">
            Test the complete signup and trial subscription flow
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Signup Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test the complete signup process including trial subscription creation
              </p>
              <Button 
                onClick={testSignupFlow}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Signup Flow'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Trial Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test just the trial subscription creation API
              </p>
              <Button 
                onClick={testTrialSubscription}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Trial Subscription'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert className="mt-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Test Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">📋 What This Tests:</h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Signup Flow:</strong> Complete user registration with trial subscription</li>
            <li><strong>Trial Creation:</strong> Stripe trial subscription creation</li>
            <li><strong>Database Integration:</strong> Subscription storage in database</li>
            <li><strong>Error Handling:</strong> Proper error responses</li>
          </ul>
        </div>
      </div>
    </div>
  );
}




