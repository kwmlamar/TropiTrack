"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserProfileWithCompany } from "@/lib/types/userProfile"
import { useSidebar } from "@/components/ui/sidebar"
import { ChevronRight, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface SidebarUserInfoProps {
  profile: UserProfileWithCompany
}

export function SidebarUserInfo({ profile }: SidebarUserInfoProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    const timeString = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    // Remove leading zero from hour if present
    return timeString.replace(/^0/, '')
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 p-3 cursor-pointer hover:bg-sidebar-accent/50 rounded-lg transition-colors">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src="/placeholder.svg"
              alt={profile.name}
            />
            <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-sm font-medium">
              {profile.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {!isCollapsed && (
            <>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile.name}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-sidebar-foreground">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-xs text-sidebar-foreground/60">
                    {formatDate(currentTime)}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
            </>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings/profile">
            Profile Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings/account">
            Account Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings/company">
            Company Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 