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
import { WorkerPinSetup } from './worker-pin-setup';
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
  Shield,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { getWorkerPinStatus, resetWorkerPin } from '@/lib/data/worker-pins';

export default function WorkerDetails() {
  const params = useParams();
  const [worker, setWorker] = useState<WorkerWithDetails | null>(null);
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinStatus, setPinStatus] = useState<{
    hasPin: boolean
    pinSetAt?: string
    pinLastUsed?: string
    isLocked: boolean
    attempts: number
  } | null>(null);
  const [pinLoading, setPinLoading] = useState(false);



  // Load PIN status
  const loadPinStatus = async () => {
    if (!worker?.id) return;
    
    setPinLoading(true);
    try {
      const result = await getWorkerPinStatus(worker.id);
      if (result.success && result.data) {
        setPinStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to load PIN status:', error);
    } finally {
      setPinLoading(false);
    }
  };

  const handlePinSet = () => {
    setShowPinSetup(false);
    loadPinStatus(); // Refresh the status
  };

  const handleResetPin = async () => {
    if (!worker?.id) return;
    
    try {
      const result = await resetWorkerPin("", worker.id); // Empty userId for now
      if (result.success) {
        loadPinStatus();
      }
    } catch (error) {
      console.error('Failed to reset PIN:', error);
    }
  };

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

  // Load PIN status when worker changes
  useEffect(() => {
    if (worker) {
      loadPinStatus();
    }
  }, [worker]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading worker details...</p>
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
              <p className="text-xl text-gray-500">{worker.position}</p>
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
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">${worker.hourly_rate}/hr</span>
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
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
                >
                  Details
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="timecards"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
                >
                  Timecards
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="documents"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
                >
                  Documents
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="notes"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
                >
                  Notes
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="pin"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
                >
                  PIN
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details" className="container mx-auto py-4 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <Card className="border-border/50 bg-sidebar">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Email</div>
                      <p className="font-medium">{worker.email || "Not provided"}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Phone</div>
                      <p className="font-medium">{worker.phone || "Not provided"}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Address</div>
                      <p className="font-medium">{worker.address || "Not provided"}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">NIB Number</div>
                      <p className="font-medium">{worker.nib_number || "Not provided"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Employment Details */}
                <Card className="border-border/50 bg-sidebar">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Employment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Hourly Rate</div>
                      <p className="font-medium">${worker.hourly_rate}/hr</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Hire Date</div>
                      <p className="font-medium">{format(parseISO(worker.hire_date), "PPP")}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Department</div>
                      <p className="font-medium">{worker.department || "Not specified"}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Status</div>
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
                <Card className="border-border/50 bg-sidebar">
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
                          <p className="text-gray-500">No skills listed</p>
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
                          <p className="text-gray-500">No certifications listed</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card className="border-border/50 bg-sidebar">
                  <CardHeader>
                    <CardTitle>Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Contact Name</div>
                      <p className="font-medium">{worker.emergency_contact || "Not provided"}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Contact Phone</div>
                      <p className="font-medium">{worker.emergency_phone || "Not provided"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Projects */}
              <Card className="border-border/50 bg-sidebar">
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
                        <Card key={`${assignment.project.id}-${assignment.id || index}`} className="p-4 border-border/50 bg-sidebar">
                          <div className="space-y-2">
                            <div className="text-sm text-gray-500">Project</div>
                            <p className="font-medium">{assignment.project.name}</p>
                            <div className="text-sm text-gray-500">Role</div>
                            <p className="font-medium">{assignment.role_on_project || "Not specified"}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No current projects</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timecards" className="container mx-auto py-4 space-y-6">
              <Card className="border-border/50 bg-sidebar">
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
                        <Card key={timesheet.id} className="p-4 border-border/50 bg-sidebar">
                          <div className="grid gap-4 md:grid-cols-4">
                            <div>
                              <p className="text-sm text-gray-500">Date</p>
                              <p className="font-medium">{format(parseISO(timesheet.date), "PPP")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Project</p>
                              <p className="font-medium">{timesheet.project?.name || "Unknown Project"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Hours</p>
                              <p className="font-medium">{timesheet.total_hours}h ({timesheet.regular_hours}h regular, {timesheet.overtime_hours}h overtime)</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Status</p>
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
                    <p className="text-gray-500">No timecards found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="container mx-auto py-4 space-y-6">
              <Card className="border-border/50 bg-sidebar">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Document management functionality will be implemented here. This will include:
                  </p>
                  <ul className="mt-4 space-y-2 text-gray-500">
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
              <Card className="border-border/50 bg-sidebar">
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
                    <p className="text-gray-500">No notes available for this worker.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pin" className="space-y-4">
              {showPinSetup ? (
                <WorkerPinSetup
                  workerId={worker.id}
                  workerName={worker.name}
                  onPinSet={handlePinSet}
                  onCancel={() => setShowPinSetup(false)}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">PIN Authentication</h3>
                    <Button
                      onClick={() => setShowPinSetup(true)}
                    >
                      {pinStatus?.hasPin ? 'Update PIN' : 'Set PIN'}
                    </Button>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        PIN Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pinLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      ) : pinStatus ? (
                        <div className="space-y-4">
                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            {pinStatus.hasPin ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                PIN Set
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800 flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                No PIN
                              </Badge>
                            )}
                            
                            {pinStatus.isLocked && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Locked
                              </Badge>
                            )}
                          </div>

                          {/* PIN Details */}
                          {pinStatus.hasPin && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">PIN Set</p>
                                  <p className="font-medium">
                                    {pinStatus.pinSetAt ? new Date(pinStatus.pinSetAt).toLocaleString() : 'Unknown'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Last Used</p>
                                  <p className="font-medium">
                                    {pinStatus.pinLastUsed ? new Date(pinStatus.pinLastUsed).toLocaleString() : 'Never'}
                                  </p>
                                </div>
                              </div>
                              
                              {pinStatus.attempts > 0 && (
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>Failed Attempts:</strong> {pinStatus.attempts}
                                    {pinStatus.attempts >= 5 && " (PIN is locked)"}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={() => setShowPinSetup(true)}
                              className="flex-1"
                            >
                              <Key className="h-4 w-4 mr-2" />
                              {pinStatus?.hasPin ? 'Update PIN' : 'Set PIN'}
                            </Button>
                            
                            {pinStatus?.hasPin && (
                              <Button
                                variant="outline"
                                onClick={handleResetPin}
                                className="flex-1"
                              >
                                Reset PIN
                              </Button>
                            )}
                          </div>

                          {/* Security Notice */}
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <strong>Security:</strong> PINs are encrypted and stored securely. 
                              Workers use their PIN to verify identity when clocking in/out via QR codes.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Failed to load PIN status</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 