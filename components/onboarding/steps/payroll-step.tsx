"use client";

import { useOnboarding } from "@/context/onboarding-context";

// Wrapper component that safely uses the onboarding context
function PayrollStepContent() {
  const { goToStep } = useOnboarding();
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Configure Payroll</h2>
      <p className="text-gray-600 mb-6">
        Set up your payroll system to process worker payments and deductions.
      </p>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Payroll Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Automatic payroll calculation</li>
            <li>• NIB deductions</li>
            <li>• Payment processing</li>
            <li>• Tax compliance</li>
          </ul>
        </div>
        
        <button
          onClick={() => goToStep('payroll')}
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
        >
          Configure Payroll
        </button>
      </div>
    </div>
  );
}

// Main component that handles provider availability
export function PayrollStep() {
  try {
    return <PayrollStepContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping PayrollStep render');
    return null;
  }
} 