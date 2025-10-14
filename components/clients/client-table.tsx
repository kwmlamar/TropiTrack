"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { fetchClientsForCompany, deleteClient } from "@/lib/data/data"
import type { User } from "@supabase/supabase-js"
import type { Client } from "@/lib/types/client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import Link from "next/link"

const columns = ["Name", "Email"]
const ITEMS_PER_PAGE = 20;

export default function ClientTable({ user }: { user: User }) {
  const { theme } = useTheme()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

  // Pagination logic
  const totalPages = Math.ceil(clients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedClients = clients.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-2 pt-2 pb-0 h-[calc(100vh-4rem)] flex flex-col">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards flex-1 flex flex-col">
        {/* Clients Table */}
        <div 
          className="border-t border-b flex-1 flex flex-col"
          style={{
            backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
            borderColor: theme === 'dark' ? '#262626' : 'rgb(226 232 240 / 0.5)'
          }}
        >
          <div className="px-0 flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1 overflow-y-auto">
              <table className="w-full border-collapse border-spacing-0">
                <thead 
                  className="sticky top-0 z-50 shadow-sm"
                  style={{
                    backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                    borderBottom: theme === 'dark' ? '2px solid #262626' : '2px solid rgb(226 232 240 / 0.5)'
                  }}
                >
                  <tr style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}>
                    {columns.map((col, idx) => (
                      <th 
                        key={col} 
                        className={`text-left p-4 pb-4 font-medium text-sm text-gray-500 ${idx === 0 ? 'pl-8' : ''}`}
                        style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                      >
                        {col}
                      </th>
                    ))}
                    <th className="w-12" style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-12">
                        <div className="flex items-center justify-center">
                          <div 
                            className="flex items-center space-x-2"
                            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                          >
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Loading clients...</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : clients.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-12">
                        <div className="flex flex-col items-center justify-center">
                          <div 
                            className="flex items-center justify-center w-16 h-16 rounded-full mb-4"
                            style={{ backgroundColor: theme === 'dark' ? '#262626' : 'rgb(243 244 246 / 0.5)' }}
                          >
                            <UserX 
                              className="h-8 w-8"
                              style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                            />
                          </div>
                          <h3 
                            className="text-lg font-semibold mb-2"
                            style={{ color: theme === 'dark' ? '#9ca3af' : '#111827' }}
                          >
                            No clients found
                          </h3>
                          <p 
                            className="text-sm text-center max-w-sm"
                            style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                          >
                            You haven&apos;t added any clients yet. Click the &apos;New Client&apos; button in the header to get started.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedClients.map((client, i) => (
                      <tr 
                        key={client.id || i} 
                        className="border-b last:border-b-0 transition-all duration-200 group"
                        style={{
                          borderColor: theme === 'dark' ? '#262626' : 'rgb(229 231 235 / 0.2)',
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(243 244 246 / 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <td className="py-3 px-4 pl-8">
                          <Link href={`/dashboard/clients/${client.id}`}>
                            <p 
                              className="font-semibold"
                              style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                            >{client.name}</p>
                            <p 
                              className="text-sm"
                              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                            >{client.phone || client.email || "No contact info"}</p>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <div style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                            {client.email}
                          </div>
                        </td>
                        <td className="py-3 px-4 pr-6">
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && paginatedClients.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4">
                <div 
                  className="text-sm"
                  style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                >
                  Showing {startIndex + 1} to {Math.min(endIndex, clients.length)} of {clients.length} clients
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
                            ? "bg-muted text-gray-800 border-muted dark:bg-gray-500 dark:text-gray-100 dark:border-gray-500" 
                            : "hover:bg-muted dark:hover:bg-gray-600 dark:hover:text-gray-100"
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
          </div>
        </div>
      </div>

      {/* Unified Client Dialog */}
      <ClientDialog
        userId={user.id}
        client={editingClient || undefined}
        onSuccess={handleClientSuccess}
        open={clientDialogOpen}
        onOpenChange={handleDialogClose}
      />

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
        <AlertDialogContent 
          className="sm:max-w-[425px]"
        >
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
