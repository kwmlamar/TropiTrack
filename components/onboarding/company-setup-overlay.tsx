"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/context/onboarding-context";
import { saveOnboardingData } from "@/lib/actions/onboarding-actions";
import { toast } from "sonner";

// Wrapper component that safely uses the onboarding context
function CompanySetupOverlayContent() {
  const { closeCurrentStep } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      company_name: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = async (data: { company_name: string; address: string; phone: string; email: string }) => {
    setIsSubmitting(true);
    try {
      await saveOnboardingData(undefined, data);
      toast.success("Company information updated successfully!");
      closeCurrentStep();
      router.push("/dashboard");
    } catch {
      toast.error("Failed to update company information");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Company Setup</CardTitle>
          <CardDescription>
            Please provide your company information to complete the setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                {...form.register("company_name", { required: true })}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                {...form.register("address", { required: true })}
                placeholder="Enter company address"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...form.register("phone", { required: true })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email", { required: true })}
                placeholder="Enter email address"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Saving..." : "Save & Continue"}
              </Button>
              <Button type="button" variant="outline" onClick={closeCurrentStep}>
                Skip
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component that handles provider availability
export function CompanySetupOverlay() {
  try {
    return <CompanySetupOverlayContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping CompanySetupOverlay render');
    return null;
  }
} 