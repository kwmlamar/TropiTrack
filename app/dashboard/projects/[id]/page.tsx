import { createClient } from "@/utils/supabase/server";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { updateRecentProject } from "@/lib/data/recent-projects";
import { getProject } from "@/lib/data/projects";
import { getProfile } from "@/lib/data/data";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function StatusBadge({ status }: { status: string }) {
  const colors = {
    not_started: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    paused: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${colors[status as keyof typeof colors]}`}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null;
  
  const colors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${colors[priority as keyof typeof colors]}`}>
      {priority.toUpperCase()}
    </span>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not found");
  }

  // Get user's profile to get company_id
  const profile = await getProfile(user.id);
  if (!profile) {
    throw new Error("User profile not found");
  }

  // Update recent projects list
  await updateRecentProject(user.id, id);

  // Get project details using company_id
  const { data: project, error: projectError } = await getProject(
    profile.company_id,
    id
  );

  if (projectError || !project) {
    throw new Error("Project not found");
  }

  return (
    <DashboardLayout title={project.name}>
      <div className="space-y-6">
        {/* Project Header */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Created on {format(new Date(project.created_at), "MMMM d, yyyy")}
                </p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Information */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                  <dd className="mt-1 text-sm ">{project.description || "No description provided"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                  <dd className="mt-1 text-sm ">{project.location || "No location specified"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Timeline</dt>
                  <dd className="mt-1 text-sm ">
                    {project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "Not started"} - 
                    {project.end_date ? format(new Date(project.end_date), "MMM d, yyyy") : "No end date"}
                  </dd>
                </div>
                {project.budget && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Budget</dt>
                    <dd className="mt-1 text-sm ">${project.budget.toLocaleString()}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              {project.client ? (
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Client Name</dt>
                    <dd className="mt-1 text-sm ">{project.client.name}</dd>
                  </div>
                  {project.client.company && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Company</dt>
                      <dd className="mt-1 text-sm ">{project.client.company}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">No client information available</p>
              )}
            </CardContent>
          </Card>

          {/* Project Manager */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Project Manager</CardTitle>
            </CardHeader>
            <CardContent>
              {project.project_manager ? (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {project.project_manager.first_name?.[0]}
                        {project.project_manager.last_name?.[0]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium ">
                      {project.project_manager.first_name} {project.project_manager.last_name}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No project manager assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {project.assigned_workers && project.assigned_workers.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {project.assigned_workers.map((worker) => (
                    <li key={worker.id} className="py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-muted-foreground">
                              {worker.name ? worker.name.split(" ").map(n => n[0]).join("") : "?"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium ">{worker.name || "Unnamed Worker"}</p>
                          <p className="text-sm text-muted-foreground">{worker.role || "No role specified"}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No team members assigned</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes Section */}
        {project.notes && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm  whitespace-pre-wrap">{project.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 