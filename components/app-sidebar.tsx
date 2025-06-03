"use client";

import type * as React from "react";
import { useState, useEffect } from "react";
import {
  IconDashboard,
  IconFileDescription,
  IconBuilding,
  IconHelp,
  IconDevicesDollar,
  IconSearch,
  IconSettings,
  IconUsers,
  IconBriefcase,
  IconPlus,
  IconBell,
  IconChevronRight,
  IconClock,
  IconCalendar,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { QuickActions } from "@/components/quick-actions";
import { SearchCommand } from "@/components/search-command";
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
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import type { UserProfileWithCompany } from "@/lib/types/userProfile";
import type { Worker } from "@/lib/types/worker";
import type { Client } from "@/lib/types/client";
import type { Project } from "@/lib/types/project";
import {
  fetchClientsForCompany,
  fetchProjectAssignments,
  fetchProjectsForCompany,
  fetchWorkersForCompany,
} from "@/lib/data/data";
import { ProjectDialog, WorkerSheet } from "./forms/form-dialogs";
import { ProjectAssignment } from "@/lib/types";

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
      icon: IconDashboard,
      badge: null,
      description: "Overview and analytics",
    },
    {
      title: "Projects",
      url: "/dashboard/projects",
      icon: IconBuilding,
      badge: null,
      description: "Manage construction projects",
    },
    {
      title: "Clients",
      url: "/dashboard/clients",
      icon: IconBriefcase,
      badge: null,
      description: "Client relationships",
    },
    {
      title: "Workers",
      url: "/dashboard/workers",
      icon: IconUsers,
      badge: null,
      description: "Team management",
    },
    {
      title: "Timesheets",
      url: "/dashboard/timesheets",
      icon: IconFileDescription,
      badge: null,
      description: "Track work hours",
    },
    {
      title: "Payroll",
      url: "/dashboard/payroll",
      icon: IconDevicesDollar,
      badge: null,
      description: "Manage payments",
    },
  ],
  quickActions: [
    { title: "New Project", icon: IconBuilding, action: "create-project" },
    { title: "Add Worker", icon: IconUsers, action: "add-worker" },
    { title: "Clock In", icon: IconClock, action: "clock-in" },
    { title: "Schedule", icon: IconCalendar, action: "schedule" },
  ],
  navSecondary: [
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
      shortcut: "⌘K",
      description: "Search everything",
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
      description: "App preferences",
    },
    {
      title: "Help & Support",
      url: "#",
      icon: IconHelp,
      description: "Get assistance",
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
  const [projects, setProjects] = useState<Project[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [workerSheet, setWorkerSheet] = useState(false);
  const [projectDialog, setProjectDialog] = useState(false);

  useEffect(() => {
    loadWorkers();
    loadClients();
    loadProjects();
    loadProjectAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProjects = async () => {
      try {
        const data = await fetchProjectsForCompany(profile.id);
        setProjects(data);
      } catch (error) {
        console.log("Failed to load projects:", error);
      } 
    };

    const loadProjectAssignments = async () => {
        try {
          const data = await fetchProjectAssignments(profile.id);
          setProjectAssignments(data);
        } catch (error) {
          console.log("Failed to load project assignments:", error);
        }
      };

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
    avatar: profile.avatar_url ?? "/avatars/default.jpg",
    role: profile.role ?? "Worker",
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border/50 bg-sidebar/50 backdrop-blur-sm"
      {...props}
    >
      {/* Enhanced Header with Logo and Quick Search */}
      <SidebarHeader className="border-b border-border/50 bg-sidebar/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-2 py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!py-2 data-[slot=sidebar-menu-button]:!px-2 bg-transparent hover:bg-sidebar-accent/50 transition-colors duration-200"
              >
                <a href="/dashboard" className="flex items-center gap-2">
                  <div className="relative">
                    <Image
                      src="/logo/1.png"
                      alt="TropiTrack Logo"
                      width={isCollapsed ? 32 : 100}
                      height={isCollapsed ? 32 : 50}
                      className="block dark:hidden transition-all duration-200"
                      priority
                    />
                    <Image
                      src="/logo/2.png"
                      alt="TropiTrack Dark Logo"
                      width={isCollapsed ? 32 : 100}
                      height={isCollapsed ? 32 : 50}
                      className="hidden dark:block transition-all duration-200"
                      priority
                    />
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

          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              >
                <IconBell className="h-4 w-4" />
              </Button>
              <SearchCommand />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 space-y-6">
        {/* Quick Actions Section */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider px-2 mb-2">
              Quick Actions
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <QuickActions
                items={data.quickActions}
                onAction={handleQuickAction}
              />
              <WorkerSheet
                userId={profile.id}
                onSuccess={loadWorkers}
                open={workerSheet}
                onOpenChange={setWorkerSheet}
              />
              <ProjectDialog
                userId={profile.id}
                clients={clients}
                workers={workers}
                open={projectDialog}
                onOpenChange={setProjectDialog}
                onSuccess={() => {
                  loadProjects();
                  loadProjectAssignments();
                }}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider px-2 mb-2">
            {isCollapsed ? "Nav" : "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={data.navMain} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Projects - Only show when expanded */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
              Recent Projects
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 text-sidebar-foreground/40 hover:text-sidebar-foreground"
              >
                <IconPlus className="h-3 w-3" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-1">
                {data.recentProjects.map((project, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent/50 cursor-pointer transition-colors duration-150"
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        project.status === "active"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-12 h-1 bg-sidebar-accent rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-sidebar-foreground/60">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                    <IconChevronRight className="h-3 w-3 text-sidebar-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Separator */}
        <Separator className="bg-border/50" />

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider px-2 mb-2">
            {isCollapsed ? "More" : "More Options"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavSecondary items={data.navSecondary} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Enhanced Footer */}
      <SidebarFooter className="border-t border-border/50 bg-sidebar/80 backdrop-blur-sm p-2">
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
