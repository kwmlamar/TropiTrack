import DashboardLayout from "@/components/layouts/dashboard-layout";
import ProjectsTable from "@/components/projects/projects-table";
import { createClient } from "@/utils/supabase/server";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("User not found");

  return (
    <DashboardLayout title="Projects">
      <ProjectsTable user={user} />
    </DashboardLayout>
  );
}
