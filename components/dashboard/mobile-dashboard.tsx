"use client"

import { useRouter } from "next/navigation"
import { Clock, Users, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getPersonalizedGreeting, getFirstName } from "@/lib/utils/greetings"
import { UserProfileWithCompany } from "@/lib/types/userProfile"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

/**
 * Mobile Dashboard Component
 * 
 * A Connecteam-style mobile-first dashboard that provides:
 * - Personalized time-based greeting
 * - Primary action buttons for quick access
 * - Clean, native app-like experience
 * 
 * This component is designed to be the primary home screen for mobile users
 * and PWA installations. It only displays on mobile screens or in PWA standalone mode.
 * 
 * Layout:
 * - Top: Large greeting header with user's first name
 * - Middle: Three primary action buttons in a vertical stack
 * - Bottom: Minimal placeholder sections (can be expanded later)
 */
interface MobileDashboardProps {
  profile: UserProfileWithCompany
}

export function MobileDashboard({ profile }: MobileDashboardProps) {
  const router = useRouter()

  // Extract first name from full name
  const firstName = getFirstName(profile.name)
  
  // Get personalized greeting
  const greeting = getPersonalizedGreeting(firstName)

  // Primary action buttons configuration
  // Each button links to a key feature of the app
  const primaryActions = [
    {
      label: "Time Clock",
      icon: Clock,
      route: "/dashboard/timesheets",
      description: "Clock in and out",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      label: "Directory",
      icon: Users,
      route: "/dashboard/workers",
      description: "View workers and team",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      label: "Payroll",
      icon: DollarSign,
      route: "/dashboard/payroll",
      description: "View payroll information",
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ]

  const handleActionClick = (route: string) => {
    router.push(route)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-28">
      {/* Greeting Header - Most prominent element */}
      <div className="bg-white border-b border-gray-200 px-6 pt-12 pb-8">
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          {greeting}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          {profile.company?.name || "Welcome back"}
        </p>
      </div>

      {/* Primary Action Buttons */}
      <div className="px-6 mt-8 space-y-4">
        {primaryActions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.route}
              onClick={() => handleActionClick(action.route)}
              className={`w-full h-20 ${action.color} text-white shadow-lg shadow-black/10 rounded-xl flex items-center justify-start px-6 space-x-4 transition-all active:scale-[0.98] border-0`}
              size="lg"
            >
              {/* Icon Container - Large and prominent */}
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              
              {/* Label and Description */}
              <div className="flex-1 text-left">
                <div className="font-semibold text-lg">{action.label}</div>
                <div className="text-sm opacity-90 font-normal">
                  {action.description}
                </div>
              </div>
            </Button>
          )
        })}
      </div>

      {/* Placeholder Sections - Can be expanded later */}
      <div className="px-6 mt-8 space-y-4">
        {/* Recent Activity Placeholder */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Recent Activity
            </h3>
            <p className="text-xs text-gray-500">
              Your recent timesheets and updates will appear here
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats Placeholder */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Quick Stats
            </h3>
            <p className="text-xs text-gray-500">
              Summary statistics will appear here
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Bottom Navigation - Fixed at bottom of screen */}
      <MobileBottomNav />
    </div>
  )
}

