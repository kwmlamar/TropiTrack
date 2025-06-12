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
  quickActions: [
    { title: "New Project", icon: Building2, action: "create-project" },
    { title: "Add Worker", icon: Users, action: "add-worker" },
    { title: "Clock In", icon: Clock, action: "clock-in" },
    { title: "Schedule", icon: Calendar, action: "schedule" },
  ],
  navSecondary: [
    {
      title: "Search",
      url: "#",
      icon: Search,
      shortcut: "⌘K",
      description: "Search everything",
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
      description: "App preferences",
    },
    {
      title: "Help & Support",
      url: "#",
      icon: HelpCircle,
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
    avatar: "/avatars/default.jpg",
    role: profile.role ?? "Worker",
  };

  const { open, setOpen } = useSidebar();

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border/50 bg-sidebar/95 backdrop-blur-xl transition-all duration-300"
      {...props}
    >
      {/* Enhanced Header with Logo and Quick Search */}
      <SidebarHeader className="border-b border-border/50 bg-sidebar/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-2 py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!py-2 data-[slot=sidebar-menu-button]:!px-2 bg-transparent hover:bg-sidebar-accent/50 transition-all duration-200 rounded-md"
              >
                <a href="/dashboard" className="flex items-center gap-3">
                  <div className="relative flex items-center">
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

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md hover:bg-sidebar-accent/50"
            onClick={() => setOpen(!open)}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 text-sidebar-foreground/60 transition-transform duration-200",
                open ? "rotate-180" : "rotate-0"
              )}
            />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-4 px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider px-2 mb-2">
            {isCollapsed ? "Nav" : "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            <NavMain items={data.navMain} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Projects */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
              Recent Projects
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-md hover:bg-sidebar-accent/50 transition-colors duration-200"
                onClick={() => handleQuickAction("create-project")}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent className="space-y-1">
              {data.recentProjects.map((project, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    asChild
                    className="w-full px-2 py-1.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50 rounded-md transition-colors duration-200"
                  >
                    <a href={`/dashboard/projects/${project.name.replace(/\s+/g, '-').toLowerCase()}`} className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                        <Briefcase className="h-3 w-3 text-primary" />
                      </div>
                      <span className="flex-1 truncate">{project.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* More Options */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider px-2 mb-2">
            {isCollapsed ? "More" : "More Options"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            <NavSecondary items={data.navSecondary} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Enhanced Footer */}
      <SidebarFooter className="border-t border-border/50 bg-sidebar/95 backdrop-blur-xl p-2">
        <NavUser user={sidebarUser} />
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
          loadProjects();
          loadProjectAssignments();
        }}
      />
    </Sidebar>
  );
}
