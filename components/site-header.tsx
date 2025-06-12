"use client";

import type React from "react";

import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Search,
  Settings,
  User,
  LogOut,
  Building2,
  Users,
  HelpCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfileWithCompany } from "@/lib/types/userProfile";
import Link from "next/link";
import { cn } from "@/lib/utils";

async function logout() {
  const res = await fetch("/auth/signout", {
    method: "POST",
  });

  // Optional: redirect manually if the server didn't do it
  if (res.redirected) {
    window.location.href = res.url;
  }
}

type SiteHeaderProps = {
  title?: string;
  rightSlot?: React.ReactNode;
  user: UserProfileWithCompany;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: "info" | "warning" | "success" | "error";
  }>;
  onSearch?: (query: string) => void;
  onNotificationClick?: (notificationId: string) => void;
  onUserMenuAction?: (action: string) => void;
  onCompanySwitch?: () => void;
};

export function SiteHeader({
  title = "Dashboard",
  rightSlot,
  user,
  notifications = [
    {
      id: "1",
      title: "Timesheet Approval",
      message: "3 timesheets pending approval",
      time: "5 min ago",
      read: false,
      type: "warning",
    },
    {
      id: "2",
      title: "New Worker Added",
      message: "Marcus Johnson joined Paradise Resort project",
      time: "1 hour ago",
      read: false,
      type: "info",
    },
    {
      id: "3",
      title: "Payroll Generated",
      message: "Weekly payroll for 12 workers completed",
      time: "2 hours ago",
      read: true,
      type: "success",
    },
  ],
  onSearch,
  onNotificationClick,
  onUserMenuAction,
  onCompanySwitch,
}: SiteHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return "🟡";
      case "error":
        return "🔴";
      case "success":
        return "🟢";
      default:
        return "🔵";
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-4 lg:px-6">
        {/* Left Section - Sidebar Trigger & Title */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 hover:bg-muted/80 transition-colors duration-200" />
          <Separator orientation="vertical" className="mx-2 h-4" />

          {/* Company Info */}
          <Button
            variant="ghost"
            onClick={onCompanySwitch}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 h-auto hover:bg-muted/80 rounded-md transition-all duration-200"
          >
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Building2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground max-w-32 truncate">
              {user.company?.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>

          <Separator
            orientation="vertical"
            className="mx-2 h-4 hidden sm:block"
          />
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search workers, projects, timesheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring hover:bg-muted/80 transition-colors duration-200"
            />
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 hover:bg-muted/80 transition-colors duration-200">
                <Search className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="end">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search workers, projects, timesheets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </form>
            </PopoverContent>
          </Popover>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-muted/80 transition-colors duration-200">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-in fade-in-0 zoom-in-75"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <h4 className="font-semibold text-foreground">Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  You have {unreadCount} unread notifications
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-all duration-200",
                      !notification.read && "bg-muted/20"
                    )}
                    onClick={() => onNotificationClick?.(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t">
                <Button variant="ghost" className="w-full text-sm hover:bg-muted/80 transition-colors duration-200">
                  View all notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Custom Right Slot */}
          {rightSlot}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-muted/80 transition-colors duration-200">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="/placeholder.svg"
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  {user.role && (
                    <Badge variant="secondary" className="w-fit text-xs mt-1">
                      {user.role}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/dashboard/profile">
                <DropdownMenuItem className="hover:bg-muted/80 transition-colors duration-200">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/invites">
                <DropdownMenuItem className="hover:bg-muted/80 transition-colors duration-200">
                <Users className="mr-2 h-4 w-4" />
                <span>Team Settings</span>
              </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/settings">
                <DropdownMenuItem className="hover:bg-muted/80 transition-colors duration-200">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              </Link>
              <DropdownMenuItem 
                onClick={() => onUserMenuAction?.("help")}
                className="hover:bg-muted/80 transition-colors duration-200"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive hover:bg-destructive/10 transition-colors duration-200"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
