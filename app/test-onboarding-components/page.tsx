import { TimesheetsStep } from "@/components/onboarding/steps/timesheets-step";
import { WorkersStep } from "@/components/onboarding/steps/workers-step";
import { ClientsStep } from "@/components/onboarding/steps/clients-step";
import { ProjectsStep } from "@/components/onboarding/steps/projects-step";
import { ApprovalsStep } from "@/components/onboarding/steps/approvals-step";
import { PayrollStep } from "@/components/onboarding/steps/payroll-step";
import { DashboardStep } from "@/components/onboarding/steps/dashboard-step";
import { OnboardingProvider } from "@/context/onboarding-context";

export default function TestOnboardingComponentsPage() {
  return (
    <OnboardingProvider>
      <div className="p-8 space-y-8">
        <h1 className="text-3xl font-bold">Onboarding Components Test</h1>
        
        <div className="grid gap-8">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">TimesheetsStep</h2>
            <TimesheetsStep />
          </div>
          
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">WorkersStep</h2>
            <WorkersStep />
          </div>
          
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">ClientsStep</h2>
            <ClientsStep />
          </div>
          
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">ProjectsStep</h2>
            <ProjectsStep />
          </div>
          
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">ApprovalsStep</h2>
            <ApprovalsStep />
          </div>
          
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">PayrollStep</h2>
            <PayrollStep />
          </div>
          
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">DashboardStep</h2>
            <DashboardStep />
          </div>
        </div>
      </div>
    </OnboardingProvider>
  );
} 