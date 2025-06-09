"use client";

import { useState, useEffect, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { SearchForm } from "@/components/search-form";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { Button } from "@/components/ui/button";
import type { Project, ProjectAssignment } from "@/lib/types";
import type { Client } from "@/lib/types/client";
import type { Worker } from "@/lib/types/worker";
import {
  fetchProjectsForCompany,
  fetchClientsForCompany,
  fetchWorkersForCompany,
  deleteProject,
} from "@/lib/data/data";
import { fetchProjectAssignments } from "@/lib/data/project-assignments";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreVertical,
  Plus,
  Building2,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ProjectDialog } from "@/components/forms/form-dialogs";

const columns = [
  "Project",
  "Client",
  "Start Date",
  "Status",
  "Workers Assigned",
];

export default function ProjectsTable({ user }: { user: User }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<
    ProjectAssignment[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProjects();
    loadClients();
    loadWorkers();
    loadProjectAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await fetchProjectsForCompany(user.id);
      setProjects(data);
    } catch (error) {
      console.log("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await fetchClientsForCompany(user.id);
      setClients(data);
    } catch (error) {
      console.log("Failed to load clients:", error);
    }
  };

  const loadWorkers = async () => {
    try {
      const data = await fetchWorkersForCompany(user.id);
      setWorkers(data);
    } catch (error) {
      console.log("Failed to load workers:", error);
    }
  };

  const loadProjectAssignments = async () => {
    try {
      const data = await fetchProjectAssignments(user.id);
      setProjectAssignments(data);
    } catch (error) {
      console.log("Failed to load project assignments:", error);
    }
  };

  const handleDeleteProject = async () => {
    if (selectedProject) {
      try {
        await deleteProject(selectedProject.id, { user });
        console.log(`Project "${selectedProject.name}" deleted successfully.`);
      } catch (error) {
        console.log(
          "Failed to delete project:",
          error instanceof Error ? error.message : error
        );
      } finally {
        loadProjects();
      }
    }
  };

  const assignmentCounts = useMemo(() => {
    const map = new Map<string, number>();
    projectAssignments.forEach((pa) => {
      map.set(pa.project_id, (map.get(pa.project_id) || 0) + 1);
    });
    return map;
  }, [projectAssignments]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesClient = selectedClient
        ? project.client_id === selectedClient.id
        : true;
      const matchesStatus =
        statusFilter === "all" ? true : project.status === statusFilter;
      const matchesSearch =
        searchTerm.trim() === "" ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesClient && matchesStatus && matchesSearch;
    });
  }, [projects, selectedClient, statusFilter, searchTerm]);

  // Calculate statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.status === "in_progress"
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === "completed"
  ).length;
  const totalWorkerAssignments = projectAssignments.length;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      not_started: {
        label: "Not Started",
        variant: "secondary" as const,
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
      in_progress: {
        label: "In Progress",
        variant: "default" as const,
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      paused: {
        label: "Paused",
        variant: "secondary" as const,
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
      completed: {
        label: "Completed",
        variant: "default" as const,
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      cancelled: {
        label: "Cancelled",
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.not_started;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Project Management
        </h1>
        <p className="text-muted-foreground">
          Manage construction projects and track progress across your portfolio
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Projects
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalProjects}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Projects
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {activeProjects}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {completedProjects}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Worker Assignments
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalWorkerAssignments}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Client
                </label>
                <div className="flex items-center gap-2">
                  <SearchableCombobox
                    items={clients}
                    selectedItem={selectedClient}
                    onSelect={(item) => setSelectedClient(item)}
                    displayKey="name"
                    placeholder="Select a client"
                  />
                  {selectedClient && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedClient(null)}
                      className="h-10 w-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium text-foreground">
                  Search
                </label>
                <SearchForm
                  placeholder="Search projects..."
                  className="w-full"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Add Project Button */}
            <div className="flex items-end">
              <ProjectDialog
                userId={user.id}
                clients={clients}
                workers={workers}
                onSuccess={() => {
                  loadProjects();
                  loadProjectAssignments();
                }}
                trigger={
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          {/* Column Headers */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_40px] gap-4 px-6 py-4 border-b border-border/50 bg-muted/30">
            {columns.map((col) => (
              <div
                key={col}
                className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
              >
                {col}
              </div>
            ))}
            <div /> {/* Empty column for the menu */}
          </div>

          {/* Data Rows */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading projects...</span>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No projects found
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                {statusFilter !== "all" || selectedClient
                  ? "No projects match your current filters. Try adjusting your search criteria."
                  : "You haven't added any projects yet. Add your first project to start building your portfolio."}
              </p>
              <ProjectDialog
                userId={user.id}
                clients={clients}
                workers={workers}
                onSuccess={() => {
                  loadProjects();
                  loadProjectAssignments();
                }}
                trigger={
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Building2 className="mr-2 h-4 w-4" />
                    Add Your First Project
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredProjects.map((project, i) => (
                <div
                  key={project.id || i}
                  className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_min-content] gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {project.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {project.location || "Location TBD"}
                      </p>
                    </div>
                  </div>

                  <div className="text-foreground">
                    {clients.find((c) => c.id === project.client_id)?.name ||
                      "Unknown Client"}
                  </div>

                  <div className="flex items-center space-x-2 text-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(parseISO(project.start_date), "MMM d, yyyy")}
                    </span>
                  </div>

                  <div>{getStatusBadge(project.status)}</div>

                  <div className="flex items-center space-x-2 text-foreground">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {assignmentCounts.get(project.id) || 0}{" "}
                      {(assignmentCounts.get(project.id) || 0) === 1
                        ? "worker"
                        : "workers"}
                    </span>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <ProjectDialog
                          userId={user.id}
                          project={{
                            ...project,
                            assigned_worker_ids: projectAssignments
                              .filter((pa) => pa.project_id === project.id)
                              .map((pa) => pa.worker_id),
                          }}
                          clients={clients}
                          workers={workers}
                          onSuccess={() => {
                            loadProjects();
                            loadProjectAssignments();
                          }}
                          trigger={
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              Edit Project
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProject(project);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProject(null);
          }
          setIsDeleteDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{selectedProject?.name}</strong> and all associated
              timesheet data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
