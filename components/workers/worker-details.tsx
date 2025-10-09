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
  Eye,
  EyeOff,
} from "lucide-react";
import { getWorkerPinStatus, resetWorkerPin, getWorkerPinForAdmin, testPinForAdminColumn } from '@/lib/data/worker-pins';

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
  const [adminPin, setAdminPin] = useState<string | null>(null);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminPinError, setAdminPinError] = useState<string | null>(null);



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

  // Load admin PIN
  const loadAdminPin = async () => {
    if (!worker?.id) return;
    
    try {
      console.log('Loading admin PIN for worker:', worker.id);
      const result = await getWorkerPinForAdmin(worker.id);
      console.log('Admin PIN result:', result);
      if (result.success) {
        console.log('Setting admin PIN to:', result.data);
        setAdminPin(result.data);
        setAdminPinError(null);
      } else {
        console.error('Failed to get admin PIN:', result.error);
        setAdminPin(null);
        setAdminPinError(result.error || 'Failed to load admin PIN');
      }
    } catch (error) {
      console.error('Failed to load admin PIN:', error);
      setAdminPin(null);
      setAdminPinError('Failed to load admin PIN');
    }
  };

  const handlePinSet = () => {
    setShowPinSetup(false);
    loadPinStatus(); // Refresh the status
    loadAdminPin(); // Refresh the admin PIN
  };

  const handleResetPin = async () => {
    if (!worker?.id) return;
    
    try {
      const result = await resetWorkerPin("", worker.id); // Empty userId for now
      if (result.success) {
        loadPinStatus();
        loadAdminPin();
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

  // Load PIN status and admin PIN when worker changes
  useEffect(() => {
    if (worker) {
      loadPinStatus();
      loadAdminPin();
      // Test if column exists
      testPinForAdminColumn().then(result => {
        setColumnExists(result.success ? result.data : false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

            <TabsContent value="pin" className="container mx-auto py-4 space-y-6">
              {showPinSetup ? (
                <div className="max-w-2xl mx-auto">
                  <WorkerPinSetup
                    workerId={worker.id}
                    workerName={worker.name}
                    onPinSet={handlePinSet}
                    onCancel={() => setShowPinSetup(false)}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header Section */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold tracking-tight">PIN Authentication</h3>
                      <p className="text-gray-500">
                        Manage {worker.name}&apos;s PIN for secure QR code clock-in/out verification
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowPinSetup(true)}
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      <Key className="h-4 w-4" />
                      {pinStatus?.hasPin ? 'Update PIN' : 'Set PIN'}
                    </Button>
                  </div>
                  
                  {/* Main PIN Status Card */}
                  <Card className="border-border/50 bg-sidebar">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Shield className="h-6 w-6 text-primary" />
                        </div>
                        PIN Status & Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {pinLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-foreground">Loading PIN status...</p>
                          </div>
                        </div>
                      ) : pinStatus ? (
                        <div className="space-y-6">
                          {/* Status Overview */}
                          <div className="grid gap-4 md:grid-cols-2">
                            {/* Status Card */}
                            <Card className="p-4 border-border/30 bg-background/50">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm text-foreground uppercase tracking-wide">Status</h4>
                                {pinStatus.hasPin ? (
                                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 flex items-center gap-1.5 px-3 py-1">
                                    <CheckCircle className="h-3 w-3" />
                                    PIN Configured
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 flex items-center gap-1.5 px-3 py-1">
                                    <XCircle className="h-3 w-3" />
                                    No PIN Set
                                  </Badge>
                                )}
                              </div>
                              
                              {pinStatus.isLocked && (
                                <div className="mt-3">
                                  <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Account Locked
                                  </Badge>
                                </div>
                              )}

                              {/* PIN Display */}
                              {pinStatus.hasPin && (
                                <div className="mt-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Key className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">PIN:</span>
                                      {showAdminPin && adminPin && adminPin.length === 4 ? (
                                        <span className="text-lg font-mono font-bold text-primary">
                                          {adminPin}
                                        </span>
                                      ) : (
                                        <span className="text-lg font-mono text-foreground">
                                          ••••
                                        </span>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setShowAdminPin(!showAdminPin)}
                                      className="h-6 w-6 p-0 hover:bg-transparent"
                                    >
                                      {showAdminPin ? (
                                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                                      ) : (
                                        <Eye className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </div>
                                  {adminPinError && (
                                    <div className="text-xs text-red-600">
                                      Error: {adminPinError}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Card>

                            {/* Usage Statistics */}
                            <Card className="p-4 border-border/30 bg-background/50">
                              <h4 className="font-semibold text-sm text-foreground uppercase tracking-wide mb-3">Usage Statistics</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-foreground">PIN Set Date</span>
                                  <span className="text-sm font-medium text-foreground">
                                    {pinStatus.pinSetAt ? new Date(pinStatus.pinSetAt).toLocaleDateString() : 'Not set'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-foreground">Last Used</span>
                                  <span className="text-sm font-medium text-foreground">
                                    {pinStatus.pinLastUsed ? new Date(pinStatus.pinLastUsed).toLocaleDateString() : 'Never'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-foreground">Failed Attempts</span>
                                  <span className="text-sm font-medium text-foreground">
                                    {pinStatus.attempts || 0}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          </div>

                          {/* Security Alerts */}
                          {pinStatus.attempts > 0 && (
                            <Card className="p-4 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                                    Security Alert
                                  </h4>
                                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    {pinStatus.attempts} failed PIN attempt{pinStatus.attempts > 1 ? 's' : ''} detected.
                                    {pinStatus.attempts >= 5 && " Account is currently locked for security."}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4 border-t border-border/50">
                            <Button
                              onClick={() => setShowPinSetup(true)}
                              className="flex-1 h-11"
                              size="lg"
                            >
                              <Key className="h-4 w-4 mr-2" />
                              {pinStatus?.hasPin ? 'Update PIN' : 'Set PIN'}
                            </Button>
                            
                            {pinStatus?.hasPin && (
                              <Button
                                variant="outline"
                                onClick={handleResetPin}
                                className="flex-1 h-11"
                                size="lg"
                              >
                                Reset PIN
                              </Button>
                            )}
                          </div>

                          {/* Security Information */}
                          <Card className="p-4 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20">
                            <div className="flex items-start gap-3">
                              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-gray-500 mb-2">
                                  Security Information
                                </h4>
                                <ul className="text-sm text-gray-500 space-y-1">
                                  <li>• PINs are encrypted using bcrypt and stored securely</li>
                                  <li>• PINs must be exactly 4 digits (numbers only)</li>
                                  <li>• Account locks after 5 failed attempts for 15 minutes</li>
                                  <li>• Used for QR code clock-in/out verification</li>
                                  <li>• Company admins can view PINs for management purposes</li>
                                  <li>• PINs are stored temporarily for admin access only</li>
                                </ul>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="space-y-4">
                            <Shield className="h-16 w-16 mx-auto text-muted-foreground/50" />
                            <div>
                              <h4 className="font-semibold text-lg mb-2 text-foreground">Failed to Load PIN Status</h4>
                              <p className="text-foreground mb-4">
                                There was an error loading the PIN information for this worker.
                              </p>
                              <Button 
                                variant="outline" 
                                onClick={loadPinStatus}
                                className="flex items-center gap-2"
                              >
                                Try Again
                              </Button>
                            </div>
                          </div>
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