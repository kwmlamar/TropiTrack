"use client"

import { useState, useEffect } from "react"
import { SearchForm } from "@/components/search-form"
import { Button } from "@/components/ui/button"
import { fetchClientsForCompany, deleteClient } from "@/lib/data/data"
import type { User } from "@supabase/supabase-js"
import type { Client } from "@/lib/types/client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { MoreVertical, UserX, ChevronLeft, ChevronRight } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ClientDialog } from "./add-client-dialog"

const columns = ["Name", "Email"]
const ITEMS_PER_PAGE = 10;

export default function ClientTable({ user }: { user: User }) {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  useEffect(() => {
    loadClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadClients = async () => {
    setIsLoading(true)
    try {
      const data = await fetchClientsForCompany(user.id)
      setClients(data)
    } catch (error) {
      console.log("Error fetching clients", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!selectedClient) return
    try {
      await deleteClient(selectedClient.id, { user })
    } catch (error) {
      console.log("Error deleting client:", error)
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedClient(null)
      loadClients()
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setClientDialogOpen(true)
  }

  const handleDialogClose = () => {
    setClientDialogOpen(false)
    setEditingClient(null)
  }

  const handleClientSuccess = () => {
    loadClients()
    handleDialogClose()
  }

  const filteredClients = clients.filter((client) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      client.name.toLowerCase().includes(term) ||
      (client.email && client.email.toLowerCase().includes(term)) ||
      (typeof client.company === "string" && client.company.toLowerCase().includes(term))
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className='space-y-4'>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-gray-500">
            Manage your construction clients and project relationships.
          </p>
        </div>
        <Button 
          onClick={() => setClientDialogOpen(true)}
          className="bg-transparent border-0 ring-2 ring-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:!text-white transition-colors"
        >
          Add Client
        </Button>
      </div>

      {/* Unified Client Dialog */}
      <ClientDialog
        userId={user.id}
        client={editingClient || undefined}
        onSuccess={handleClientSuccess}
        open={clientDialogOpen}
        onOpenChange={handleDialogClose}
      />

      {/* Search Section */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchForm
            placeholder="Search clients..."
            className="w-full"
            value={searchTerm}
            onChange={e => setSearchTerm((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      {/* Clients Table */}
      <Card className="border-border/50 bg-sidebar/95 backdrop-blur-xl">
        <CardContent className="p-0">
          {/* Column Headers */}
          <div className="grid grid-cols-[2fr_2fr_40px] gap-4 px-6 py-4 border-b border-border/50 bg-muted/30">
            {columns.map((col) => (
              <div key={col} className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {col}
              </div>
            ))}
            <div /> {/* Empty column for the menu */}
          </div>

          {/* Data Rows */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading clients...</span>
              </div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                <UserX className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No clients found</h3>
              <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">
                You haven&apos;t added any clients yet. Add your first client to start building your project portfolio.
              </p>
              <Button 
                onClick={() => setClientDialogOpen(true)}
              >
                Add Your First Client
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {paginatedClients.map((client, i) => (
                <div
                  key={client.id || i}
                  className="grid grid-cols-[2fr_2fr_min-content] gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-semibold text-foreground">{client.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {client.phone && (
                          <div className="flex items-center space-x-1">
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center space-x-1">
                            <span className="truncate max-w-32">{client.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">{client.email}</span>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          onSelect={(e) => {
                            e.preventDefault()
                            handleEditClient(client)
                          }}
                        >
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClient(client)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredClients.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredClients.length)} of {filteredClients.length} clients
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={`h-8 w-8 p-0 ${
                        currentPage === page 
                          ? "bg-[#E8EDF5] text-primary border-[#E8EDF5] dark:bg-primary dark:text-primary-foreground dark:border-primary" 
                          : "hover:bg-[#E8EDF5]/70 dark:hover:bg-primary dark:hover:text-primary-foreground"
                      }`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedClient(null)
          }
          setIsDeleteDialogOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{selectedClient?.name}</strong> and all associated project data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
