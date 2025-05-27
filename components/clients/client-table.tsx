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
import { ClientForm } from "@/components/clients/client-form";
import {
  fetchClientsForCompany,
  generateClient,
  deleteClient,
  updateClient,
} from "@/lib/data/data";
import { User } from "@supabase/supabase-js"

import { Client } from "@/lib/types";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, Plus, UserCheck, UserX } from "lucide-react";
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

const columns = ["Name", "Email"];

export default function ClientTable({ user }: {user: User} ) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {

    loadClients();
  }, [user]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await fetchClientsForCompany({user});
      setClients(data);
    } catch (error) {
      console.log("Error fetching clients", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (client: Client) => {
    try {
      const data = await generateClient(client, {user} );
      setClients((prev) => [...prev, data]);
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
      const updatedClient = await updateClient(client, {user});
      if (!updatedClient) throw new Error("No client returned from update.");

      setClients(clients.map((c) => (c.id === client.id ? updatedClient : c)));
    } catch (error) {
      console.log("Error updating client:", error);
    } finally {
      setSelectedClient(null);
      setIsFormOpen(false);
      loadClients();
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    try {
      await deleteClient(selectedClient.id, {user});
    } catch (error) {
      console.log("Error deleting client:", error);
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
              onSubmit={
                selectedClient ? handleUpdateClient : handleCreateClient
              }
              onCancel={() => {
                setSelectedClient(null);
                setIsFormOpen(false);
              }}
            />
            <div className="flex flex-col gap-4"></div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clients Table*/}
      <div className="mt-4">
        <div className="w-full">
          {/* Column Headers */}
          <div className="grid grid-cols-[2fr_2fr_40px] gap-4 px-4 py-2 items-center text-sm font-semibold text-gray-600">
            {columns.map((col) => (
              <div key={col} className="p-0">{col}</div>
            ))}
            <div className="p-0"/> {/* Empty column for the meatball */}
          </div>

          {/* Data Cards as Rows */}
          {isLoading ? (
            <div className="text-center text-sm text-gray-500 py-4">
              Loading employees...
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {clients.map((client, i) => (
                <Card
                  key={i}
                  className="grid grid-cols-[2fr_2fr_40px] gap-4 px-4 py-2 items-center"
                >
                  <CardContent className="p-0 font-semibold">{client.name}</CardContent>
                  <CardContent className="p-0">{client.email}</CardContent>
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
                            setSelectedClient(client);
                            setIsFormOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setSelectedClient(client);
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
                    setSelectedClient(null);
                  }
                  setIsDeleteDialogOpen(open);
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {selectedClient?.name}. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteClient}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {clients.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <UserX className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No clients found</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                You haven&apos;t added any clients yet. Add your first client to
                get started.
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Add Your First client
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
