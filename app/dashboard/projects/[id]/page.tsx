import { createClient } from "@/utils/supabase/server";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { updateRecentProject } from "@/lib/data/recent-projects";
import { getProject } from "@/lib/data/projects";
import { getProfile } from "@/lib/data/data";
import { getTimesheets } from "@/lib/data/timesheets";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { notFound } from "next/navigation";
import { fetchProjectAssignments } from "@/lib/data/project-assignments";

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
  const { data: project, error: projectError } = await getProject(
    profile.company_id,
    id
  );

  if (projectError || !project) {
    notFound();
  }

  // Fetch project assignments for this project
  const projectAssignments = await fetchProjectAssignments(user.id, id);
  
  // Fetch timesheets for this project to calculate totals
  const timesheetsResponse = await getTimesheets(user.id, { project_id: id });
  const timesheets = timesheetsResponse.data || [];

  // Calculate totals for each worker
  const workerTotals = new Map();
  timesheets.forEach(timesheet => {
    const workerId = timesheet.worker_id;
    const current = workerTotals.get(workerId) || { hours: 0, pay: 0 };
    current.hours += timesheet.total_hours || 0;
    current.pay += timesheet.total_pay || 0;
    workerTotals.set(workerId, current);
  });

  // Get worker details from project assignments
  const teamMembers = projectAssignments.map(assignment => {
    const worker = assignment.worker;
    const totals = workerTotals.get(assignment.worker_id) || { hours: 0, pay: 0 };
    return {
      id: assignment.worker_id,
      name: worker?.name || "Unknown Worker",
      role: assignment.role_on_project || worker?.role || "Worker",
      hourlyRate: assignment.hourly_rate || worker?.hourly_rate || 0,
      totalHours: totals.hours,
      totalPay: totals.pay,
    };
  });

  // Calculate actual payroll costs from timesheets
  let actualPayrollCost = 0;
  const totalBudget = project.budget || 0;
  const payrollBudget = totalBudget * 0.6; // Assume 60% of total budget is for payroll

  try {
    // Get all timesheets for this project
    const timesheetsResult = await getTimesheets(user.id, {
      project_id: id,
      supervisor_approval: "approved"
    });

    if (timesheetsResult.success && timesheetsResult.data) {
      // Calculate total payroll cost from approved timesheets
      actualPayrollCost = timesheetsResult.data.reduce((total, timesheet) => {
        const regularPay = timesheet.regular_hours * (timesheet.worker?.hourly_rate || 0);
        const overtimePay = timesheet.overtime_hours * (timesheet.worker?.hourly_rate || 0) * 1.5;
        return total + regularPay + overtimePay;
      }, 0);
    }
  } catch (error) {
    console.error("Error calculating payroll costs:", error);
  }

  // Calculate percentages
  const totalBudgetPercentage = totalBudget > 0 ? (actualPayrollCost / totalBudget) * 100 : 0;
  const payrollBudgetPercentage = payrollBudget > 0 ? (actualPayrollCost / payrollBudget) * 100 : 0;

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
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(totalBudgetPercentage)}`}
                        style={{ width: `${Math.min(100, totalBudgetPercentage)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Actual: ${actualPayrollCost.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        Budget: ${totalBudget.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <Badge 
                        variant={totalBudgetPercentage <= 70 ? "default" : totalBudgetPercentage <= 90 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {getProgressStatus(totalBudgetPercentage)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Payroll Budget Progress */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Payroll Budget vs Actual Payroll
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor labor costs against payroll budget
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Payroll Utilization</span>
                      <span className="text-sm text-muted-foreground">
                        {payrollBudgetPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(payrollBudgetPercentage)}`}
                        style={{ width: `${Math.min(100, payrollBudgetPercentage)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Actual: ${actualPayrollCost.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        Budget: ${payrollBudget.toLocaleString()}
                      </span>
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

              {/* Project Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Project Details</h3>
                  <p className="text-sm text-muted-foreground">
                    Key information and details about this project.
                  </p>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Project Name</h4>
                      <p className="text-sm mt-1">{project.name}</p>
                    </div>
                    {project.client && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">Client</h4>
                        <p className="text-sm mt-1">{project.client.name}</p>
                        {project.client.company && (
                          <p className="text-sm text-muted-foreground">{project.client.company}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                      <p className="text-sm mt-1">{project.status}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Start Date</h4>
                      <p className="text-sm mt-1">
                        {project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "Not started"}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">End Date</h4>
                      <p className="text-sm mt-1">
                        {project.end_date ? format(new Date(project.end_date), "MMM d, yyyy") : "No end date"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Location</h4>
                      <p className="text-sm mt-1">{project.location || "No location specified"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Team Members</h3>
                  <p className="text-sm text-muted-foreground">
                    Workers assigned to this project and their performance metrics.
                  </p>
                </div>
                <Separator />
                {teamMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No team members assigned
                    </h3>
                    <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                      No workers have been assigned to this project yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* Column Headers */}
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-border/50 bg-muted/30">
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Name
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Role
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Hourly Rate
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Total Hours
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Total Pay
                      </div>
                    </div>

                    {/* Data Rows */}
                    <div className="divide-y divide-border/50">
                      {teamMembers.map((member, i) => (
                        <div
                          key={member.id || i}
                          className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-foreground">{member.name}</p>
                          </div>
                          <div className="text-foreground">
                            {member.role}
                          </div>
                          <div className="text-foreground">
                            ${member.hourlyRate.toFixed(2)}
                          </div>
                          <div className="text-foreground">
                            {member.totalHours.toFixed(1)}h
                          </div>
                          <div className="text-foreground">
                            ${member.totalPay.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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