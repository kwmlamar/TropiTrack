"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner";

export default function CheckEmailPage() {
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      // Get email from localStorage
      const email = localStorage.getItem('signup-email');
      
      if (!email) {
        toast.error("Email not found", {
          description: "Please try signing up again.",
        });
        return;
      }

      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Email sent!", {
          description: "Check your inbox for the verification link.",
        });
      } else {
        toast.error("Failed to send email", {
          description: result.error || "Please try again later.",
        });
      }
    } catch (error) {
      console.error('Resend email error:', error);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-[400px]">
        <Card className="w-full">
          <CardHeader className="text-center pb-3">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="text-base">
              We&apos;ve sent you a verification link to complete your signup
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>What&apos;s next?</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Check your email inbox</li>
                  <li>• Click the verification link</li>
                  <li>• You&apos;ll be redirected to your dashboard</li>
                  <li>• Your 14-day free trial will start automatically</li>
                </ul>
              </div>
              
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Didn&apos;t receive the email? Check your spam folder or
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleResendEmail}
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend verification email"
                  )}
                </Button>
              </div>
              
              <div className="text-center">
                <Link href="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to sign in
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
