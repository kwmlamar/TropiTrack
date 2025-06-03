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
  Plus,
  UserCheck,
  UserX,
  Users,
  DollarSign,
  Activity,
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
import { WorkerSheet } from "@/components/forms/form-dialogs";

const columns = ["Name", "Pay Rate", "Status"];

export default function WorkersTable({ user }: { user: User }) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    loadWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await fetchWorkersForCompany(user.id);
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

  // Calculate statistics
  const activeWorkers = workers.filter((w) => w.is_active).length;
  const totalWorkers = workers.length;
  const averageRate =
    workers.length > 0
      ? workers.reduce((sum, w) => sum + w.hourly_rate, 0) / workers.length
      : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Team Management
        </h1>
        <p className="text-muted-foreground">
          Manage your construction team and track worker information
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Workers
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalWorkers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Workers
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {activeWorkers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg. Hourly Rate
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ${averageRate.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SearchForm
          placeholder="Search workers..."
          className="w-full sm:w-80"
        />
        <WorkerSheet
          userId={user.id}
          onSuccess={loadWorkers}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          trigger={
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Worker
            </Button>
          }
        />
      </div>

      {/* Workers Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          {/* Column Headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr_40px] gap-4 px-6 py-4 border-b border-border/50 bg-muted/30">
            {columns.map((col) => (
              <div
                key={col}
                className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
              >
                {col}
              </div>
            ))}
            <div /> {/* Empty column for the menu */}
          </div>

          {/* Data Rows */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading workers...</span>
              </div>
            </div>
          ) : workers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                <UserX className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No workers found
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                You haven&apos;t added any workers yet. Add your first worker to
                get started with team management.
              </p>
              <WorkerSheet
                userId={user.id}
                onSuccess={loadWorkers}
                trigger={
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Add Your First Worker
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {workers.map((worker, i) => (
                <div
                  key={worker.id || i}
                  className="grid grid-cols-[2fr_1fr_1fr_min-content] gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {worker.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {worker.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {worker.role || "Construction Worker"}
                      </p>
                    </div>
                  </div>

                  <div className="font-medium text-foreground">
                    <span className="text-lg">${worker.hourly_rate}</span>
                    <span className="text-sm text-muted-foreground">/hr</span>
                  </div>

                  <div>
                    <Badge
                      variant={worker.is_active ? "default" : "secondary"}
                      className={
                        worker.is_active
                          ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                          : "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
                      }
                    >
                      {worker.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

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
                      <DropdownMenuContent align="end" className="w-40">
                        <WorkerSheet
                          userId={user.id}
                          worker={worker}
                          onSuccess={loadWorkers}
                          trigger={
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              Edit Worker
                            </DropdownMenuItem>
                          }
                        />
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
    </div>
  );
}
