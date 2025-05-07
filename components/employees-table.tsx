"use client"

import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

const columns = ["Name", "Pay Rate", "Status"];
const employees = [
  { name: "John Doe", payRate: "$20/hr", status: "Active" },
  { name: "Jane Smith", payRate: "$25/hr", status: "Inactive" },
  { name: "Alice Johnson", payRate: "$30/hr", status: "Active" },
  { name: "Bob Brown", payRate: "$22/hr", status: "Inactive" },
  { name: "Charlie Davis", payRate: "$28/hr", status: "Active" },
  { name: "Diana Evans", payRate: "$24/hr", status: "Inactive" },
];

export default function EmployeesTable() {
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
      <div className="flex flex-col gap-2">
        {employees.map((emp, i) => (
          <Card
            key={i}
            className="grid grid-cols-[2fr_1fr_1fr_min-content] gap-4 p-4 items-center"
          >
            <CardContent className="p-0">{emp.name}</CardContent>
            <CardContent className="p-0">{emp.payRate}</CardContent>
            <CardContent className="p-0">{emp.status}</CardContent>
            <CardContent className="p-0 justify-self-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => console.log("Edit", emp.name)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Delete", emp.name)}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
