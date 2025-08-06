"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/context/onboarding-context";
import { saveOnboardingData } from "@/lib/actions/onboarding-actions";
import { toast } from "sonner";

// Wrapper component that safely uses the onboarding context
function WorkersStepContent() {
  const { closeCurrentStep } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workers, setWorkers] = useState([{ 
    name: "", 
    email: "", 
    position: "", 
    phone: "", 
    hourly_rate: "", 
    start_date: new Date().toISOString().split('T')[0] 
  }]);
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      workers: [{ 
        name: "", 
        email: "", 
        position: "", 
        phone: "", 
        hourly_rate: "", 
        start_date: new Date().toISOString().split('T')[0] 
      }]
    }
  });

  const addWorker = () => {
    setWorkers([...workers, { 
      name: "", 
      email: "", 
      position: "", 
      phone: "", 
      hourly_rate: "", 
      start_date: new Date().toISOString().split('T')[0] 
    }]);
  };

  const removeWorker = (index: number) => {
    if (workers.length > 1) {
      setWorkers(workers.filter((_, i) => i !== index));
    }
  };

  const updateWorker = (index: number, field: string, value: string) => {
    const updatedWorkers = [...workers];
    updatedWorkers[index] = { ...updatedWorkers[index], [field]: value };
    setWorkers(updatedWorkers);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await saveOnboardingData(undefined, { workers: workers.filter(w => w.name.trim()) });
      toast.success("Workers information saved!");
      closeCurrentStep();
      router.push("/dashboard/workers");
    } catch {
      toast.error("Failed to save workers information");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Add Your Workers</h2>
      <p className="text-gray-600 mb-6">
        Enter your workers&apos; information to get started with time tracking.
      </p>
      
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {workers.map((worker, index) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Worker {index + 1}</h3>
              {workers.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeWorker(index)}
                >
                  Remove
                </Button>
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor={`name-${index}`}>Full Name</Label>
                <Input
                  id={`name-${index}`}
                  value={worker.name}
                  onChange={(e) => updateWorker(index, "name", e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <Label htmlFor={`position-${index}`}>Position</Label>
                <Input
                  id={`position-${index}`}
                  value={worker.position}
                  onChange={(e) => updateWorker(index, "position", e.target.value)}
                  placeholder="e.g., Carpenter, Electrician"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor={`phone-${index}`}>Phone Number</Label>
              <Input
                id={`phone-${index}`}
                value={worker.phone}
                onChange={(e) => updateWorker(index, "phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          onClick={addWorker}
          className="w-full"
        >
          Add Another Worker
        </Button>
        
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Saving..." : "Save & Continue"}
          </Button>
          <Button type="button" variant="outline" onClick={closeCurrentStep}>
            Skip
          </Button>
        </div>
      </form>
    </div>
  );
}

// Main component that handles provider availability
export function WorkersStep() {
  try {
    return <WorkersStepContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping WorkersStep render');
    return null;
  }
} 