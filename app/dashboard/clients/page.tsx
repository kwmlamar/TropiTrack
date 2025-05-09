"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { SearchForm } from "@/components/search-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { ClientForm } from "@/components/client-form";

import { Client } from "@/lib/types";

export default function ClientsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState<Client[]>([]);

  return (
    <DashboardLayout title="Clients">
      <h1 className="text-2xl font-bold">Add to your clients</h1>
      <div className="mt-4 flex w-full items-center justify-between">
        <SearchForm
          placeholder="Search clients..."
          className="w-1/3 max-w-md"
        />
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={console.log}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedClient ? "Edit Client" : "Add Client"}
              </DialogTitle>
              <DialogDescription>
                {selectedClient
                  ? "Update the client's information below"
                  : "Fill in the details to add a new client."}
              </DialogDescription>
            </DialogHeader>
            <ClientForm
            client={selectedClient}
            onSubmit={selectedClient ? console.log("update client") : console.log("add new client")}
            onCancel={() => {
                setSelectedClient(null)
                setIsFormOpen(false)
            }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
