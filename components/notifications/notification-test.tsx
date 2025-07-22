'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from '@/hooks/use-notifications'
import { 
  createTimesheetSubmittedNotification,
  createPayrollGeneratedNotification,
  createProjectCreatedNotification,
  createWorkerAddedNotification,
  createSystemMaintenanceNotification,
  // Company-wide notification functions
  createTimesheetSubmittedNotificationCompanyWide,
  createPayrollGeneratedNotificationCompanyWide,
  createProjectCreatedNotificationCompanyWide,
  createWorkerAddedNotificationCompanyWide,
  createClientAddedNotificationCompanyWide,
  createPayrollConfirmedNotificationCompanyWide,
  createPayrollPaidNotificationCompanyWide,
  createPayrollVoidedNotificationCompanyWide
} from '@/lib/utils/notifications'
import { cleanupOldNotifications } from '@/lib/data/notifications'
import { useUser } from '@/lib/hooks/use-user'

export function NotificationTest() {
  const { user, loading: userLoading, initialized } = useUser()
  const { createNotification } = useNotifications()
  const [loading, setLoading] = useState(false)

  const handleCreateNotification = async (type: string) => {
    if (!user?.id) return

    // Use the company_id from the user profile
    const companyId = user.company_id || 'test-company-id'

    setLoading(true)
    try {
      switch (type) {
        case 'timesheet':
          await createTimesheetSubmittedNotification({
            userId: user.id,
            companyId: companyId,
            workerName: 'John Doe',
            projectName: 'Beach Resort Construction',
            totalHours: 8,
            date: '2024-03-27',
            actionUrl: '/dashboard/timesheets'
          })
          break
        case 'payroll':
          await createPayrollGeneratedNotification({
            userId: user.id,
            companyId: companyId,
            period: 'Week of March 18-24',
            workerCount: 12,
            totalAmount: 15420.50,
            actionUrl: '/dashboard/payroll'
          })
          break
        case 'project':
          await createProjectCreatedNotification({
            userId: user.id,
            companyId: companyId,
            projectName: 'Luxury Villa Development',
            clientName: 'Paradise Properties',
            actionUrl: '/dashboard/projects'
          })
          break
        case 'worker':
          await createWorkerAddedNotification({
            userId: user.id,
            companyId: companyId,
            workerName: 'Maria Rodriguez',
            projectName: 'Beach Resort Construction',
            actionUrl: '/dashboard/workers'
          })
          break
        case 'system':
          await createSystemMaintenanceNotification({
            userId: user.id,
            companyId: companyId,
            message: 'Scheduled maintenance will occur on Sunday at 2 AM EST. Service may be temporarily unavailable.',
            actionUrl: '/dashboard/settings/profile'
          })
          break
        case 'custom':
          await createNotification({
            title: 'Custom Notification',
            message: 'This is a custom notification created for testing purposes.',
            type: 'info',
            category: 'general',
            is_read: false,
            action_url: '/dashboard',
            action_text: 'Go to Dashboard'
          })
          break
        default:
          break
      }
    } catch (error) {
      console.error('Error creating notification:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompanyWideNotification = async (type: string) => {
    if (!user?.id) return

    // Use the company_id from the user profile
    const companyId = user.company_id || 'test-company-id'
    const userName = user.name || 'User'

    setLoading(true)
    try {
      switch (type) {
        case 'timesheet':
          await createTimesheetSubmittedNotificationCompanyWide({
            excludeUserId: user.id,
            companyId: companyId,
            workerName: 'John Doe',
            projectName: 'Beach Resort Construction',
            totalHours: 8,
            date: '2024-03-27',
            actionUrl: '/dashboard/timesheets'
          })
          break
        case 'payroll':
          await createPayrollGeneratedNotificationCompanyWide({
            excludeUserId: user.id,
            companyId: companyId,
            period: 'Week of March 18-24',
            workerCount: 12,
            totalAmount: 15420.50,
            actionUrl: '/dashboard/payroll'
          })
          break
        case 'project':
          await createProjectCreatedNotificationCompanyWide({
            excludeUserId: user.id,
            companyId: companyId,
            projectName: 'Luxury Villa Development',
            clientName: 'Paradise Properties',
            createdBy: userName,
            actionUrl: '/dashboard/projects'
          })
          break
        case 'worker':
          await createWorkerAddedNotificationCompanyWide({
            excludeUserId: user.id,
            companyId: companyId,
            workerName: 'Maria Rodriguez',
            addedBy: userName,
            projectName: 'Beach Resort Construction',
            actionUrl: '/dashboard/workers'
          })
          break
        case 'client':
          await createClientAddedNotificationCompanyWide({
            excludeUserId: user.id,
            companyId: companyId,
            clientName: 'Sunset Properties Ltd.',
            addedBy: userName,
            actionUrl: '/dashboard/clients'
          })
          break
        case 'payrollConfirmed':
          await createPayrollConfirmedNotificationCompanyWide({
            excludeUserId: user.id,
            companyId: companyId,
            workerName: 'John Doe',
            period: 'Week of March 18-24',
            grossPay: 15420.50,
            actionUrl: '/dashboard/payroll'
          })
          break
        case 'payrollPaid':
          await createPayrollPaidNotificationCompanyWide({
            excludeUserId: user.id,
            companyId: companyId,
            workerName: 'John Doe',
            period: 'Week of March 18-24',
            grossPay: 15420.50,
            actionUrl: '/dashboard/payroll'
          })
          break
        case 'payrollVoided':
          await createPayrollVoidedNotificationCompanyWide({
            excludeUserId: user.id,
            companyId: companyId,
            workerName: 'John Doe',
            period: 'Week of March 18-24',
            actionUrl: '/dashboard/payroll'
          })
          break
        default:
          break
      }
    } catch (error) {
      console.error('Error creating company-wide notification:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCleanup = async () => {
    setLoading(true)
    try {
      const deletedCount = await cleanupOldNotifications()
      alert(`Cleanup completed! ${deletedCount} read notifications older than 14 days have been deleted.`)
    } catch (error) {
      console.error('Error during cleanup:', error)
      alert('Error during cleanup. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  if (userLoading || !initialized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Test Panel</CardTitle>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Test Panel</CardTitle>
        <p className="text-sm text-muted-foreground">
          Create test notifications to see the real-time notification system in action.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Individual Notifications</TabsTrigger>
            <TabsTrigger value="company-wide">Company-Wide Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Create notifications for the current user only
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleCreateNotification('timesheet')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">📋</span>
                <span className="text-xs">Timesheet</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateNotification('payroll')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">💰</span>
                <span className="text-xs">Payroll</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateNotification('project')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">🏗️</span>
                <span className="text-xs">Project</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateNotification('worker')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">👷</span>
                <span className="text-xs">Worker</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateNotification('system')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">⚙️</span>
                <span className="text-xs">System</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateNotification('custom')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">🎯</span>
                <span className="text-xs">Custom</span>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="company-wide" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Create notifications for all users in the company (except yourself)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleCreateCompanyWideNotification('timesheet')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">📋</span>
                <span className="text-xs">Timesheet</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateCompanyWideNotification('payroll')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">💰</span>
                <span className="text-xs">Payroll</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateCompanyWideNotification('payrollConfirmed')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">✅</span>
                <span className="text-xs">Payroll Confirmed</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateCompanyWideNotification('payrollPaid')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">💳</span>
                <span className="text-xs">Payroll Paid</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateCompanyWideNotification('payrollVoided')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">❌</span>
                <span className="text-xs">Payroll Voided</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateCompanyWideNotification('project')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">🏗️</span>
                <span className="text-xs">Project</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateCompanyWideNotification('worker')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">👷</span>
                <span className="text-xs">Worker</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCreateCompanyWideNotification('client')}
                disabled={loading}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-lg">👥</span>
                <span className="text-xs">Client</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Cleanup Section */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Notification Cleanup</h3>
              <p className="text-sm text-muted-foreground">
                Manually trigger cleanup of read notifications older than 14 days
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleCleanup}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <span className="text-lg">🧹</span>
              <span>Cleanup Old Notifications</span>
            </Button>
          </div>
        </div>
        
        {loading && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Creating notification...
          </div>
        )}
      </CardContent>
    </Card>
  )
} 