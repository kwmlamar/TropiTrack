import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function SettingsPage() {
  return (
    <DashboardLayout title="Settings">
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h1 className="text-3xl font-bold text-primary">Coming Soon</h1>
        <p className="mt-2 text-muted-foreground">
          The Settings module is under construction. Check back soon!
        </p>
      </div>
    </DashboardLayout>
  );
}
