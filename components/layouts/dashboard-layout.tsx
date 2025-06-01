import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"; // adjust imports
import { AppSidebar } from "@/components/app-sidebar"; // adjust path
import { SiteHeader } from "@/components/site-header"; // adjust path
import { ModeToggle } from "../mode-toggle";
import { getUserProfileWithCompany } from "@/lib/data/userProfiles";

type DashboardLayoutProps = {
    children: React.ReactNode;
    title?: string;
};

export default async function DashboardLayout({ 
    children,
    title = "Dashboard",
 }: DashboardLayoutProps) {
  const profile = await getUserProfileWithCompany();
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 50)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar profile={profile} variant="inset" />
      <SidebarInset>
        <SiteHeader user={profile} title={title} rightSlot={<ModeToggle />} />
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
