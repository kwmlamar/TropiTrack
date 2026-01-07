import { createClient } from "@/utils/supabase/server";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { updateRecentProject } from "@/lib/data/recent-projects";
import { getProject } from "@/lib/data/projects";
import { getProfile } from "@/lib/data/data";
import { getTransactionsServer } from "@/lib/data/transactions";
import { getPayrollsByProject } from "@/lib/data/payroll";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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

// Helper function to get color based on percentage
function getProgressColor(percentage: number): string {
  if (percentage <= 70) return "bg-green-500";
  if (percentage <= 90) return "bg-yellow-500";
  return "bg-red-500";
}

// Helper function to get status text based on percentage
function getProgressStatus(percentage: number): string {
  if (percentage <= 70) return "On Track";
  if (percentage <= 90) return "Warning";
  return "Over Budget";
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

  // Fetch transactions for this project (using project name as reference)
  const transactionsResponse = await getTransactionsServer({ 
    search: project.name,
    type: "expense"
  }, profile.company_id);
  const projectTransactions = transactionsResponse.data || [];

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

  // Calculate actual costs from confirmed payroll
  const actualPayrollCost = payrolls.reduce((total, payroll) => total + (payroll.gross_pay || 0), 0);
  const actualOtherCosts = projectTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const actualTotalCost = actualPayrollCost + actualOtherCosts;

  // Calculate budgets
  const totalBudget = project.budget || 0;
  const payrollBudget = project.payroll_budget || (totalBudget * 0.6); // Use specific payroll budget or fallback to 60% of total budget

  // Calculate percentages
  const totalBudgetPercentage = totalBudget > 0 ? (actualTotalCost / totalBudget) * 100 : 0;
  const payrollBudgetPercentage = payrollBudget > 0 ? (actualPayrollCost / payrollBudget) * 100 : 0;

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
      <DashboardLayout title={
        <>
          <span className="text-gray-500">Project</span> <span className="text-gray-500"> / </span> {project.name}
        </>
      }>
        <div className="container mx-auto space-y-6 p-6">


        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b border-muted">
              <TabsList className="inline-flex h-12 items-center justify-start p-0 bg-transparent border-none">
                <TabsTrigger
                  value="overview"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
                >
                  Overview
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="qr-codes"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
                >
                  QR Codes
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="documents"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
                >
                  Documents
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="invoices"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
                >
                  Invoices
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="container mx-auto py-4 space-y-6">
              {/* Project Overview Cards */}
              <div className="space-y-6">
                {/* Total Budget Progress */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Total Budget vs Actual Spend
                    </h3>
                    <p className="text-sm text-gray-500">
                      Track overall project spending against budget
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Budget Utilization</span>
                      <span className="text-sm text-gray-500">
                        {totalBudgetPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(totalBudgetPercentage)}`}
                        style={{ width: `${Math.min(totalBudgetPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Actual: ${actualTotalCost.toFixed(2)}</span>
                      <span className="text-gray-500">Budget: ${totalBudget.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payroll Budget Progress */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Payroll Budget vs Actual
                    </h3>
                    <p className="text-sm text-gray-500">
                      Track labor costs against payroll budget
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Payroll Utilization</span>
                      <span className="text-sm text-gray-500">
                        {payrollBudgetPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(payrollBudgetPercentage)}`}
                        style={{ width: `${Math.min(payrollBudgetPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Actual: ${actualPayrollCost.toFixed(2)}</span>
                      <span className="text-gray-500">Budget: ${payrollBudget.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <Badge 
                        variant={payrollBudgetPercentage <= 70 ? "default" : payrollBudgetPercentage <= 90 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {getProgressStatus(payrollBudgetPercentage)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Details Section */}
              <ProjectDetailsSection
                project={project}
                clients={clients}
                userId={user.id}
              />

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
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
    </ProjectDetailPageClient>
  );
} 