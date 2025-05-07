
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { SearchForm } from "@/components/search-form";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import  EmployeesTable  from "@/components/employees-table";


export default function EmployeesPage() {
  return (
    <DashboardLayout title="Employees">
      <h1 className="text-2xl font-bold">Add to your team</h1>
      {/* Your page-specific content goes here */}
      <div className="mt-4 flex w-full items-center justify-between ">
        <SearchForm placeholder="Search employees..." className="w-1/3 max-w-md" />
        <Button className="ml-auto">
            <IconPlus className="!size-5"/>
          Add Employee
        </Button>
      </div>
      <div className="mt-4">
        <EmployeesTable  />
      </div>
        
    </DashboardLayout>
  );
}
