import DashboardLayout from "@/components/layouts/dashboard-layout";
import PayrollPage from "@/components/payroll/page";

export default function Page() {
  return (
    <DashboardLayout title="Payroll">
      <PayrollPage />
    </DashboardLayout>
  );
}
