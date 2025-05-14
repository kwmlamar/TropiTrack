"use client";

import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function VerifyEmailPage() {
  const handleLogin = () => {
    redirect('/login')
  }


  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Check Your Email</h1>
        <p className="mt-4 text-gray-600">
          We&apos;ve sent a verification link to your email. Please click the link in the email to verify your account.
        </p>
        <Button 
        onClick={handleLogin}
        className="mt-4"
        >
          Go to Login
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

