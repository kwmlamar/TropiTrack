"use client"

import { format } from "date-fns"
import { useDateRange } from "@/context/date-range-context"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp } from "lucide-react"

interface TimeLogsPageProps {
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
  user: unknown
}

export function TimeLogsPage({ }: TimeLogsPageProps) {
  const { dateRange } = useDateRange()

  // Mock data for the cards - in a real app, this would come from API
  const stats = {
    regularHours: 32.5,
    overtimeHours: 8.5,
    totalHours: 41.0,
    totalPaid: 1245.75
  }

  return (
    <div className="container mx-auto space-y-2 pt-2 pb-6 px-6">
      <div>
        <h2 className="text-lg font-medium mb-4">
          Logged Time{" "}
          <span className="text-gray-500 font-normal">
            {dateRange?.from && dateRange?.to ? (
              <>
                {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
              </>
            ) : (
              format(new Date(), "MMM dd")
            )}
          </span>
        </h2>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-sidebar border border-border/50 shadow-none">
          <CardContent className="px-4 py-0">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-400">Regular Hours</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-900 leading-tight">{stats.regularHours} hours</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="text-green-600 dark:text-green-600 h-4 w-4" />
                <span className="text-sm font-medium text-green-600 dark:text-green-600">+12.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sidebar border border-border/50 shadow-none">
          <CardContent className="px-4 py-0">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-400">Overtime Hours</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-900 leading-tight">{stats.overtimeHours} hours</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="text-green-600 dark:text-green-600 h-4 w-4" />
                <span className="text-sm font-medium text-green-600 dark:text-green-600">+8.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sidebar border border-border/50 shadow-none">
          <CardContent className="px-4 py-0">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-400">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-900 leading-tight">{stats.totalHours} hours</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="text-green-600 dark:text-green-600 h-4 w-4" />
                <span className="text-sm font-medium text-green-600 dark:text-green-600">+15.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sidebar border border-border/50 shadow-none">
          <CardContent className="px-4 py-0">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-400">Total Paid</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-900 leading-tight">${stats.totalPaid.toLocaleString()}</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="text-green-600 dark:text-green-600 h-4 w-4" />
                <span className="text-sm font-medium text-green-600 dark:text-green-600">+18.7%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Worker Details Section */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-900 mb-4">Worker Details</h3>
        
        {/* Mock worker data */}
        <div className="space-y-2">
          {[
            {
              id: "1",
              name: "John Smith",
              position: "Carpenter",
              project: "Downtown Office Complex",
              approved: {
                regularHours: 32.5,
                overtimeHours: 8.0,
                totalHours: 40.5
              },
              unapproved: {
                regularHours: 16.0,
                overtimeHours: 4.0,
                totalHours: 20.0
              }
            },
            {
              id: "2", 
              name: "Maria Garcia",
              position: "Electrician",
              project: "Residential Tower A",
              approved: {
                regularHours: 28.0,
                overtimeHours: 6.5,
                totalHours: 34.5
              },
              unapproved: {
                regularHours: 12.0,
                overtimeHours: 2.5,
                totalHours: 14.5
              }
            },
            {
              id: "3",
              name: "David Johnson",
              position: "Plumber",
              project: "Shopping Center Renovation",
              approved: {
                regularHours: 35.0,
                overtimeHours: 7.5,
                totalHours: 42.5
              },
              unapproved: {
                regularHours: 8.0,
                overtimeHours: 1.0,
                totalHours: 9.0
              }
            },
            {
              id: "4",
              name: "Sarah Wilson",
              position: "Mason",
              project: "Downtown Office Complex",
              approved: {
                regularHours: 30.0,
                overtimeHours: 5.5,
                totalHours: 35.5
              },
              unapproved: {
                regularHours: 20.0,
                overtimeHours: 6.0,
                totalHours: 26.0
              }
            },
            {
              id: "5",
              name: "Michael Brown",
              position: "Welder",
              project: "Residential Tower A",
              approved: {
                regularHours: 33.5,
                overtimeHours: 9.0,
                totalHours: 42.5
              },
              unapproved: {
                regularHours: 14.5,
                overtimeHours: 3.5,
                totalHours: 18.0
              }
            }
          ].map((worker) => (
            <div 
              key={worker.id} 
              className="group rounded-lg border p-4 transition-all hover:border-border/80 bg-sidebar relative"
            >
              <div className="absolute left-0 top-1 bottom-1 w-1 bg-red-500 rounded-l-lg"></div>
              {/* Three Column Layout */}
              <div className="flex items-center">
                {/* Worker Name Column */}
                <div className="flex items-center gap-3 w-60 mb-8">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src="/placeholder.svg"
                      alt={worker.name}
                    />
                    <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-sm font-medium">
                      {worker.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground mb-1">{worker.name}</p>
                    <p className="text-xs font-semibold text-gray-500">{worker.position || "Construction Worker"}</p>
                  </div>
                </div>
                
                {/* Approved Time Column */}
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-medium">Approved time totals by type for period</p>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <div className="text-left flex-1">
                      <p className="font-medium text-xs text-gray-500 uppercase mb-1">Regular Work Hours</p>
                      <p className="text-sm font-medium">{worker.approved.regularHours} hrs</p>
                    </div>
                    <div className="text-left w-20">
                      <p className="font-medium text-xs text-gray-500 uppercase mb-1">Over Time</p>
                      <p className="text-sm font-medium">{worker.approved.overtimeHours} hrs</p>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-xs text-gray-500 uppercase mb-1">Total Work Hours</p>
                      <p className="text-sm font-medium">{worker.approved.totalHours} hrs</p>
                    </div>
                  </div>
                </div>
                
                {/* Unapproved Time Column */}
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm font-medium">Unapproved time totals by type for period</p>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <div className="text-left flex-1">
                      <p className="font-medium text-xs text-gray-500 uppercase mb-1">Regular Work Hours</p>
                      <p className="text-sm font-medium">{worker.unapproved.regularHours} hrs</p>
                    </div>
                    <div className="text-left w-20">
                      <p className="font-medium text-xs text-gray-500 uppercase mb-1">Over Time</p>
                      <p className="text-sm font-medium">{worker.unapproved.overtimeHours} hrs</p>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-xs text-gray-500 uppercase mb-1">Total Work Hours</p>
                      <p className="text-sm font-medium">{worker.unapproved.totalHours} hrs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 