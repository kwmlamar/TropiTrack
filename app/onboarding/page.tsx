"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  
  // Redirect to dashboard since we're removing the onboarding flow
  React.useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  
  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
} 