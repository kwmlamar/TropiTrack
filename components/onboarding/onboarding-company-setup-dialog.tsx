"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOnboarding } from "@/context/onboarding-context";
import { completeOnboardingStep } from "@/lib/actions/onboarding-actions";
import { getAuthUserId } from "@/lib/data/userProfiles";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const industries = [
  "Construction",
  "General Contracting",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Roofing",
  "Landscaping",
  "Interior Design",
  "Architecture",
  "Engineering",
  "Property Management",
  "Real Estate Development",
  "Other"
];

export function OnboardingCompanySetupDialog() {
  const { completeStep } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      setIsLoading(true);
      setErrors({});
      
      // Extract form data
      const companyData = {
        company_name: formData.get("company_name") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
        website: formData.get("website") as string,
        industry: formData.get("industry") as string,
        description: formData.get("description") as string,
      };

      // Validate required fields
      if (!companyData.company_name) {
        setErrors({ company_name: "Company name is required" });
        return;
      }

      // First, update the company information via API
      const response = await fetch("/api/company-setup", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        if (result.field) {
          setErrors({ [result.field]: result.error });
        } else {
          toast.error("Setup failed", {
            description: result.error || "Please try again.",
          });
        }
        return;
      }

      // Then complete the onboarding step with the company data
      await completeStep('company-setup', companyData);

      toast.success("Company setup complete!", {
        description: "Your company has been configured successfully.",
      });
      
      // The onboarding context will handle navigation to the next step
    } catch (error) {
      console.error('Error completing company setup:', error);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSkip = async () => {
    try {
      setIsLoading(true);
      
      // Get current user ID
      const userId = await getAuthUserId();
      if (!userId) {
        toast.error("User not authenticated");
        return;
      }
      
      // Mark the company-setup step as completed in onboarding progress
      await completeOnboardingStep(userId, 'company-setup', { skipped: true });
      
      // Also mark company setup as completed in the database
      const response = await fetch("/api/company-setup-skip", {
        method: "POST",
      });

      if (!response.ok) {
        const result = await response.json();
        toast.error("Failed to skip setup", {
          description: result.error || "Please try again.",
        });
        return;
      }

      // Complete the step in the onboarding context
      await completeStep('company-setup', { skipped: true });

      toast.success("Setup skipped", {
        description: "You can complete company setup later from your settings.",
      });
    } catch (error) {
      console.error('Error skipping company setup:', error);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Don't allow closing without completing or skipping
    // This ensures users complete the onboarding step
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="space-y-3">
              <DialogTitle className="text-2xl">Set up your company</DialogTitle>
              <DialogDescription className="text-sm">
                Tell us about your company to get started
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="company_name" className="text-sm">Company name *</Label>
              <Input
                id="company_name"
                name="company_name"
                type="text"
                placeholder="Enter your company name"
                required
                className={errors.company_name ? "border-destructive" : ""}
              />
              {errors.company_name && (
                <p className="text-xs text-destructive">{errors.company_name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-sm">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter phone number"
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="address" className="text-sm">Address</Label>
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="Enter company address"
                className={errors.address ? "border-destructive" : ""}
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website" className="text-sm">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://yourcompany.com"
                className={errors.website ? "border-destructive" : ""}
              />
              {errors.website && (
                <p className="text-xs text-destructive">{errors.website}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="industry" className="text-sm">Industry</Label>
            <Select name="industry">
              <SelectTrigger className={errors.industry ? "border-destructive" : ""}>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.industry && (
              <p className="text-xs text-destructive">{errors.industry}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-sm">Company Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of your company..."
              rows={3}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : "Save & Continue"}
            </Button>
            <Button type="button" variant="outline" onClick={handleSkip}>
              Skip
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
