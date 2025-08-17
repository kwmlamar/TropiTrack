"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle, signUpWithGoogle } from "@/app/actions/auth";

export default function TestOAuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleOAuth = async (type: 'signin' | 'signup') => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const oauthFunction = type === 'signin' ? signInWithGoogle : signUpWithGoogle;
      const result = await oauthFunction();

      if ('error' in result) {
        setError(result.error);
      } else if ('url' in result) {
        setResult(`OAuth URL generated: ${result.url.substring(0, 100)}...`);
        // Redirect to the OAuth URL
        window.location.href = result.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test OAuth Flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={() => handleOAuth('signin')} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Loading...' : 'Sign In with Google'}
            </Button>
            
            <Button 
              onClick={() => handleOAuth('signup')} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Loading...' : 'Sign Up with Google'}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">Error: {error}</p>
            </div>
          )}

          {result && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">{result}</p>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Environment:</strong></p>
            <p>NEXT_PUBLIC_SITE_URL: {process.env.NEXT_PUBLIC_SITE_URL || 'Not set'}</p>
            <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
            <p>Callback URL: {process.env.NEXT_PUBLIC_SITE_URL}/auth/callback</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
