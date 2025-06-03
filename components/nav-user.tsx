"use client";

import {
  IconChevronUp,
  IconLogout,
  IconSettings,
  IconUser,
  IconBell,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface User {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface NavUserProps {
  user: User;
}

async function logout() {
  const res = await fetch("/auth/signout", {
    method: "POST",
  });

  // Optional: redirect manually if the server didn't do it
  if (res.redirected) {
    window.location.href = res.url;
  }
}

export function NavUser({ user }: NavUserProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group h-12 px-3 hover:bg-sidebar-accent/50 transition-all duration-200 data-[state=open]:bg-sidebar-accent/70"
            >
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-8 w-8 border border-sidebar-border">
                  <AvatarImage
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-sm font-medium">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {!isCollapsed && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-sidebar-foreground/60 truncate">
                          {user.email}
                        </p>
                        {user.role && (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-xs"
                          >
                            {user.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <IconChevronUp className="h-4 w-4 text-sidebar-foreground/60 group-data-[state=open]:rotate-180 transition-transform duration-200" />
                  </>
                )}
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            side={isCollapsed ? "right" : "top"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/dashboard/profile">
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <IconUser className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/dashboard/notifications">
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <IconBell className="h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </Link>
            <Link href="/dashboard/settings">
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <IconSettings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <IconLogout className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
