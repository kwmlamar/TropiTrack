// pages/dashboard/index.tsx (or any subpage)
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function DashboardHome() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Today&apos;s Overview</h1>
      {/* Your page-specific content goes here */}
    </DashboardLayout>
  );
}

