import { createClient } from "@/utils/supabase/server";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { updateRecentProject } from "@/lib/data/recent-projects";
import { getProject } from "@/lib/data/projects";
import { getProfile } from "@/lib/data/data";
import { getPayrollsByProject } from "@/lib/data/payroll";
import { TabsContent } from "@/components/ui/tabs";
import { ProjectTabsWrapper } from "@/components/projects/project-tabs-wrapper";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { notFound } from "next/navigation";
import { getProjectAssignments } from "@/lib/data/project-assignments";
import { fetchClientsForCompany } from "@/lib/data/data";
import { ProjectDetailsSection } from "@/components/projects/project-details-section";
import { TeamMembersClient } from "@/components/projects/team-members-client";
import { ProjectDocumentsNew } from "@/components/projects/project-documents-new";
import { ProjectQRCodes } from "@/components/projects/project-qr-codes";
import { ProjectInvoices } from "@/components/projects/project-invoices";
import { getWorkers } from "@/lib/data/workers";
import { ProjectDetailPageClient } from "@/components/projects/project-detail-page-client";
import { getTimesheets } from "@/lib/data/timesheets";

// New v2 components
import {
  ProjectHeader,
  FinancialSnapshot,
  ProjectTimeline,
  ProjectTasks,
  ActivityFeed,
  FinancialData
} from "@/components/projects/project-detail-v2";

// Helper function to calculate project progress based on dates
function calculateProjectProgress(project: {
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  estimated_end_date?: string | null;
}): number {
  // If completed or cancelled, return appropriate values
  if (project.status === 'completed') return 100;
  if (project.status === 'cancelled' || project.status === 'not_started') return 0;

  // Calculate based on dates
  const startDate = project.start_date ? new Date(project.start_date) : null;
  const endDate = project.end_date || project.estimated_end_date
    ? new Date(project.end_date || project.estimated_end_date!)
    : null;

  if (startDate && endDate) {
    const now = new Date();
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    return Math.round(progress);
  }

  // Fallback based on status
  if (project.status === 'in_progress') return 50;
  if (project.status === 'paused') return 50;
  return 0;
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Handle "new" route - redirect to new project page or show create form
  if (id === "new") {
    // For now, redirect to projects list or show 404
    // You may want to create a separate new project page
    notFound();
  }

  // Validate that id is a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error("Invalid project ID format:", id);
    notFound();
  }

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

  if (!profile.company_id) {
    throw new Error("User profile missing company_id");
  }

  // Update recent projects list (only for valid project IDs)
  try {
    await updateRecentProject(user.id, id);
  } catch (error) {
    console.error("Failed to update recent projects:", error);
    // Don't throw - this is not critical for the page to function
  }

  // Get project details using company_id
  const projectResponse = await getProject(profile.company_id, id);

  if (!projectResponse.data) {
    console.error("Project not found or access denied:", {
      companyId: profile.company_id,
      projectId: id,
      error: projectResponse.error
    });
    notFound();
  }

  const project = projectResponse.data;

  // Fetch clients for the edit dialog
  const clients = await fetchClientsForCompany(user.id);

  // Fetch workers for the add team members functionality
  const workersResponse = await getWorkers(profile.company_id);
  const workers = workersResponse.data || [];

  // Fetch project assignments for this project with worker details
  const projectAssignmentsResponse = await getProjectAssignments(profile.company_id, { 
    project_id: id,
    is_active: true 
  });
  const projectAssignments = projectAssignmentsResponse.data || [];

  // Fetch payrolls for this project
  const payrollsResponse = await getPayrollsByProject(id);
  const payrolls = payrollsResponse.data || [];

  const { data: projectInvoices } = await supabase
    .from("invoices")
    .select(`
      *,
      client:clients(id, name, company),
      payments:invoice_payments(id, amount),
      line_items:invoice_line_items(id, total)
    `)
    .eq("company_id", profile.company_id)
    .eq("project_id", id)
    .order("issue_date", { ascending: false });

  // Fetch recent timesheets for activity feed
  const timesheetsResponse = await getTimesheets(user.id, {
    project_id: id,
    limit: 10
  });
  const recentTimesheets = timesheetsResponse.data || [];

  // Calculate actual costs from confirmed payroll
  const actualPayrollCost = payrolls.reduce((total, payroll) => total + (payroll.gross_pay || 0), 0);

  // Calculate budgets
  const totalBudget = project.budget || 0;
  // Use payroll_budget directly from database (no fallback calculation)
  const estimatedLaborCost = project.payroll_budget || 0;

  // Calculate financial data for new components
  const invoicedAmount = projectInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
  const paidAmount = projectInvoices?.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0;
  const unpaidInvoices = projectInvoices?.filter(inv => (inv.total_amount || 0) > (inv.amount_paid || 0)) || [];

  const financialData: FinancialData = {
    estimatedLabor: estimatedLaborCost,
    actualLabor: actualPayrollCost,
    invoicedAmount,
    paidAmount,
    outstandingBalance: invoicedAmount - paidAmount,
    invoiceCount: projectInvoices?.length || 0,
    unpaidInvoiceCount: unpaidInvoices.length
  };

  // Calculate project progress
  const projectProgress = calculateProjectProgress(project);

  // Calculate totals for each worker from payroll data
  const workerTotals = new Map();
  payrolls.forEach(payroll => {
    const workerId = payroll.worker_id;
    const current = workerTotals.get(workerId) || { hours: 0, pay: 0 };
    current.hours += payroll.total_hours || 0;
    current.pay += payroll.gross_pay || 0;
    workerTotals.set(workerId, current);
  });

  // Get worker details from project assignments
  const teamMembers = projectAssignments.map(assignment => {
    const worker = assignment.worker;
    const totals = workerTotals.get(assignment.worker_id) || { hours: 0, pay: 0 };
    return {
      id: assignment.worker_id,
      name: worker?.name || "Unknown Worker",
      position: assignment.role_on_project || worker?.position || "Worker",
      hourlyRate: worker?.hourly_rate || 0,
      totalHours: totals.hours,
      totalPay: totals.pay,
    };
  });

  return (
    <ProjectDetailPageClient>
      <DashboardLayout
        title={
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/dashboard/projects"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-muted-foreground" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-semibold text-foreground truncate max-w-[150px] sm:max-w-[250px] md:max-w-[350px]">
                  {project.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        showProjectTabs={true}
      >
        <div className="container mx-auto space-y-6 p-6">


        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
          <ProjectTabsWrapper className="w-full">

            <TabsContent value="overview" className="container mx-auto py-4 space-y-6">
              {/* Project Header with Status and Progress */}
              <ProjectHeader
                project={project}
                progress={projectProgress}
              />

              {/* Financial Snapshot - 4-card grid */}
              <FinancialSnapshot financials={financialData} />

              {/* Project Timeline (Gantt-lite) */}
              <ProjectTimeline
                projectStartDate={project.start_date}
                projectEndDate={project.end_date || project.estimated_end_date}
              />

              {/* Tasks & Phases Section */}
              <ProjectTasks />

              {/* Two column layout for Activity and Details */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Activity Feed */}
                <ActivityFeed timesheets={recentTimesheets} />

                {/* Project Details Section */}
                <ProjectDetailsSection
                  project={project}
                  clients={clients}
                  userId={user.id}
                />
              </div>

              {/* Team Members Section */}
              <TeamMembersClient
                project={project}
                teamMembers={teamMembers}
                workers={workers}
                userId={user.id}
              />
            </TabsContent>

            <TabsContent value="qr-codes" className="container mx-auto py-4 space-y-6">
              <ProjectQRCodes projectId={id} userId={user.id} />
            </TabsContent>

            <TabsContent value="documents" className="container mx-auto py-4 space-y-6">
              <ProjectDocumentsNew projectId={id} />
            </TabsContent>

            <TabsContent value="invoices" className="container mx-auto py-4 space-y-6">
              <ProjectInvoices
                invoices={projectInvoices || []}
                projectId={id}
                clientId={project.client_id}
              />
            </TabsContent>
          </ProjectTabsWrapper>
        </div>
      </div>
    </DashboardLayout>
    </ProjectDetailPageClient>
  );
} 