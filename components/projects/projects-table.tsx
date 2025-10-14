"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import type { User } from "@supabase/supabase-js";
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
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import Link from "next/link";
import { Label } from "@/components/ui/label";

const columns = [
  "Project",
  "Client",
  "Start Date",
  "Status",
  "Workers Assigned",
];

export default function ProjectsTable({ user }: { user: User }) {
  const { theme } = useTheme();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const rowsPerPage = 10;

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
      return matchesClient && matchesStatus;
    });
  }, [projects, selectedClient, statusFilter]);

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
  }, [selectedClient, statusFilter]);

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

  return (
    <div className="space-y-2 pt-2 pb-0 h-[calc(100vh-4rem)] flex flex-col">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards flex-1 flex flex-col">
        {/* Header with Filters */}
        <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative mb-0 px-6">
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-10"
                  style={{
                    backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
                    borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
                    color: theme === 'dark' ? '#d1d5db' : '#374151'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : '#ffffff'
                  }}
                >
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
        </div>

        {/* Projects Table */}
        <div 
          className="border-t border-b flex-1 flex flex-col"
          style={{
            backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
            borderColor: theme === 'dark' ? '#262626' : 'rgb(226 232 240 / 0.5)'
          }}
        >
          <div className="px-0 flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1 overflow-y-auto">
              <table className="w-full border-collapse border-spacing-0">
                <thead 
                  className="sticky top-0 z-50 shadow-sm"
                  style={{
                    backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                    borderBottom: theme === 'dark' ? '2px solid #262626' : '2px solid rgb(226 232 240 / 0.5)'
                  }}
                >
                  <tr style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}>
                    {columns.map((col, idx) => (
                      <th 
                        key={col} 
                        className={`text-left p-4 pb-4 font-medium text-sm text-gray-500 ${idx === 0 ? 'pl-8' : ''}`}
                        style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                      >
                        {col}
                      </th>
                    ))}
                    <th className="w-12" style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-12">
                        <div className="flex items-center justify-center">
                          <div 
                            className="flex items-center space-x-2"
                            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                          >
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Loading projects...</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-12">
                        <div className="flex flex-col items-center justify-center">
                          <div 
                            className="flex items-center justify-center w-16 h-16 rounded-full mb-4"
                            style={{ backgroundColor: theme === 'dark' ? '#262626' : 'rgb(243 244 246 / 0.5)' }}
                          >
                            <Building2 
                              className="h-8 w-8"
                              style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                            />
                          </div>
                          <h3 
                            className="text-lg font-semibold mb-2"
                            style={{ color: theme === 'dark' ? '#9ca3af' : '#111827' }}
                          >
                            No projects found
                          </h3>
                          <p 
                            className="text-sm text-center max-w-sm"
                            style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                          >
                            {statusFilter !== "all" || selectedClient
                              ? "No projects match your current filters. Try adjusting your search criteria."
                              : "You haven't added any projects yet. Click the 'New Project' button in the header to get started."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedProjects.map((project, i) => (
                      <tr 
                        key={project.id || i} 
                        className="border-b last:border-b-0 transition-all duration-200 group"
                        style={{
                          borderColor: theme === 'dark' ? '#262626' : 'rgb(229 231 235 / 0.2)',
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(243 244 246 / 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <td className="py-3 px-4 pl-8">
                          <Link href={`/dashboard/projects/${project.id}`}>
                            <p 
                              className="font-semibold"
                              style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                            >{project.name}</p>
                            <p 
                              className="text-sm"
                              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                            >{project.location || "Location TBD"}</p>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <div style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                            {clients.find((c) => c.id === project.client_id)?.name || "Unknown Client"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                            {project.start_date ? format(parseISO(project.start_date), "MMM d, yyyy") : "Not started"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(project.status)}
                        </td>
                        <td className="py-3 px-4">
                          <div style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                            {assignmentCounts.get(project.id) || 0}{(assignmentCounts.get(project.id) || 0) === 1 ? " worker" : " workers"}
                          </div>
                        </td>
                        <td className="py-3 px-4 pr-6">
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && paginatedProjects.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4">
                <div 
                  className="text-sm"
                  style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                >
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
                            ? "bg-muted text-gray-800 border-muted dark:bg-gray-500 dark:text-gray-100 dark:border-gray-500" 
                            : "hover:bg-muted dark:hover:bg-gray-600 dark:hover:text-gray-100"
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
          </div>
        </div>
      </div>

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
          className="sm:max-w-[425px]"
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
    </div>
  );
}
