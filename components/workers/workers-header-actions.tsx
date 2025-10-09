"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddWorkerDialog } from "./add-worker-dialog";

interface WorkersHeaderActionsProps {
  userId: string;
}

export function WorkersHeaderActions({ userId }: WorkersHeaderActionsProps) {
  const [addWorkerDialogOpen, setAddWorkerDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setAddWorkerDialogOpen(true)}
        size="sm"
        data-onboarding="add-worker-button"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Worker
      </Button>

      <AddWorkerDialog
        userId={userId}
        onSuccess={() => setAddWorkerDialogOpen(false)}
        open={addWorkerDialogOpen}
        onOpenChange={setAddWorkerDialogOpen}
      />
    </>
  );
}

