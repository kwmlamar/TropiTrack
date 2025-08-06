"use client";

import { useOnboarding } from "@/context/onboarding-context";

// Wrapper component that safely uses the onboarding context
function DashboardStepContent() {
  const { goToStep } = useOnboarding();
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
      <p className="text-gray-600 mb-6">
        Explore your complete dashboard with all the features you&apos;ve set up.
      </p>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Dashboard Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Real-time project overview</li>
            <li>• Worker time tracking</li>
            <li>• Financial reporting</li>
            <li>• Performance analytics</li>
          </ul>
        </div>
        
        <button
          onClick={() => goToStep('dashboard')}
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
        >
          View Dashboard
        </button>
      </div>
    </div>
  );
}

// Main component that handles provider availability
export function DashboardStep() {
  try {
    return <DashboardStepContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping DashboardStep render');
    return null;
  }
} 