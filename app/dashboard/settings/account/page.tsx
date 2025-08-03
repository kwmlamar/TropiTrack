"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  CreditCard, 
  Key, 
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Settings,
  UserX,
  Download,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useUser } from "@/lib/hooks/use-user"
import { getCompanySubscription } from "@/lib/data/subscriptions"
import { changePassword } from "@/app/actions/auth"
import type { CompanySubscriptionWithPlan } from "@/lib/types/subscription"

export default function AccountSettingsPage() {
  const { user, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [subscription, setSubscription] = useState<CompanySubscriptionWithPlan | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load subscription data
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.company?.id) return
      
      setSubscriptionLoading(true)
      try {
        const response = await getCompanySubscription()
        if (response.success && response.data) {
          setSubscription(response.data)
        }
      } catch (error) {
        console.error("Error loading subscription:", error)
      } finally {
        setSubscriptionLoading(false)
      }
    }

    loadSubscription()
  }, [user?.company?.id])

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await changePassword(passwords.current, passwords.new)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Password updated successfully' })
        setPasswords({ current: "", new: "", confirm: "" })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update password' })
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setMessage({ type: 'error', text: 'Failed to update password. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setLoading(true)
      try {
        const response = await fetch('/api/account/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (response.ok) {
          // Redirect to login page
          window.location.href = '/login'
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to delete account' })
        }
      } catch (error) {
        console.error("Error deleting account:", error)
        setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' })
      } finally {
        setLoading(false)
      }
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100) // Convert cents to dollars
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password Change */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                      placeholder="Enter your current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      placeholder="Enter your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      placeholder="Confirm your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handlePasswordChange}
                  disabled={loading || !passwords.current || !passwords.new || !passwords.confirm}
                  className="w-full bg-transparent border-0 ring-2 ring-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:!text-white transition-colors"
                >
                  <Key className="h-4 w-4 mr-2" />
                  {loading ? "Changing Password..." : "Change Password"}
                </Button>
              </div>

              <Separator />



              {/* Login Sessions */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Active Sessions</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage your active login sessions
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.email} • {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                      </p>
                    </div>
                    <Badge className="bg-muted-foreground">Current</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing & Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscriptionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : subscription ? (
                <>
                  {/* Current Plan */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{subscription.plan.name} Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        Next billing: {formatDate(subscription.current_period_end)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(
                          subscription.billing_cycle === 'monthly' 
                            ? subscription.plan.price_monthly 
                            : subscription.plan.price_yearly,
                          subscription.plan.currency
                        )}
                        /{subscription.billing_cycle === 'monthly' ? 'month' : 'year'}
                      </p>
                      <Badge className="bg-muted-foreground">
                        {subscription.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button asChild className="bg-transparent border-0 ring-2 ring-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:!text-white transition-colors">
                      <Link href="/dashboard/settings/subscription">
                        Manage Subscription
                      </Link>
                    </Button>
                    <Button className="bg-transparent border-0 ring-2 ring-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:!text-white transition-colors">
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoices
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active subscription found</p>
                  <Button asChild className="mt-4 bg-transparent border-0 ring-2 ring-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:!text-white transition-colors">
                    <Link href="/dashboard/settings/subscription">
                      View Subscription Options
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Data & Privacy
              </CardTitle>
              <CardDescription>
                Manage your data and privacy settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Export Your Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Download a copy of your data
                    </p>
                  </div>
                  <Button size="sm" className="bg-transparent border-0 ring-2 ring-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:!text-white transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button 
                    size="sm"
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Verified</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Two-Factor Auth</span>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Login</span>
                <span className="text-sm text-muted-foreground">
                  {user?.updated_at ? formatDate(user.updated_at) : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Member Since</span>
                <span className="text-sm text-muted-foreground">
                  {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm text-muted-foreground">{user?.name || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <p className="text-sm text-muted-foreground">{user?.role || 'User'}</p>
              </div>
              {user?.company && (
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p className="text-sm text-muted-foreground">{user.company.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Security Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <AlertDescription className="text-sm">
                  Enable two-factor authentication for enhanced security
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertDescription className="text-sm">
                  Use a strong, unique password for your account
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertDescription className="text-sm">
                  Regularly review your active sessions
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 