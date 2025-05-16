"use client";

import { useState, useEffect } from "react";
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
import { Client, Project } from "@/lib/types";
import { fetchProjectsForCompany } from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, Plus, UserCheck, UserX } from "lucide-react";
import { Worker } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadProjects();
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

  return (
    <DashboardLayout title="Projects">
      <h1 className="text-2xl font-bold">Add to your Projects</h1>
      {/* Your page-specific content goes here */}
      <div className="mt-4 flex w-full items-center justify-between ">
        {/* Select Status */}
        <div className="flex items-center gap-4">
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
        </div>

        <div className="flex items-center gap-4">
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
                onSubmit={(project) => {
                  if (selectedProject) {
                    console.log("handleUpdateProject", project);
                  } else {
                    console.log("handleCreateProject", project);
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
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_20px] gap-4 text-sm font-semibold text-gray-600 mb-2 px-2">
            {columns.map((col) => (
              <div key={col}>{col}</div>
            ))}
            <div /> {/* Empty column for the meatball */}
          </div>

          {/* Data Cards as Rows */}
          </div>
        </div>
    </DashboardLayout>
  );
}
