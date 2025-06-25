"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditWorkerDialog } from "@/components/forms/worker-form";
import { getWorker } from "@/lib/data/workers";
import { getTimesheets } from "@/lib/data/timesheets";
import { getUserProfileWithCompany } from "@/lib/data/userProfiles";
import type { WorkerWithDetails } from "@/lib/types/worker";
import type { TimesheetWithDetails } from "@/lib/types";
import {
  Building2,
  FileText,
  Clock,
  User as UserIcon,
  StickyNote,
  Edit,
} from "lucide-react";

export default function WorkerDetails() {
  const params = useParams();
  const [worker, setWorker] = useState<WorkerWithDetails | null>(null);
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      try {
        const profile = await getUserProfileWithCompany();
        if (!profile || !profile.company_id) {
          throw new Error('Failed to load user profile');
        }

        const workerResult = await getWorker(profile.company_id, params.id as string);
        if (!workerResult.success || !workerResult.data) {
          throw new Error(workerResult.error || "Failed to load worker");
        }
        setWorker(workerResult.data);

        const timesheetsResult = await getTimesheets(user.id, {
          worker_id: params.id as string,
          limit: 10,
        });
        if (timesheetsResult.success && timesheetsResult.data) {
          setTimesheets(timesheetsResult.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading worker details...</p>
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Worker not found"}</p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header Section with Avatar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-24 w-24 border-4 border-muted">
              <AvatarImage src={undefined} alt={worker.name} />
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {getInitials(worker.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 ml-4">
              <h1 className="text-3xl font-bold tracking-tight">{worker.name}</h1>
              <p className="text-xl text-muted-foreground">{worker.position}</p>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={worker.is_active ? "default" : "secondary"}
                  className={
                    worker.is_active
                      ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                      : "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
                  }
                >
                  {worker.is_active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">${worker.hourly_rate}/hr</span>
              </div>
            </div>
          </div>
          {user && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>

        {/* Edit Worker Dialog */}
        {user && (
          <EditWorkerDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            userId={user.id}
            worker={worker}
            onSuccess={() => {
              // Refresh the page to show updated data
              window.location.reload();
            }}
            onCancel={() => setEditDialogOpen(false)}
          />
        )}

        {/* Tabs */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-muted">
              <TabsList className="inline-flex h-12 items-center justify-start p-0 bg-transparent border-none">
                <TabsTrigger
                  value="details"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
                >
                  Details
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="timecards"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
                >
                  Timecards
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="documents"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
                >
                  Documents
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="notes"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
                >
                  Notes
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details" className="container mx-auto py-4 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Email</div>
                      <p className="font-medium">{worker.email || "Not provided"}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <p className="font-medium">{worker.phone || "Not provided"}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Address</div>
                      <p className="font-medium">{worker.address || "Not provided"}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">NIB Number</div>
                      <p className="font-medium">{worker.nib_number || "Not provided"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Employment Details */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Employment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Hourly Rate</div>
                      <p className="font-medium">${worker.hourly_rate}/hr</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Hire Date</div>
                      <p className="font-medium">{format(parseISO(worker.hire_date), "PPP")}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Department</div>
                      <p className="font-medium">{worker.department || "Not specified"}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Status</div>
                      <Badge
                        variant={worker.is_active ? "default" : "secondary"}
                        className={
                          worker.is_active
                            ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                            : "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
                        }
                      >
                        {worker.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Skills & Certifications */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                  <CardHeader>
                    <CardTitle>Skills & Certifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {worker.skills && worker.skills.length > 0 ? (
                          worker.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No skills listed</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Certifications</h3>
                      <div className="flex flex-wrap gap-2">
                        {worker.certifications && worker.certifications.length > 0 ? (
                          worker.certifications.map((cert, index) => (
                            <Badge key={index} variant="secondary">
                              {cert}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No certifications listed</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                  <CardHeader>
                    <CardTitle>Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Contact Name</div>
                      <p className="font-medium">{worker.emergency_contact || "Not provided"}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Contact Phone</div>
                      <p className="font-medium">{worker.emergency_phone || "Not provided"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Projects */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Current Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {worker.current_projects && worker.current_projects.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {worker.current_projects
                        .filter((assignment: { project: { id: string; name: string } | null; is_active?: boolean }) => assignment.project)
                        .map((assignment: { project: { id: string; name: string }; role_on_project?: string; id?: string }, index: number) => (
                        <Card key={`${assignment.project.id}-${assignment.id || index}`} className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Project</div>
                            <p className="font-medium">{assignment.project.name}</p>
                            <div className="text-sm text-muted-foreground">Role</div>
                            <p className="font-medium">{assignment.role_on_project || "Not specified"}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No current projects</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timecards" className="container mx-auto py-4 space-y-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Timecards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timesheets.length > 0 ? (
                    <div className="space-y-4">
                      {timesheets.map((timesheet) => (
                        <Card key={timesheet.id} className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                          <div className="grid gap-4 md:grid-cols-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Date</p>
                              <p className="font-medium">{format(parseISO(timesheet.date), "PPP")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Project</p>
                              <p className="font-medium">{timesheet.project?.name || "Unknown Project"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Hours</p>
                              <p className="font-medium">{timesheet.total_hours}h ({timesheet.regular_hours}h regular, {timesheet.overtime_hours}h overtime)</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Status</p>
                              <Badge
                                variant={
                                  timesheet.supervisor_approval === "approved"
                                    ? "default"
                                    : timesheet.supervisor_approval === "rejected"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {timesheet.supervisor_approval.charAt(0).toUpperCase() + timesheet.supervisor_approval.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No timecards found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="container mx-auto py-4 space-y-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Document management functionality will be implemented here. This will include:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li>• Employment contracts</li>
                    <li>• Identification documents</li>
                    <li>• Certifications and licenses</li>
                    <li>• Performance reviews</li>
                    <li>• Training records</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="container mx-auto py-4 space-y-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {worker.notes ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="whitespace-pre-wrap text-sm">{worker.notes}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No notes available for this worker.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 