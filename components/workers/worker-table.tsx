"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchWorkersForCompany, deleteEmployee } from "@/lib/data/data";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  UserX,
  ChevronLeft,
  ChevronRight,
  UserCheck,
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
import Link from "next/link";

const columns = ["Name", "Pay Rate", "Status"];
const ITEMS_PER_PAGE = 20;

export default function WorkersTable({ user }: { user: User }) {
  const { theme } = useTheme();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editWorkerDialogOpen, setEditWorkerDialogOpen] = useState(false);
  const [selectedWorkerForEdit, setSelectedWorkerForEdit] = useState<Worker | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      console.log("Loading workers for user:", user.id, "includeInactive:", showInactive);
      const data = await fetchWorkersForCompany(user.id, { includeInactive: showInactive });
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

  const handleToggleWorkerStatus = async (worker: Worker, newStatus: boolean) => {
    try {
      const { updateWorker } = await import("@/lib/data/workers");
      const result = await updateWorker(user.id, worker.id, { 
        is_active: newStatus 
      });
      
      if (result.success) {
        console.log(`Worker ${worker.name} ${newStatus ? 'activated' : 'deactivated'}`);
        loadWorkers();
      } else {
        console.error("Failed to update worker status:", result.error);
      }
    } catch (error) {
      console.log("Failed to toggle worker status:", error);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(workers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedWorkers = workers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-2 pt-2 pb-0 h-[calc(100vh-4rem)] flex flex-col">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards flex-1 flex flex-col">
        {/* Header with Toggle */}
        <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative mb-0 px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label 
                htmlFor="show-inactive"
                className="text-sm font-medium cursor-pointer"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                Show Inactive Workers
              </Label>
            </div>
            {showInactive && (
              <div 
                className="text-xs"
                style={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}
              >
                Showing {workers.filter(w => !w.is_active).length} inactive workers
              </div>
            )}
          </div>
        </div>

        {/* Workers Table */}
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
                  {loading ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-12">
                        <div className="flex items-center justify-center">
                          <div 
                            className="flex items-center space-x-2"
                            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                          >
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Loading workers...</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : workers.length === 0 ? (
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
                            No workers found
                          </h3>
                          <p 
                            className="text-sm text-center max-w-sm"
                            style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                          >
                            You haven&apos;t added any workers yet. Click the &apos;New Worker&apos; button in the header to get started.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedWorkers.map((worker, i) => (
                      <tr 
                        key={worker.id || i} 
                        className="border-b last:border-b-0 transition-all duration-200 group"
                        style={{
                          borderColor: theme === 'dark' ? '#262626' : 'rgb(229 231 235 / 0.2)',
                          backgroundColor: 'transparent',
                          opacity: worker.is_active ? 1 : 0.6
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(243 244 246 / 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <td className="py-3 px-4 pl-8">
                          <Link href={`/dashboard/workers/${worker.id}`}>
                            <p 
                              className="font-semibold"
                              style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
                            >{worker.name}</p>
                            <p 
                              className="text-sm"
                              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                            >{worker.position || "Construction Worker"}</p>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <div 
                            className="font-medium"
                            style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                          >
                            <span className="text-lg">${worker.hourly_rate}</span>
                            <span className="text-sm">/hr</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                worker.is_active
                                  ? "bg-green-600/20 text-green-600 border-green-600/30 hover:bg-green-600/30 dark:bg-green-600/20 dark:text-green-600 dark:border-green-600/30 dark:hover:bg-green-600/30 px-3 py-1 text-xs font-medium rounded-2xl"
                                  : "bg-blue-500/20 text-blue-600 border-blue-500/30 hover:bg-blue-500/30 dark:bg-blue-400/20 dark:text-blue-400 dark:border-blue-400/30 dark:hover:bg-blue-400/30 px-3 py-1 text-xs font-medium rounded-2xl"
                              }
                            >
                              {worker.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {worker.nib_exempt && (
                              <Badge
                                variant="outline"
                                className="bg-orange-500/10 text-orange-600 border-orange-500/30 dark:bg-orange-400/10 dark:text-orange-400 dark:border-orange-400/30 px-2 py-0.5 text-xs font-medium rounded-2xl"
                                title="This worker is exempt from NIB deductions"
                              >
                                NIB Exempt
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 pr-6">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setSelectedWorkerForEdit(worker);
                                    setEditWorkerDialogOpen(true);
                                  }}
                                >
                                  Edit Worker
                                </DropdownMenuItem>
                                {worker.is_active ? (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleWorkerStatus(worker, false)}
                                    className="cursor-pointer text-amber-600 focus:text-amber-600"
                                  >
                                    Deactivate Worker
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleWorkerStatus(worker, true)}
                                    className="cursor-pointer text-green-600 focus:text-green-600"
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Reactivate Worker
                                  </DropdownMenuItem>
                                )}
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && paginatedWorkers.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4">
                <div 
                  className="text-sm"
                  style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                >
                  Showing {startIndex + 1} to {Math.min(endIndex, workers.length)} of {workers.length} workers
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
        <AlertDialogContent 
          className="sm:max-w-[425px]"
        >
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
