"use client";

import { useOnboarding } from "@/context/onboarding-context";

// Wrapper component that safely uses the onboarding context
function ApprovalsStepContent() {
  const { goToStep } = useOnboarding();
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Approve Worker Time</h2>
      <p className="text-gray-600 mb-6">
        Learn how to review and approve worker timesheets for accurate payroll.
      </p>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Approval Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Review timesheet submissions</li>
            <li>• Approve or reject entries</li>
            <li>• Add comments and feedback</li>
            <li>• Bulk approval options</li>
          </ul>
        </div>
        
        <button
          onClick={() => goToStep('approvals')}
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
        >
          Configure Approvals
        </button>
      </div>
    </div>
  );
}

// Main component that handles provider availability
export function ApprovalsStep() {
  try {
    return <ApprovalsStepContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping ApprovalsStep render');
    return null;
  }
} 