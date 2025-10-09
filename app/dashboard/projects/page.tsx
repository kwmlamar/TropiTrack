import DashboardLayout from "@/components/layouts/dashboard-layout";
import ProjectsTable from "@/components/projects/projects-table";
import { createClient } from "@/utils/supabase/server";
import { ProjectsHeaderActions } from "@/components/projects/projects-header-actions";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("User not found");

  return (
    <DashboardLayout 
      title="Projects" 
      fullWidth={true}
      headerActions={<ProjectsHeaderActions userId={user.id} />}
    >
      <ProjectsTable user={user} />
    </DashboardLayout>
  );
}
