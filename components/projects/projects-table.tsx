"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { User } from "@supabase/supabase-js";
import { SearchForm } from "../search-form";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import { SearchableCombobox } from "../searchable-combobox";
import { Button } from "../ui/button";
import { Client, Project, Worker, ProjectAssignment } from "@/lib/types";
import {
  fetchProjectsForCompany,
  fetchClientsForCompany,
  generateProject,
  fetchWorkersForCompany,
  fetchProjectAssignments,
  updateProject,
  deleteProject,
} from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, Plus, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { ProjectForm } from "@/components/projects/projects-form";
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadProjects();
    loadClients();
    loadWorkers();
    loadProjectAssignments();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await fetchProjectsForCompany({ user });
      setProjects(data);
    } catch (error) {
      console.log("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await fetchClientsForCompany({ user });
      setClients(data);
    } catch (error) {
      console.log("Failed to load clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await fetchWorkersForCompany({ user });
      setWorkers(data);
    } catch (error) {
      console.log("Failed to load workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectAssignments = async () => {
    setLoading(true);
    try {
      const data = await fetchProjectAssignments({ user });
      setProjectAssignments(data);
    } catch (error) {
      console.log("Failed to load project assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (
    project: Omit<Project, "id"> & { assigned_worker_ids: (string | number)[] }
  ) => {
    setLoading(true);
    try {
      const data = await generateProject(project, { user });
      setProjects((prev) => [...prev, data]);
    } catch (error) {
      console.log("Failed to create project:", error);
    } finally {
      setIsFormOpen(false);
      loadProjects();
      loadProjectAssignments();
    }
  };

  const handleUpdateProject = async (
    project: Project & { assigned_worker_ids: (string | number)[] }
  ) => {
    try {
      const { project: updatedProject, assignments } = await updateProject(project, { user });
  
      // Merge assigned_worker_ids into updatedProject if your state relies on it
      const fullUpdatedProject = {
        ...updatedProject,
        assigned_worker_ids: project.assigned_worker_ids,
      };
  
      setProjects((prev) =>
        prev.map((p) => (p.id === fullUpdatedProject.id ? fullUpdatedProject : p))
      );
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      setLoading(false);
      loadProjects(); // Optional depending on how stale your state might be
      loadProjectAssignments();
    }
  };
  

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    try {
        await deleteProject(selectedProject.id, {user});
        console.log(`Project "${selectedProject.name}" deleted successfully.`)
    } catch (error) {
        console.log("Failed to delete project:", error instanceof Error ? error.message : error);
    } finally {
        setSelectedProject(null);
        setIsDeleteDialogOpen(false);
        loadProjects();
    }
  }

  const assignmentCounts = useMemo(() => {
    const map = new Map<string, number>();
    projectAssignments.forEach((pa) => {
      map.set(pa.project_id, (map.get(pa.project_id) || 0) + 1);
    });
    return map;
  }, [projectAssignments]);

  const filteredProjects = selectedClient
    ? projects.filter((project) => project.client_id === selectedClient.id)
    : projects;

  return (
    <DashboardLayout title="Projects">
      <h1 className="text-2xl font-bold">Add to your Projects</h1>
      {/* Your page-specific content goes here */}
      <div className="mt-4 flex w-full flex-wrap gap-4 ">
        {/* Select Status */}
        <div className="flex flex-1 min-w-[300px] items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Select Clients */}
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
              onClick={() => setSelectedClient(null)}
              className="ml-2"
            >
              Clear Filter
            </Button>
          )}
        </div>

        <div className="flex flex-1 min-w-[300px] items-center gap-4">
          <SearchForm
            placeholder="Search projects..."
            className="w-full max-w-lg"
          />
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedProject ? "Edit Project" : "Add New Project"}
                </DialogTitle>
                <DialogDescription>
                  {selectedProject
                    ? "Update the project's information below."
                    : "Fill in the details to add a new project."}
                </DialogDescription>
              </DialogHeader>
              <ProjectForm
                project={selectedProject}
                clients={clients}
                workers={workers}
                onSubmit={(project) => {
                  if (selectedProject) {
                    handleUpdateProject(project);
                  } else {
                    handleCreateProject(project);
                  }
                }}
                onCancel={() => {
                  setSelectedProject(null);
                  setIsFormOpen(false);
                }}
              />
              <div className="flex flex-col gap-4"></div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Projects Table*/}
      <div className="mt-4">
        <div className="w-full px-4">
          {/* Column Headers */}
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_20px] gap-4 text-sm font-semibold text-gray-600 mb-2 px-2">
              {columns.map((col) => (
                <div key={col}>{col}</div>
              ))}
              <div /> {/* Empty column for the meatball */}
            </div>
          </div>

          {/* Data Cards as Rows */}
          {loading ? (
            <div className="text-center text-sm text-gray-500 py-4">
              Loading projects...
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredProjects.map((project, i) => (
                <Card
                  key={i}
                  className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_20px] gap-4 p-4 items-center"
                >
                  <CardContent className="p-0">{project.name}</CardContent>
                  <CardContent className="p-0">
                    {clients.find((c) => c.id === project.client_id)?.name ||
                      "Unknown Client"}
                  </CardContent>
                  <CardContent>
                    {format(parseISO(project.start_date), "MMMM do, yyyy")}
                  </CardContent>
                  <CardContent>
                    <Badge variant="outline">{project.status}</Badge>
                  </CardContent>
                  <CardContent>
                    {assignmentCounts.get(project.id) || 0}
                  </CardContent>
                  <CardContent className="p-0 justify-self-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProject(project);
                            setIsFormOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setSelectedProject(project);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
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
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {selectedProject?.name}.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProject}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          {filteredProjects.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Projects found</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                You haven&apos;t added any projects yet. Add your first project
                to get started.
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Building2 className="mr-2 h-4 w-4" />
                Add Your First Project
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
