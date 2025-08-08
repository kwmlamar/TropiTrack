"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TestSignupPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleTestSignup = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'testpassword123');
      formData.append('name', 'Test User');
      formData.append('company_name', 'Test Company');
      formData.append('plan', 'starter');

      console.log('Starting test signup...');
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Signup result:', result);

      if (response.ok) {
        toast.success("Test signup successful!", {
          description: "Check console for details.",
        });
        console.log('Redirecting to:', result.redirectTo);
        
        // Test redirect
        setTimeout(() => {
          console.log('Executing redirect...');
          window.location.href = result.redirectTo || '/check-email';
        }, 1000);
      } else {
        toast.error("Test signup failed", {
          description: result.error || "Please try again.",
        });
      }
    } catch (error) {
      console.error('Test signup error:', error);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestRedirect = () => {
    console.log('Testing direct redirect...');
    window.location.href = '/check-email';
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-[400px]">
        <Card className="w-full">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-2xl">Test Signup Redirect</CardTitle>
            <CardDescription className="text-base">
              Debug the signup redirect issue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleTestSignup}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Signup Flow"
              )}
            </Button>

            <Button 
              onClick={handleTestRedirect}
              variant="outline"
              className="w-full"
            >
              Test Direct Redirect
            </Button>

            <div className="text-sm text-gray-600">
              <p>Check browser console for debug information.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
