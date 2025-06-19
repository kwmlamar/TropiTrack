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
import { WorkerSheet } from "@/components/forms/form-dialogs";
import { getWorker } from "@/lib/data/workers";
import { getTimesheets } from "@/lib/data/timesheets";
import { getUserProfileWithCompany } from "@/lib/data/userProfiles";
import type { WorkerWithDetails } from "@/lib/types/worker";
import type { TimesheetWithDetails } from "@/lib/types";
import {
  User as UserIcon,
  Briefcase,
  Clock,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Shield,
  Award,
  FileText,
  Calendar,
  Building2,
} from "lucide-react";

export default function WorkerDetails() {
  const params = useParams();
  const [worker, setWorker] = useState<WorkerWithDetails | null>(null);
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <div className="container mx-auto p-6 space-y-6">
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{worker.name}</h1>
          <p className="text-muted-foreground">{worker.position}</p>
        </div>
        {user && (
          <WorkerSheet
            userId={user.id}
            worker={worker}
            trigger={
              <Button>
                Edit Worker
              </Button>
            }
          />
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Personal Information */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-muted-foreground">
                  <span>Email</span>
                </div>
                <p>{worker.email || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <div className="text-muted-foreground">
                  <span>Phone</span>
                </div>
                <p>{worker.phone || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <div className="text-muted-foreground">
                  <span>Address</span>
                </div>
                <p>{worker.address || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <div className="text-muted-foreground">
                  <span>NIB Number</span>
                </div>
                <p>{worker.nib_number || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-muted-foreground">
                  <span>Hourly Rate</span>
                </div>
                <p>${worker.hourly_rate}/hr</p>
              </div>
              <div className="space-y-2">
                <div className="text-muted-foreground">
                  <span>Hire Date</span>
                </div>
                <p>{format(parseISO(worker.hire_date), "PPP")}</p>
              </div>
              <div className="space-y-2">
                <div className="text-muted-foreground">
                  <span>Department</span>
                </div>
                <p>{worker.department || "Not specified"}</p>
              </div>
              <div className="space-y-2">
                <div className="text-muted-foreground">
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
              </div>
            </CardContent>
          </Card>

          {/* Skills & Certifications */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>
                Skills & Certifications
              </CardTitle>
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
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-muted-foreground">
                  <span>Contact Name</span>
                </div>
                <p>{worker.emergency_contact || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <div className="text-muted-foreground">
                  <span>Contact Phone</span>
                </div>
                <p>{worker.emergency_phone || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {worker.notes && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{worker.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>
                Recent Timesheets
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
                          <p>{format(parseISO(timesheet.date), "PPP")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Project</p>
                          <p>{timesheet.project?.name || "Unknown Project"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Hours</p>
                          <p>{timesheet.total_hours}h ({timesheet.regular_hours}h regular, {timesheet.overtime_hours}h overtime)</p>
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
                <p className="text-muted-foreground">No timesheets found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Current Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {worker.current_projects && worker.current_projects.length > 0 ? (
                <div className="space-y-4">
                  {worker.current_projects.map((assignment) => (
                    <Card key={`${assignment.project.id}-${assignment.role_on_project}`} className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Project</p>
                          <p>{assignment.project.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Role</p>
                          <p>{assignment.role_on_project || "Not specified"}</p>
                        </div>
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
      </Tabs>
    </div>
    </div>
  );
} 