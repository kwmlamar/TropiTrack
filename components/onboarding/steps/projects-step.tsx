"use client";

import { useOnboarding } from "@/context/onboarding-context";

// Wrapper component that safely uses the onboarding context
function ProjectsStepContent() {
  const { goToStep } = useOnboarding();
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Create Your Projects</h2>
      <p className="text-gray-600 mb-6">
        Set up your project management system to track progress and timelines.
      </p>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Project Management Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Project planning and scheduling</li>
            <li>• Resource allocation</li>
            <li>• Progress tracking</li>
            <li>• Budget management</li>
          </ul>
        </div>
        
        <button
          onClick={() => goToStep('projects')}
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
        >
          Configure Projects
        </button>
      </div>
    </div>
  );
}

// Main component that handles provider availability
export function ProjectsStep() {
  try {
    return <ProjectsStepContent />;
  } catch {
    console.warn('OnboardingProvider not available, skipping ProjectsStep render');
    return null;
  }
} 