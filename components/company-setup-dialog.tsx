"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

// Global function to trigger company setup dialog
let triggerCompanySetup: (() => void) | null = null;

export function triggerCompanySetupDialog() {
  if (triggerCompanySetup) {
    triggerCompanySetup();
  }
}

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
  "Other",
];

export function CompanySetupDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Set up the global trigger function
  useEffect(() => {
    triggerCompanySetup = () => setIsOpen(true);
    return () => {
      triggerCompanySetup = null;
    };
  }, []);

  // Check if user needs company setup on mount (only once per session)
  useEffect(() => {
    const hasShownThisSession = sessionStorage.getItem('company-setup-shown');
    
    if (!hasShownThisSession) {
      checkCompanySetup();
    }
  }, []);

  const checkCompanySetup = async () => {
    try {
      const response = await fetch("/api/check-company-setup");
      const data = await response.json();
      
      if (data.needsSetup) {
        setIsOpen(true);
        // Mark that we've shown the dialog this session
        sessionStorage.setItem('company-setup-shown', 'true');
      }
    } catch (error) {
      console.error("Error checking company setup:", error);
    }
  };

  async function handleSubmit(formData: FormData) {
    try {
      setIsLoading(true);
      setErrors({});
      
      const response = await fetch("/api/company-setup", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.field) {
          setErrors({ [result.field]: result.error });
        } else {
          toast.error("Setup failed", {
            description: result.error || "Please try again.",
          });
        }
        return;
      }

      toast.success("Company setup complete!", {
        description: "Your company has been configured successfully.",
      });
      
      setIsOpen(false);
      // Optionally refresh the page or update the UI
      router.refresh();
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSkip = () => {
    setIsOpen(false);
    // Dialog is already marked as shown in sessionStorage, so it won't show again this session
  };

  const handleClose = () => {
    setIsOpen(false);
    // Dialog is already marked as shown in sessionStorage, so it won't show again this session
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of your company"
              rows={3}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip for now
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 