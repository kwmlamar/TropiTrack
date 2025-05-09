"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { SearchForm } from "@/components/search-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addEmployee, fetchEmployees, deleteEmployee, updateEmployee } from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, Plus, UserCheck, UserX } from "lucide-react";
import { Employee } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmployeeForm } from "@/components/employee-form";
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

const columns = ["Name", "Pay Rate", "Status"];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (error) {
      console.log("Failed to fetch Employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (employee: Employee) => {
    try {
      const data = await addEmployee(employee); // function still expects Omit<Employee, "id">
      setEmployees((prev) => [...prev, data]);
    } catch (error) {
      console.log("Failed to create employee:", error);
    } finally {
      setIsFormOpen(false);
      loadWorkers();
    }
  };
  

  const handleUpdateEmployee = async (employee: Employee) => {
    try {
        const updatedEmployee  = await updateEmployee(employee)  
        if (!updatedEmployee) throw new Error("No employee returned from update");

        setEmployees(employees.map((e) => (e.id === employee.id ? updatedEmployee : e)))
    } catch (error) {
        console.log("Failed to update worker:", error);
    } finally {
        setSelectedEmployee(null);
        setIsFormOpen(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteEmployee(selectedEmployee.id);
    } catch (error) {
      console.log("Failed to delete employee:", error);
    } finally {
      setSelectedEmployee(null);
      setIsDeleteDialogOpen(false);
    }
    loadWorkers();
  };

  return (
    <DashboardLayout title="Employees">
      <h1 className="text-2xl font-bold">Add to your team</h1>
      {/* Your page-specific content goes here */}
      <div className="mt-4 flex w-full items-center justify-between ">
        <SearchForm
          placeholder="Search employees..."
          className="w-1/3 max-w-md"
        />
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedEmployee ? "Edit Employee" : "Add New Employee"}
              </DialogTitle>
              <DialogDescription>
                {selectedEmployee
                  ? "Update the employee's information below."
                  : "Fill in the details to add a new employee."}
              </DialogDescription>
            </DialogHeader>
            <EmployeeForm
              employee={selectedEmployee}
              onSubmit={selectedEmployee ? handleUpdateEmployee : handleCreateEmployee}
              onCancel={() => {
                setSelectedEmployee(null);
                setIsFormOpen(false);
              }}
            />
            <div className="flex flex-col gap-4"></div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees Table*/}
      <div className="mt-4">
        <div className="w-full px-4">
          {/* Column Headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr_40px] gap-4 text-sm font-semibold text-gray-600 mb-2 px-2">
            {columns.map((col) => (
              <div key={col}>{col}</div>
            ))}
            <div /> {/* Empty column for the meatball */}
          </div>

          {/* Data Cards as Rows */}
          {loading ? (
            <div className="text-center text-sm text-gray-500 py-4">
              Loading employees...
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {employees.map((emp, i) => (
                <Card
                  key={i}
                  className="grid grid-cols-[2fr_1fr_1fr_min-content] gap-4 p-4 items-center"
                >
                  <CardContent className="p-0">{emp.name}</CardContent>
                  <CardContent className="p-0">
                    ${emp.hourly_rate}/hr
                  </CardContent>
                  <CardContent className="p-0">
                    <Badge variant={emp.active ? "default" : "secondary"}>
                      {emp.active ? "Active" : "Inactive"}
                    </Badge>
                  </CardContent>
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
                            setSelectedEmployee(emp);
                            setIsFormOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setSelectedEmployee(emp);
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
                    setSelectedEmployee(null);
                  }
                  setIsDeleteDialogOpen(open);
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {selectedEmployee?.name}.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteEmployee}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {employees.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <UserX className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No employees found</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                You haven&apos;t added any employees yet. Add your first
                employee to get started.
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Add Your First Employee
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
