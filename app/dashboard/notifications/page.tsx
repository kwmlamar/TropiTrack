import DashboardLayout from "@/components/layouts/dashboard-layout";
import { NotificationsPage } from "@/components/notifications/notifications-page";
import { NotificationTest } from "@/components/notifications/notification-test";

export default function NotificationsPageWrapper() {
  return (
    <DashboardLayout title="Notifications">
      <div className="space-y-6">
        <NotificationTest />
        <NotificationsPage />
      </div>
    </DashboardLayout>
  );
}
