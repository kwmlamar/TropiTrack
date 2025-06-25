"use client";

import type React from "react";

import { useState } from "react";
import { Plus, Edit, Users, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { TimesheetForm } from "./timesheet-form";
import { BulkTimesheetForm } from "./bulk-timesheet-form";
import { ProjectForm } from "./project-form";
import { ClientForm } from "./client-form";
import type { Worker } from "@/lib/types/worker";
import type { Client } from "@/lib/types/client";

import type { TimesheetWithDetails } from "@/lib/types";
import type { Project } from "@/lib/types/project";

// Timesheet Dialog
interface TimesheetDialogProps {
  userId: string;
  timesheet?: TimesheetWithDetails;
  workers: Worker[];
  projects: Project[];
  onSuccess?: (timesheet: TimesheetWithDetails) => void;
  trigger?: React.ReactNode;
}

export function TimesheetDialog({
  userId,
  timesheet,
  workers,
  projects,
  onSuccess,
  trigger,
}: TimesheetDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSuccess = async (data: any) => {
    setIsLoading(true);
    try {
      await onSuccess?.(data);
      setOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="transition-all duration-200 hover:scale-105">
            {timesheet ? (
              <Edit className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {timesheet ? "Edit Timesheet" : "Add Timesheet"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-border/50 bg-card/50 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {timesheet ? "Edit Timesheet" : "Create Timesheet"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {timesheet
              ? "Update timesheet entry details"
              : "Create a new timesheet entry"}
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <TimesheetForm
            userId={userId}
            timesheet={timesheet}
            workers={workers}
            projects={projects}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Bulk Timesheet Dialog
interface BulkTimesheetDialogProps {
  userId: string;
  workers: Worker[];
  projects: Project[];
  onSuccess?: (timesheets: TimesheetWithDetails[]) => void;
  trigger?: React.ReactNode;
}

export function BulkTimesheetDialog({
  userId,
  workers,
  projects,
  onSuccess,
  trigger,
}: BulkTimesheetDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSuccess = async (data: any[]) => {
    setIsLoading(true);
    try {
      await onSuccess?.(data);
      setOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="transition-all duration-200 hover:scale-105">
            <Users className="h-4 w-4 mr-2" />
            Bulk Timesheet Entry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border-border/50 bg-card/50 backdrop-blur-sm">
        <DialogHeader className="sr-only">
          <DialogTitle className="text-xl font-semibold">Bulk Timesheet Entry</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create multiple timesheet entries for the same project and date
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <BulkTimesheetForm
            userId={userId}
            workers={workers}
            projects={projects}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Project Dialog
interface ProjectDialogProps {
  userId: string;
  project?: Project & { assigned_worker_ids?: (string | number)[] };
  clients: Client[];
  workers: Worker[];
  onSuccess?: (project: Project) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProjectDialog({
  userId,
  project,
  clients,
  workers,
  onSuccess,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;

  const handleSuccess = async (data: Project) => {
    setIsLoading(true);
    try {
      await onSuccess?.(data);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto border-border/50 bg-card/50 backdrop-blur-sm">
        <DialogHeader className="">
          <DialogTitle className="text-xl font-semibold">
            {project ? "Edit Project" : "New Project"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {project
              ? "Update the project details and assigned workers."
              : "Create a new project and assign team members."}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <ProjectForm
            userId={userId}
            project={project}
            clients={clients}
            workers={workers}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Client Dialog
interface ClientDialogProps {
  client?: Client;
  userId: string;
  onSuccess?: (client: Client) => void;
  trigger?: React.ReactNode;
}

export function ClientDialog({
  client,
  userId,
  onSuccess,
  trigger,
}: ClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (data: Client) => {
    setIsLoading(true);
    try {
      await onSuccess?.(data);
      setOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="transition-all duration-200 hover:scale-105">
            {client ? (
              <Edit className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {client ? "Edit Client" : "Add Client"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto border-border/50 bg-card/50 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {client ? "Edit Client" : "New Client"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {client
              ? "Update client information"
              : "Add a new client to your company"}
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <ClientForm
            client={client}
            userId={userId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
