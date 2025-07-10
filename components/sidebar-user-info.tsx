"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserProfileWithCompany } from "@/lib/types/userProfile"
import { useSidebar } from "@/components/ui/sidebar"
import { ChevronRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
          <Avatar className="h-8 w-8">
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
              <ChevronRight className="h-4 w-4 text-sidebar-muted-foreground flex-shrink-0" />
            </>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem>
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          Company Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 