import DashboardLayout from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Timesheet, columns } from "@/components/timesheets/timesheets-columns";
import { createClient } from "@/utils/supabase/server";

async function getData(): Promise<Timesheet[]> {
  return [
    {
      "id": "ts-001",
      "date": "2025-05-12",
      "worker_id": "emp-001",
      "project_id": "proj-001",
      "task_description": "Concrete pouring for foundation",
      "clock_in": "2025-05-12T07:00:00-04:00",
      "clock_out": "2025-05-12T15:30:00-04:00",
      "break_duration": 30,
      "regular_hours": 8,
      "overtime_hours": 0.5,
      "total_hours": 8.5,
      "hourly_rate": 20.0,
      "total_pay": 170.0,
      "supervisor_approval": true,
      "notes": "Completed ahead of schedule",
    },
    {
      "id": "ts-002",
      "date": "2025-05-13",
      "worker_id": "emp-002",
      "project_id": "proj-002",
      "task_description": "Electrical wiring installation",
      "clock_in": "2025-05-13T08:00:00-04:00",
      "clock_out": "2025-05-13T17:00:00-04:00",
      "break_duration": 60,
      "regular_hours": 8,
      "overtime_hours": 0,
      "total_hours": 8,
      "hourly_rate": 25.0,
      "total_pay": 200.0,
      "supervisor_approval": false,
      "notes": "Awaiting inspection"
    },
    {
      "id": "ts-003",
      "date": "2025-05-14",
      "worker_id": "emp-003",
      "project_id": "proj-003",
      "task_description": "Site cleanup and debris removal",
      "clock_in": "2025-05-14T09:00:00-04:00",
      "clock_out": "2025-05-14T17:00:00-04:00",
      "break_duration": 45,
      "regular_hours": 7.25,
      "overtime_hours": 0,
      "total_hours": 7.25,
      "hourly_rate": 18.0,
      "total_pay": 130.5,
      "supervisor_approval": true
    }
  ]
  
}

export default async function TimesheetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const data = await getData();

  if (error || !user) throw new Error("No user found");
  return (
    <DashboardLayout title="Timesheets">
      <h1 className="text-2xl font-bold">Timesheets</h1>
      {/* Your page-specific content goes here */}
      <div className="container mx-auto py-10">
        <DataTable user={user} columns={columns} data={data} />
      </div>
    </DashboardLayout>
  );
}
