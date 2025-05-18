import DashboardLayout from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/timesheets/data-table";
import { Payment, columns } from "@/components/timesheets/columns";
import { createClient } from "@/utils/supabase/server";

async function getData(): Promise<Payment[]> {
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
  ];
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
