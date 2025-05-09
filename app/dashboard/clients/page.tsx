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
import { fetchClients, createClient, deleteClient, updateClient } from "@/lib/data";

import { Client } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

export default function ClientsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
        const data = await fetchClients();
        setClients(data)
    } catch (error) {
        console.log("Error fetching clients", error)
    } finally {
        setIsLoading(false);
    }
  };

  const handleCreateClient = async (client: Client) => {
    try {
        const data = await createClient(client);
        setClients((prev) => [...prev, data])
    } catch (error) {
        console.log("Error creating client:", error);
    } finally {
        setIsFormOpen(false);
    loadClients();
    }  
  };

  const handleUpdateClient = async (client: Client) => {
    if (!selectedClient) return;
    try {
        const updatedClient = await updateClient(client)
        if (!updatedClient) throw new Error("No client returned from update.")

        setClients(clients.map((c) => c.id === client.id ? updatedClient : c))
    } catch (error) {
        console.log("Error updating client:", error)
    } finally {
        setSelectedClient(null);
        setIsFormOpen(false);
        loadClients();
    }
  }

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    try {
        await deleteClient(selectedClient.id)
    } catch (error) {
        console.log("Error deleting client:", error)
    } finally {
        setIsDeleteDialogOpen(false);
        setSelectedClient(null);
        loadClients();
    }
  };

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
            onSubmit={selectedClient ? handleUpdateClient : handleCreateClient}
            onCancel={() => {
                setSelectedClient(null)
                setIsFormOpen(false)
            }}
            />
            <div className="flex flex-col gap-4"></div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
