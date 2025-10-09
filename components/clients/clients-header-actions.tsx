"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClientDialog } from "./add-client-dialog";

interface ClientsHeaderActionsProps {
  userId: string;
}

export function ClientsHeaderActions({ userId }: ClientsHeaderActionsProps) {
  const [clientDialogOpen, setClientDialogOpen] = useState(false);

  const handleDialogClose = () => {
    setClientDialogOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setClientDialogOpen(true)}
        size="sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Client
      </Button>

      <ClientDialog
        userId={userId}
        onSuccess={handleDialogClose}
        open={clientDialogOpen}
        onOpenChange={handleDialogClose}
      />
    </>
  );
}

