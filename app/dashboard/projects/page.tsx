import DashboardLayout from "@/components/layouts/dashboard-layout";
import { ProjectsPageClient } from "@/components/projects/projects-page-client";
import { createClient } from "@/utils/supabase/server";
import { ProjectsHeaderActions } from "@/components/projects/projects-header-actions";
import { AssetsHeaderActions } from "@/components/assets/assets-header-actions";

/**
 * Projects Page
 * 
 * This page serves dual purposes:
 * - Mobile/PWA: Shows the Assets page with organized sections and quick access buttons
 * - Desktop: Shows the existing Projects table view
 * 
 * The ProjectsPageClient component handles the conditional rendering based on
 * screen size and PWA mode detection.
 */
export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("User not found");

  return (
    <DashboardLayout 
      title="Assets" 
      fullWidth={true}
      headerActions={<AssetsHeaderActions desktopActions={<ProjectsHeaderActions userId={user.id} />} />}
    >
      <ProjectsPageClient user={user} />
    </DashboardLayout>
  );
}
