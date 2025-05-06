// components/layouts/DashboardLayout.tsx
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"; // adjust imports
import { AppSidebar } from "@/components/app-sidebar"; // adjust path
import { SiteHeader } from "@/components/site-header"; // adjust path

export default function DashboardLayout({ 
    children,
    title = "Dashboard",
 }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 50)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title={title} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
