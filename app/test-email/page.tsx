"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  const handleTestEmail = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        toast.success("Email sent successfully!", {
          description: "Check your inbox for the verification link.",
        });
      } else {
        toast.error("Failed to send email", {
          description: data.error || "Please try again.",
        });
      }
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupTest = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', 'testpassword123');
      formData.append('name', 'Test User');
      formData.append('company_name', 'Test Company');
      formData.append('plan', 'starter');

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        toast.success("Signup successful!", {
          description: "Check your email for verification.",
        });
      } else {
        toast.error("Signup failed", {
          description: data.error || "Please try again.",
        });
      }
    } catch {
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
            <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl">Email Verification Test</CardTitle>
            <CardDescription className="text-base">
              Test email functionality and debug verification issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleTestEmail}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Test Email API
                  </>
                )}
              </Button>

              <Button 
                onClick={handleSignupTest}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Full Signup"
                )}
              </Button>
            </div>

            {result && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {result.success ? "Success" : "Error"}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-600 space-y-2">
              <h4 className="font-medium">Debugging Tips:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your spam/junk folder</li>
                <li>Wait 5-10 minutes for email delivery</li>
                <li>Try a different email provider (Gmail, Outlook)</li>
                <li>Use Google OAuth for immediate testing</li>
                <li>Check Supabase Dashboard &gt; Authentication &gt; Users</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
