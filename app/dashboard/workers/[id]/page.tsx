import DashboardLayout from "@/components/layouts/dashboard-layout";
import WorkerDetails from "@/components/workers/worker-details";

export default function WorkerDetailsPage() {
  return (
    <DashboardLayout title="Worker Details">
      <WorkerDetails />
    </DashboardLayout>
  );
} 