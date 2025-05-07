"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchEmployees } from "@/lib/data";

const columns = ["Name", "Pay Rate", "Status"];

type Employee = {
  id: string;
  full_name: string;
  hourly_rate: number;
  status: string;
};

export default function EmployeesTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleFetchEmployees = async () => {
      setIsLoading(true);
      try {
        const data = await fetchEmployees();
        setEmployees(data);
      } catch (error) {
        console.log("Error fetching employee data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    handleFetchEmployees();
  }, []);

  return (
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
              <CardContent className="p-0">${emp.hourly_rate}/hr</CardContent>
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
                      onClick={() => console.log("Delete", emp.full_name)}
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
  );
}
