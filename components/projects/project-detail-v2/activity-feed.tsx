"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, FileText, Users, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  type: 'timesheet' | 'approval' | 'invoice' | 'team' | 'milestone'
  description: string
  workerName?: string
  timestamp: Date
}

interface ActivityFeedProps {
  timesheets?: Array<{
    id: string
    worker?: { name: string } | null
    date: string
    total_hours: number
    supervisor_approval: string
    updated_at?: string
    created_at: string
  }>
  limit?: number
}

export function ActivityFeed({ timesheets = [], limit = 5 }: ActivityFeedProps) {
  // Convert timesheets to activity items
  const activities: ActivityItem[] = timesheets
    .slice(0, limit)
    .map(ts => ({
      id: ts.id,
      type: ts.supervisor_approval === 'approved' ? 'approval' : 'timesheet',
      description: ts.supervisor_approval === 'approved'
        ? `Timesheet approved for ${ts.total_hours.toFixed(1)}h`
        : `Logged ${ts.total_hours.toFixed(1)} hours`,
      workerName: ts.worker?.name || 'Unknown',
      timestamp: new Date(ts.updated_at || ts.created_at)
    }))

  // If no real data, show placeholder
  const hasData = activities.length > 0

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'timesheet':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'approval':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'invoice':
        return <FileText className="h-4 w-4 text-purple-500" />
      case 'team':
        return <Users className="h-4 w-4 text-amber-500" />
      case 'milestone':
        return <Calendar className="h-4 w-4 text-[#2596be]" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {hasData ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#2596be]/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-[#2596be]">
                    {activity.workerName ? getInitials(activity.workerName) : '?'}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getActivityIcon(activity.type)}
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.workerName}</span>
                      {' '}
                      <span className="text-gray-600 dark:text-gray-400">
                        {activity.description}
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              No recent activity
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Activity will appear here as work is logged
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
