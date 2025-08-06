"use client";

import { useOnboarding } from "@/context/onboarding-context";

// Wrapper component that safely uses the onboarding context
function StandaloneTimesheetsStepContent() {
  const { goToStep } = useOnboarding();
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Create Timesheets</h2>
      <p className="text-gray-600 mb-6">
        Set up your timesheet system to track worker hours and manage payroll.
      </p>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Timesheet Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• QR code clock-in/out system</li>
            <li>• Biometric authentication</li>
            <li>• Automatic overtime calculation</li>
            <li>• Payroll integration</li>
          </ul>
        </div>
        
        <button
          onClick={() => goToStep('timesheets')}
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
        >
          Configure Timesheets
        </button>
      </div>
    </div>
  );
}

// Main component that handles provider availability
export function StandaloneTimesheetsStep() {
  try {
    return <StandaloneTimesheetsStepContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping StandaloneTimesheetsStep render');
    return null;
  }
} 