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
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";

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
  onSearch?: (query: string) => void;
  onUserMenuAction?: (action: string) => void;
  onCompanySwitch?: () => void;
};

export function SiteHeader({
  title = "Dashboard",
  user,
  onSearch,
  onCompanySwitch,
}: SiteHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

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
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full hover:bg-muted/80 transition-colors duration-200"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="/placeholder.svg"
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
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
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/dashboard/profile">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/notifications">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Bell className="h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/settings">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
