"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      // This would typically call a resend verification email API
      // For now, we'll just show a success message
      toast.success("Verification email sent!", {
        description: "Please check your inbox again.",
      });
    } catch {
      toast.error("Failed to resend email", {
        description: "Please try again later.",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-[400px]">
        <Card className="w-full">
          <CardHeader className="pb-3 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <Mail className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-lg">Check your email</CardTitle>
            <CardDescription className="text-sm">
              We&apos;ve sent you a verification link to confirm your account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <p className="mb-2">
                  Please check your email inbox and click the verification link to complete your registration.
                </p>
                <p>
                  If you don&apos;t see the email, check your spam folder.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleResendEmail}
                  disabled={isResending}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
                  {isResending ? "Sending..." : "Resend verification email"}
                </Button>
                
                <Button 
                  className="w-full" 
                  variant="ghost"
                  onClick={handleBackToLogin}
                >
                  Back to sign in
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

