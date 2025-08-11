"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TestSignupDebugPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  const handleTestSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        name: formData.get('name') as string,
        company_name: formData.get('company_name') as string,
        plan: formData.get('plan') as string,
      };

      console.log('Testing signup with:', data);

      const response = await fetch('/api/test-signup-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setResult(result);

      if (response.ok && result.success) {
        toast.success("Test signup successful!", {
          description: "Check the result below for details.",
        });
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

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-[600px]">
        <Card className="w-full">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-2xl">Debug Signup Process</CardTitle>
            <CardDescription className="text-base">
              Test the signup process and see what&apos;s happening with the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTestSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="test@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  placeholder="Create a password"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_name">Company name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  type="text"
                  placeholder="Your company name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Input
                  id="plan"
                  name="plan"
                  type="text"
                  placeholder="starter"
                  defaultValue="starter"
                />
              </div>
              
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing signup...
                  </>
                ) : (
                  "Test Signup Process"
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold">Debug Result:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
