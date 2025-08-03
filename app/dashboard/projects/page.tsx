import DashboardLayout from "@/components/layouts/dashboard-layout";
import ProjectsTable from "@/components/projects/projects-table";
import { createClient } from "@/utils/supabase/server";
import { OnboardingProvider } from '@/context/onboarding-context';
import { OnboardingCheck } from '@/components/onboarding/onboarding-check';

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("User not found");

  return (
    <OnboardingProvider>
      <DashboardLayout title="Projects">
        <div className="container mx-auto p-6">
          <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
            <OnboardingCheck 
                currentStep="projects"
                fallback={<ProjectsTable user={user} />}
            >
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold mb-4">Create Your First Project</h2>
                <p className="text-gray-600 mb-6">
                  Start by creating your first project to organize your work.
                </p>
                <ProjectsTable user={user} />
              </div>
            </OnboardingCheck>
          </div>
        </div>
      </DashboardLayout>
    </OnboardingProvider>
  );
}
