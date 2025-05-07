"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { SearchForm } from "@/components/search-form";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import EmployeesTable from "@/components/employees/employees-table";
import { addEmployee } from "@/lib/data";

export default function EmployeesPage() {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    role: "",
    hourly_rate: "",
    status: "Active",
  });

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

      <div className="mt-4">
        <EmployeesTable />
      </div>
    </DashboardLayout>
  );
}
