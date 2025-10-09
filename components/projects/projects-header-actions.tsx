"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddProjectDialog } from "@/components/projects/add-project-dialog";
import { fetchClientsForCompany, fetchProjectsForCompany } from "@/lib/data/data";
import type { Client } from "@/lib/types/client";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { toast } from "sonner";

interface ProjectsHeaderActionsProps {
  userId: string;
}

export function ProjectsHeaderActions({ userId }: ProjectsHeaderActionsProps) {
  const { getLimit } = useFeatureFlags();
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    loadClients();
    loadProjectCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClients = async () => {
    try {
      const data = await fetchClientsForCompany(userId);
      setClients(data);
    } catch (error) {
      console.log("Failed to load clients:", error);
    }
  };

  const loadProjectCount = async () => {
    try {
      const data = await fetchProjectsForCompany(userId);
      setProjectCount(data.length);
    } catch (error) {
      console.log("Failed to load project count:", error);
    }
  };

  const projectLimit = getLimit("projects_limit");
  const hasReachedLimit = projectLimit !== -1 && projectCount >= projectLimit;

  const handleAddProjectSuccess = () => {
    setIsAddProjectDialogOpen(false);
    loadProjectCount();
  };

  return (
    <>
      <Button
        onClick={() => {
          if (hasReachedLimit) {
            toast.error(`You've reached your limit of ${projectLimit} projects. Upgrade your plan to add more.`);
          } else {
            setIsAddProjectDialogOpen(true);
          }
        }}
        size="sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Project
      </Button>

      <AddProjectDialog
        open={isAddProjectDialogOpen}
        onOpenChange={setIsAddProjectDialogOpen}
        userId={userId}
        clients={clients}
        onSuccess={handleAddProjectSuccess}
        currentProjectCount={projectCount}
      />
    </>
  );
}

