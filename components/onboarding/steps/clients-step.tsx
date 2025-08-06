"use client";

import { useOnboarding } from "@/context/onboarding-context";

// Wrapper component that safely uses the onboarding context
function ClientsStepContent() {
  const { goToStep } = useOnboarding();
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Add Your Clients</h2>
      <p className="text-gray-600 mb-6">
        Set up your client management system to track projects and billing.
      </p>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Client Management Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Client contact information</li>
            <li>• Project assignment</li>
            <li>• Billing and invoicing</li>
            <li>• Communication tracking</li>
          </ul>
        </div>
        
        <button
          onClick={() => goToStep('clients')}
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
        >
          Configure Clients
        </button>
      </div>
    </div>
  );
}

// Main component that handles provider availability
export function ClientsStep() {
  try {
    return <ClientsStepContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping ClientsStep render');
    return null;
  }
} 