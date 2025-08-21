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
import type { Project } from "@/lib/types/project";
import type { ProjectAssignment } from "@/lib/types/project-assignment";
import type { Client } from "@/lib/types/client";
import {
  fetchProjectsForCompany,
  fetchClientsForCompany,
  deleteProject,
} from "@/lib/data/data";
import { fetchProjectAssignments } from "@/lib/data/project-assignments";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreVertical,
  Building2,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
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
import { AddProjectDialog } from "@/components/projects/add-project-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { toast } from "sonner";

const columns = [
  "Project",
  "Client",
  "Start Date",
  "Status",
  "Workers Assigned",
];

export default function ProjectsTable({ user }: { user: User }) {
  const { getLimit } = useFeatureFlags();
  

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<
    ProjectAssignment[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const rowsPerPage = 10;

  // Check if user has reached project limit
  const projectLimit = getLimit("projects_limit");
  const hasReachedLimit = projectLimit !== -1 && projects.length >= projectLimit;

  useEffect(() => {
    loadProjects();
    loadClients();
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

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditProjectDialogOpen(true);
  };

  const handleEditProjectSuccess = () => {
    loadProjects();
    setIsEditProjectDialogOpen(false);
    setEditingProject(null);
  };

  const handleEditProjectClose = () => {
    setIsEditProjectDialogOpen(false);
    setEditingProject(null);
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

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClient, statusFilter, searchTerm]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      not_started: {
        label: "Not Started",
        className: "bg-gray-500/20 text-gray-600 border-gray-500/30 hover:bg-gray-500/30 dark:bg-gray-400/20 dark:text-gray-400 dark:border-gray-400/30 dark:hover:bg-gray-400/30 px-3 py-1 text-xs font-medium rounded-2xl",
      },
      in_progress: {
        label: "In Progress",
        className: "bg-blue-500/20 text-blue-600 border-blue-500/30 hover:bg-blue-500/30 dark:bg-blue-400/20 dark:text-blue-400 dark:border-blue-400/30 dark:hover:bg-blue-400/30 px-3 py-1 text-xs font-medium rounded-2xl",
      },
      paused: {
        label: "Paused",
        className: "bg-orange-500/20 text-orange-600 border-orange-500/30 hover:bg-orange-500/30 dark:bg-orange-400/20 dark:text-orange-400 dark:border-orange-400/30 dark:hover:bg-orange-400/30 px-3 py-1 text-xs font-medium rounded-2xl",
      },
      completed: {
        label: "Completed",
        className: "bg-green-600/20 text-green-600 border-green-600/30 hover:bg-green-600/30 dark:bg-green-600/20 dark:text-green-600 dark:border-green-600/30 dark:hover:bg-green-600/30 px-3 py-1 text-xs font-medium rounded-2xl",
      },
      cancelled: {
        label: "Cancelled",
        className: "bg-red-500/20 text-red-600 border-red-500/30 hover:bg-red-500/30 dark:bg-red-400/20 dark:text-red-400 dark:border-red-400/30 dark:hover:bg-red-400/30 px-3 py-1 text-xs font-medium rounded-2xl",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleAddProjectSuccess = () => {
    loadProjects();
    setIsAddProjectDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className='space-y-4'>
          <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
          <p className="text-gray-500">
            Manage your construction projects and track progress.
          </p>
        </div>
        <Button 
          onClick={() => {
            if (hasReachedLimit) {
              toast.error(`You've reached your limit of ${projectLimit} projects. Upgrade your plan to add more.`);
            } else {
              setIsAddProjectDialogOpen(true);
            }
          }}
        >
          Add Project
        </Button>
      </div>

      {/* Add Project Dialog */}
      <AddProjectDialog
        open={isAddProjectDialogOpen}
        onOpenChange={setIsAddProjectDialogOpen}
        userId={user.id}
        clients={clients}
        onSuccess={handleAddProjectSuccess}
        currentProjectCount={projects.length}
      />

      {/* Edit Project Dialog */}
      {editingProject && (
        <EditProjectDialog
          open={isEditProjectDialogOpen}
          onOpenChange={handleEditProjectClose}
          userId={user.id}
          project={editingProject}
          clients={clients}
          onSuccess={handleEditProjectSuccess}
        />
      )}

      {/* Search Section */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchForm
            placeholder="Search projects..."
            className="w-full"
            value={searchTerm}
            onChange={e => setSearchTerm((e.target as HTMLInputElement).value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Client Filter */}
            <div className="p-2">
              <Label htmlFor="client-filter" className="text-sm font-medium mb-2 block">
                Filter by Client
              </Label>
              <SearchableCombobox
                items={clients}
                selectedItem={selectedClient}
                onSelect={setSelectedClient}
                placeholder="All clients"
                displayKey="name"
              />
            </div>
            
            <DropdownMenuSeparator />
            
            {/* Status Filter */}
            <div className="p-2">
              <Label htmlFor="status-filter" className="text-sm font-medium mb-2 block">
                Filter by Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
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
            
            {/* Clear Filters */}
            {(selectedClient || statusFilter !== "all") && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedClient(null);
                      setStatusFilter("all");
                    }}
                    className="w-full h-8"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Projects Table */}
      <Card className="border-border/50 bg-sidebar/95 backdrop-blur-xl">
          <CardContent className="p-0">
          {/* Column Headers */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_40px] gap-4 px-6 py-4 border-b border-border/50 bg-muted/30">
            {columns.map((col) => (
              <div
                key={col}
                className="text-sm font-semibold text-gray-500 uppercase tracking-wide"
              >
                {col}
              </div>
            ))}
            <div /> {/* Empty column for the menu */}
          </div>

          {/* Data Rows */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading projects...</span>
              </div>
            </div>
          ) : paginatedProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                <Building2 className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No projects found
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">
                {statusFilter !== "all" || selectedClient
                  ? "No projects match your current filters. Try adjusting your search criteria."
                  : "You haven't added any projects yet. Add your first project to start building your portfolio."}
              </p>
              <Button 
                onClick={() => {
                  if (hasReachedLimit) {
                    toast.error(`You've reached your limit of ${projectLimit} projects. Upgrade your plan to add more.`);
                  } else {
                    setIsAddProjectDialogOpen(true);
                  }
                }}
              >
                Add Your First Project
              </Button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/50">
                {paginatedProjects.map((project, i) => (
                  <div
                    key={project.id || i}
                    className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_min-content] gap-4 px-6 py-4 items-center group"
                  >
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="contents"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div>
                        <p className="font-semibold text-foreground">{project.name}</p>
                        <p className="text-sm text-gray-500">{project.location || "Location TBD"}</p>
                      </div>
                      <div className="text-gray-500">
                        {clients.find((c) => c.id === project.client_id)?.name || "Unknown Client"}
                      </div>
                      <div className="text-gray-500">
                        {project.start_date ? format(parseISO(project.start_date), "MMM d, yyyy") : "Not started"}
                      </div>
                      <div>{getStatusBadge(project.status)}</div>
                      <div className="text-gray-500">
                        {assignmentCounts.get(project.id) || 0}{(assignmentCounts.get(project.id) || 0) === 1 ? " worker" : " workers"}
                      </div>
                    </Link>
                    
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
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            onClick={() => handleEditProject(project)}
                          >
                            Edit Project
                          </DropdownMenuItem>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length} projects
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className={`h-8 w-8 p-0 ${
                            currentPage === page 
                              ? "bg-[#E8EDF5] text-primary border-[#E8EDF5] dark:bg-primary dark:text-primary-foreground dark:border-primary" 
                              : "hover:bg-[#E8EDF5]/70 dark:hover:bg-primary dark:hover:text-primary-foreground"
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
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
        <AlertDialogContent 
          className="sm:max-w-[425px] bg-white border-0" 
          style={{ 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            backgroundColor: 'white'
          }}
        >
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
      
      {/* Custom CSS to override AlertDialog overlay */}
      <style jsx>{`
        [data-slot="alert-dialog-overlay"] {
          background-color: rgba(75, 85, 99, 0.5) !important;
        }
      `}</style>
    </div>
  );
}
