"use client";

import type * as React from "react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  HelpCircle,
  DollarSign,
  Search,
  Settings,
  Users,
  Briefcase,
  Plus,
  ChevronRight,
  Clock,
  Calendar,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { UserProfileWithCompany } from "@/lib/types/userProfile";
import type { Worker } from "@/lib/types/worker";
import type { Client } from "@/lib/types/client";
import type { Project } from "@/lib/types/project";
import {
  fetchClientsForCompany,
  fetchWorkersForCompany,
} from "@/lib/data/data";
import { ProjectDialog, WorkerSheet } from "./forms/form-dialogs";
import { getRecentProjects } from "@/lib/data/recent-projects";

const data = {
  user: {
    name: "John Smith",
    email: "john@constructionco.bs",
    avatar: "/avatars/user.jpg",
    role: "Project Manager",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      badge: null,
      description: "Overview and analytics",
    },
    {
      title: "Projects",
      url: "/dashboard/projects",
      icon: Building2,
      badge: null,
      description: "Manage construction projects",
    },
    {
      title: "Clients",
      url: "/dashboard/clients",
      icon: Briefcase,
      badge: null,
      description: "Client relationships",
    },
    {
      title: "Workers",
      url: "/dashboard/workers",
      icon: Users,
      badge: null,
      description: "Team management",
    },
    {
      title: "Timesheets",
      url: "/dashboard/timesheets",
      icon: FileText,
      badge: null,
      description: "Track work hours",
    },
    {
      title: "Payroll",
      url: "/dashboard/payroll",
      icon: DollarSign,
      badge: null,
      description: "Manage payments",
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
      description: "App preferences",
    },
  ],
  recentProjects: [
    { name: "Paradise Resort Phase 1", status: "active", progress: 75 },
    { name: "Cable Beach Condos", status: "planning", progress: 25 },
    { name: "Downtown Office Complex", status: "active", progress: 60 },
  ],
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  profile: UserProfileWithCompany;
};

export function AppSidebar({ profile, ...props }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [recentProjects, setRecentProjects] = useState<Partial<Project>[]>([]);
  const [workerSheet, setWorkerSheet] = useState(false);
  const [projectDialog, setProjectDialog] = useState(false);

  useEffect(() => {
    loadWorkers();
    loadClients();
    loadRecentProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClients = async () => {
    try {
      const data = await fetchClientsForCompany(profile.id);
      setClients(data);
    } catch (error) {
      console.log("Failed to load clients:", error);
    }
  };

  const loadWorkers = async () => {
    try {
      const data = await fetchWorkersForCompany(profile.id);
      setWorkers(data);
    } catch (error) {
      console.log("Failed to load workers:", error);
    }
  };

  const loadRecentProjects = async () => {
    try {
      const data = await getRecentProjects(profile.id);
      setRecentProjects(data);
    } catch (error) {
      console.error("Failed to load recent projects:", error);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "add-worker":
        // Trigger add worker sheet/modal
        setWorkerSheet(true);
        console.log("Open Add Worker");
        break;
      case "create-project":
        // Trigger project form
        setProjectDialog(true);
        console.log("Open New Project Form");
        break;
      default:
        console.log(`Unhandled action: ${action}`);
    }
  };

  const sidebarUser = {
    name: profile.name,
    email: profile.email ?? "no-email@tropitrack.bs",
    avatar: "/avatars/default.jpg",
    role: profile.role ?? "Worker",
  };

  const { open, setOpen } = useSidebar();

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-sidebar-border/50 bg-sidebar/95 backdrop-blur-xl transition-all duration-300"
      {...props}
    >
      {/* Enhanced Header with Logo and Quick Search */}
      <SidebarHeader className="border-b border-sidebar-border/50 bg-sidebar/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-2 py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!py-2 data-[slot=sidebar-menu-button]:!px-2 bg-transparent hover:bg-sidebar-accent/10 transition-all duration-200 rounded-md"
              >
                <a href="/dashboard" className="flex items-center gap-3">
                  <div className="relative flex items-center">
                    <span className="text-xl font-bold text-sidebar-foreground">
                      TropiTrack
                    </span>
                  </div>
                  {isCollapsed && (
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-sidebar-foreground">
                        TropiTrack
                      </span>
                      <span className="text-xs text-sidebar-foreground/60">
                        Construction Suite
                      </span>
                    </div>
                  )}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-4 p-4">
        <NavMain
          items={data.navMain}
          className="flex flex-col gap-1"
          itemClassName="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-all duration-200 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent/20 data-[active=true]:text-sidebar-foreground"
          iconClassName="h-4 w-4 text-sidebar-foreground/60 group-hover:text-sidebar-foreground group-data-[active=true]:text-sidebar-foreground"
        />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 bg-sidebar/95 backdrop-blur-xl p-4">
        <NavSecondary
          items={data.navSecondary}
          className="flex flex-col gap-1"
          itemClassName="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition-all duration-200 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
          iconClassName="h-4 w-4 text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
        />
      </SidebarFooter>

      {/* Dialogs */}
      <WorkerSheet 
        open={workerSheet} 
        onOpenChange={setWorkerSheet}
        userId={profile.id}
        onSuccess={loadWorkers}
      />
      <ProjectDialog 
        open={projectDialog} 
        onOpenChange={setProjectDialog}
        userId={profile.id}
        clients={clients}
        workers={workers}
        onSuccess={() => {
          loadClients();
        }}
      />
    </Sidebar>
  );
}
