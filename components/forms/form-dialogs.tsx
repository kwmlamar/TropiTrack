"use client";

import type React from "react";

import { useState } from "react";
import { Plus, Edit, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { TimesheetForm } from "./timesheet-form";
import { BulkTimesheetForm } from "./bulk-timesheet-form";
import { WorkerForm } from "./worker-form";
import { ProjectForm } from "./project-form";
import { ClientForm } from "./client-form";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import type { Worker } from "@/lib/types/worker"
import type { Client } from "@/lib/types/client"

import type {
  TimesheetWithDetails,
  Project,
} from "@/lib/types";

// Timesheet Dialog
interface TimesheetDialogProps {
  timesheet?: TimesheetWithDetails;
  workers: Worker[];
  projects: Project[];
  onSuccess?: (timesheet: any) => void;
  trigger?: React.ReactNode;
}

export function TimesheetDialog({
  timesheet,
  workers,
  projects,
  onSuccess,
  trigger,
}: TimesheetDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (data: any) => {
    setOpen(false);
    onSuccess?.(data);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            {timesheet ? (
              <Edit className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {timesheet ? "Edit Timesheet" : "Add Timesheet"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <TimesheetForm
          timesheet={timesheet}
          workers={workers}
          projects={projects}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}

// Bulk Timesheet Dialog
interface BulkTimesheetDialogProps {
  workers: Worker[];
  projects: Project[];
  onSuccess?: (timesheets: any[]) => void;
  trigger?: React.ReactNode;
}

export function BulkTimesheetDialog({
  workers,
  projects,
  onSuccess,
  trigger,
}: BulkTimesheetDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (data: any[]) => {
    setOpen(false);
    onSuccess?.(data);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Bulk Timesheet Entry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <BulkTimesheetForm
          workers={workers}
          projects={projects}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}

// Worker Sheet (using Sheet for better mobile experience)
interface WorkerSheetProps {
  worker?: Worker;
  userId: string;
  onSuccess?: (worker: Worker) => void;
  trigger?: React.ReactNode;
}

export function WorkerSheet({ worker, userId, onSuccess, trigger }: WorkerSheetProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (data: Worker) => {
    setOpen(false);
    onSuccess?.(data);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            {worker ? (
              <Edit className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {worker ? "Edit Worker" : "Add Worker"}
          </Button>
        )}
      </SheetTrigger>
      <VisuallyHidden>
          <SheetTitle>{worker ? "Edit Worker" : "Add Worker"}</SheetTitle>
        </VisuallyHidden>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <WorkerForm
          worker={worker}
          userId={userId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </SheetContent>
    </Sheet>
  );
}

// Project Dialog
interface ProjectDialogProps {
  project?: Project & { assigned_worker_ids?: (string | number)[] };
  clients: Client[];
  workers: Worker[];
  onSuccess?: (project: Project) => void;
  trigger?: React.ReactNode;
}

export function ProjectDialog({
  project,
  clients,
  workers,
  onSuccess,
  trigger,
}: ProjectDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (data: Project) => {
    setOpen(false);
    onSuccess?.(data);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            {project ? (
              <Edit className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {project ? "Edit Project" : "New Project"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>
              {project ? "Edit Project" : "New Project"}
            </DialogTitle>
          </VisuallyHidden>
        </DialogHeader>

        <ProjectForm
          project={project}
          clients={clients}
          workers={workers}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
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

  const handleSuccess = (data: Client) => {
    setOpen(false);
    onSuccess?.(data);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            {client ? (
              <Edit className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {client ? "Edit Client" : "Add Client"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>
              {client ? "Edit Project" : "New Project"}
            </DialogTitle>
          </VisuallyHidden>
        </DialogHeader>
        <ClientForm
          client={client}
          userId={userId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
