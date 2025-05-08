"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { SearchForm } from "@/components/search-form";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { addEmployee, fetchEmployees, deleteEmployee } from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import { Employee } from "@/lib/types";

const columns = ["Name", "Pay Rate", "Status"];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formData, setFormData] = useState({
    full_name: "",
    role: "",
    hourly_rate: "",
    status: "Active",
  });

  useEffect(() => {
    setLoading(true);
    const handleFetchEmployees = async () => {
      try {
        const data = await fetchEmployees();
        setEmployees(data);
      } catch (error) {
        console.log("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };
    handleFetchEmployees();
  }, [refreshKey]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddEmployee = async () => {
    setLoading(true);

    try {
      await addEmployee(formData);

      setFormData({
        full_name: "",
        role: "",
        hourly_rate: "",
        status: "Active",
      });
    } catch (error) {
      console.error("Error adding employee:", error);
    } finally {
      setLoading(false);
    }
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteEmployee = async (id: number) => {
    try {
       await deleteEmployee(id);
    } catch (error) {
        console.log("Error deleting employee:", error);
    }
    setRefreshKey((prev) => prev + 1)
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
        <Button
          className="ml-auto"
          onClick={() => setShowForm((prev) => !prev)}
        >
          <IconPlus className="!size-5" />
          {showForm ? "Cancel" : "Add Employee"}
        </Button>
      </div>
      {showForm && (
        <div className="mt-4 space-y-2">
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="role"
            placeholder="Role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            name="hourly_rate"
            placeholder="$12/hr"
            value={formData.hourly_rate}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
          <Button onClick={handleAddEmployee}>
            {loading ? "Adding..." : "Submit"}
          </Button>
        </div>
      )}
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
                  <CardContent className="p-0">{emp.full_name}</CardContent>
                  <CardContent className="p-0">
                    ${emp.hourly_rate}/hr
                  </CardContent>
                  <CardContent className="p-0">{emp.status}</CardContent>
                  <CardContent className="p-0 justify-self-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => console.log("Edit", emp.full_name)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDeleteEmployee(emp.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
