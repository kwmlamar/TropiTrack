"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { toast } from "sonner"

export function CompanySetupDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if user needs company setup on mount (only once per session)
  useEffect(() => {
    // Check if we should force the dialog to show (for new OAuth users)
    const forceSetup = searchParams.get('setup') === 'company';
    
    if (forceSetup) {
      // Clear the session storage to ensure the dialog shows
      sessionStorage.removeItem('company-setup-shown');
      setIsOpen(true);
      // Clean up the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('setup');
      window.history.replaceState({}, '', newUrl.toString());
    } else {
      const hasShownThisSession = sessionStorage.getItem('company-setup-shown');
      
      if (!hasShownThisSession) {
        checkCompanySetup();
      }
    }
  }, [searchParams]);

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
      // Clear the session storage so the dialog won't show again
      sessionStorage.setItem('company-setup-shown', 'true');
      // Refresh the page to update all components
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
    // Mark that we've shown the dialog this session
    sessionStorage.setItem('company-setup-shown', 'true');
  };

  const handleClose = () => {
    setIsOpen(false);
    // Mark that we've shown the dialog this session
    sessionStorage.setItem('company-setup-shown', 'true');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div>
              <DialogTitle className="text-lg">Set up your company</DialogTitle>
              <DialogDescription className="text-sm">
                Tell us about your company to get started
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="company_name" className="text-sm">Company name</Label>
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
          
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isLoading}
            >
              {isLoading ? "Setting up..." : "Complete setup"}
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