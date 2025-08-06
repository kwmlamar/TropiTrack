"use client";

import { useState, useEffect } from "react";
import { SearchForm } from "@/components/search-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchWorkersForCompany, deleteEmployee } from "@/lib/data/data";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreVertical,
  UserX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Worker } from "@/lib/types/worker";
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
import { EditWorkerDialog } from "@/components/forms/worker-form";
import { useRouter } from "next/navigation";
import { AddWorkerDialog } from "./add-worker-dialog";

const columns = ["Name", "Pay Rate", "Status"];
const ITEMS_PER_PAGE = 20;

export default function WorkersTable({ user }: { user: User }) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [addWorkerDialogOpen, setAddWorkerDialogOpen] = useState(false);
  const [editWorkerDialogOpen, setEditWorkerDialogOpen] = useState(false);
  const [selectedWorkerForEdit, setSelectedWorkerForEdit] = useState<Worker | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      console.log("Loading workers for user:", user.id);
      const data = await fetchWorkersForCompany(user.id);
      console.log("Workers data:", data);
      setWorkers(data);
    } catch (error) {
      console.log("Failed to fetch Workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorker = async () => {
    if (!selectedWorker) return;
    try {
      await deleteEmployee(selectedWorker.id, { user });
    } catch (error) {
      console.log("Failed to delete employee:", error);
    } finally {
      setSelectedWorker(null);
      setIsDeleteDialogOpen(false);
      loadWorkers();
    }
  };

  const handleRowClick = (workerId: string) => {
    router.push(`/dashboard/workers/${workerId}`);
  };

  const filteredWorkers = workers.filter((worker) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      worker.name.toLowerCase().includes(term) ||
      (worker.email && worker.email.toLowerCase().includes(term)) ||
      (worker.position && worker.position.toLowerCase().includes(term))
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredWorkers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedWorkers = filteredWorkers.slice(startIndex, endIndex);

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
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-gray-500">
            Manage your construction team and track worker information.
          </p>
        </div>
        <Button 
          onClick={() => setAddWorkerDialogOpen(true)}
          data-onboarding="add-worker-button"
        >
          Add Worker
        </Button>
      </div>

      {/* Add Worker Dialog */}
      <AddWorkerDialog
        userId={user.id}
        onSuccess={loadWorkers}
        open={addWorkerDialogOpen}
        onOpenChange={setAddWorkerDialogOpen}
      />

      {/* Search Section */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchForm
            placeholder="Search workers..."
            className="w-full"
            value={searchTerm}
            onChange={e => setSearchTerm((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      {/* Workers Table */}
      <Card className="border-border/50 bg-sidebar/95 backdrop-blur-xl">
          <CardContent className="p-0">
          {/* Column Headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr_40px] gap-4 px-6 py-4 border-b border-border/50 bg-muted/30">
            {columns.map((col) => (
              <div
                key={col}
                className="text-sm font-semibold text-gray-500 uppercase tracking-wide"
              >
                {col}
              </div>
            ))}
            <div /> {/* Empty column for the menu */}
          </div>

          {/* Data Rows */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading workers...</span>
              </div>
            </div>
          ) : filteredWorkers.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                  <UserX className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No workers found
                </h3>
                <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">
                  You haven&apos;t added any workers yet. Add your first worker to
                  get started with team management.
                </p>
              <Button 
                onClick={() => setAddWorkerDialogOpen(true)}
              >
                Add Your First Worker
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {paginatedWorkers.map((worker, i) => (
                <div
                  key={worker.id || i}
                  className="grid grid-cols-[2fr_1fr_1fr_min-content] gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors group cursor-pointer"
                  onClick={() => handleRowClick(worker.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {worker.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {worker.position || "Construction Worker"}
                      </p>
                    </div>
                  </div>

                  <div className="font-medium text-gray-500">
                    <span className="text-lg">${worker.hourly_rate}</span>
                    <span className="text-sm text-gray-500">/hr</span>
                  </div>

                  <div>
                    <Badge
                      className={
                        worker.is_active
                          ? "bg-green-600/20 text-green-600 border-green-600/30 hover:bg-green-600/30 dark:bg-green-600/20 dark:text-green-600 dark:border-green-600/30 dark:hover:bg-green-600/30 px-3 py-1 text-xs font-medium rounded-2xl"
                          : "bg-blue-500/20 text-blue-600 border-blue-500/30 hover:bg-blue-500/30 dark:bg-blue-400/20 dark:text-blue-400 dark:border-blue-400/30 dark:hover:bg-blue-400/30 px-3 py-1 text-xs font-medium rounded-2xl"
                      }
                    >
                      {worker.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setSelectedWorkerForEdit(worker);
                            setEditWorkerDialogOpen(true);
                          }}
                        >
                          Edit Worker
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWorker(worker);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          Delete Worker
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredWorkers.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredWorkers.length)} of {filteredWorkers.length} workers
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
            setSelectedWorker(null);
          }
          setIsDeleteDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{selectedWorker?.name}</strong> from your team. This
              action cannot be undone and will remove all associated timesheet
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorker}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete Worker
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Worker Dialog */}
      {selectedWorkerForEdit && (
        <EditWorkerDialog
          open={editWorkerDialogOpen}
          onOpenChange={setEditWorkerDialogOpen}
          userId={user.id}
          worker={selectedWorkerForEdit}
          onSuccess={() => {
            loadWorkers();
            setSelectedWorkerForEdit(null);
          }}
          onCancel={() => {
            setSelectedWorkerForEdit(null);
          }}
        />
      )}
    </div>
  );
}
