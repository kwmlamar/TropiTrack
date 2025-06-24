import { createClient } from "@/utils/supabase/server";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { updateRecentProject } from "@/lib/data/recent-projects";
import { getProject } from "@/lib/data/projects";
import { getProfile } from "@/lib/data/data";
import { getTransactions } from "@/lib/data/transactions";
import { getPayrollsByProject } from "@/lib/data/payroll";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getProjectAssignments } from "@/lib/data/project-assignments";
import { fetchClientsForCompany } from "@/lib/data/data";
import { ProjectDetailsSection } from "@/components/projects/project-details-section";
import { TeamMembersClient } from "@/components/projects/team-members-client";
import { getWorkers } from "@/lib/data/workers";

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
  const projectResponse = await getProject(profile.company_id, id);

  if (!projectResponse.data) {
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
  const transactionsResponse = await getTransactions({ 
    search: project.name,
    type: "expense"
  });
  const projectTransactions = transactionsResponse.data || [];

  // Fetch payrolls for this project
  const payrollsResponse = await getPayrollsByProject(id);
  const payrolls = payrollsResponse.data || [];

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
    <DashboardLayout title={project.name}>
      <div className="container mx-auto space-y-6 p-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/dashboard/projects" className="hover:text-foreground transition-colors">
            Projects
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{project.name}</span>
        </div>

        {/* Project Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {project.name}
              </h1>
              <p className="text-muted-foreground">
                Created on {format(new Date(project.created_at), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b border-muted">
              <TabsList className="inline-flex h-12 items-center justify-start p-0 bg-transparent border-none">
                <TabsTrigger
                  value="overview"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
                >
                  Overview
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="budget"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
                >
                  Budget
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="payroll"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
                >
                  Payroll
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="documents"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
                >
                  Documents
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
                    <p className="text-sm text-muted-foreground">
                      Track overall project spending against budget
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Budget Utilization</span>
                      <span className="text-sm text-muted-foreground">
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
                      <span className="text-muted-foreground">Actual: ${actualTotalCost.toFixed(2)}</span>
                      <span className="text-muted-foreground">Budget: ${totalBudget.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payroll Budget Progress */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Payroll Budget vs Actual
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Track labor costs against payroll budget
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Payroll Utilization</span>
                      <span className="text-sm text-muted-foreground">
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
                      <span className="text-muted-foreground">Actual: ${actualPayrollCost.toFixed(2)}</span>
                      <span className="text-muted-foreground">Budget: ${payrollBudget.toFixed(2)}</span>
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

            <TabsContent value="budget" className="container mx-auto py-4 space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Project Budget</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track budget allocation, expenses, and financial performance.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-muted-foreground">Budget tracking features coming soon...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payroll" className="container mx-auto py-4 space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Project Payroll</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    View payroll data and labor costs for this project.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-muted-foreground">Project payroll features coming soon...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="container mx-auto py-4 space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Project Documents</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage contracts, plans, permits, and other project documents.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-muted-foreground">Document management features coming soon...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
} 