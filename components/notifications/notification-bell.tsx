'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationPanel } from '@/components/notifications/notification-panel'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount, loading } = useNotifications({ autoSubscribe: true })

  // Don't render if still loading
  if (loading) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        disabled
      >
        <Bell className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <NotificationPanel onClose={() => setIsOpen(false)} />
      )}
    </div>
  )
} 