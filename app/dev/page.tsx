"use client";

// import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  Users, 
  CreditCard, 
  Settings, 
  Bug,
  ExternalLink,
  Code,
  Server,
  Shield,
  QrCode,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

const DEV_CATEGORIES = [
  {
    id: 'auth',
    title: 'Authentication & Users',
    description: 'Test user flows, signup, login, and authentication',
    icon: Shield,
    color: 'bg-blue-500',
    tools: [
      { name: 'Test Auth', path: '/test-auth', description: 'Authentication testing' },
      { name: 'Test Signup', path: '/test-signup', description: 'User signup flow' },
      { name: 'Test Signup Debug', path: '/test-signup-debug', description: 'Signup debugging' },
      { name: 'Test OAuth', path: '/test-oauth', description: 'OAuth integration' },
      { name: 'Debug OAuth', path: '/debug-oauth', description: 'OAuth debugging' },
    ]
  },
  {
    id: 'onboarding',
    title: 'Onboarding & Setup',
    description: 'Test company setup and user onboarding flows',
    icon: Users,
    color: 'bg-green-500',
    tools: [
      { name: 'Test Onboarding', path: '/test-onboarding', description: 'Main onboarding flow' },
      { name: 'Test Onboarding Components', path: '/test-onboarding-components', description: 'Onboarding UI components' },
      { name: 'Test Onboarding Database', path: '/test-onboarding-database', description: 'Database setup' },
      { name: 'Test Onboarding Flow', path: '/test-onboarding-flow', description: 'Complete flow testing' },
      { name: 'Test Onboarding State', path: '/test-onboarding-state', description: 'State management' },
      { name: 'Test Company Setup Skip', path: '/test-company-setup-skip', description: 'Skip company setup' },
      { name: 'Test Company Overlay', path: '/test-company-overlay', description: 'Company overlay UI' },
    ]
  },
  {
    id: 'payroll',
    title: 'Payroll & Time Tracking',
    description: 'Test payroll calculations, time logs, and approvals',
    icon: CreditCard,
    color: 'bg-purple-500',
    tools: [
      { name: 'Test Payroll', path: '/test-payroll', description: 'Payroll calculations' },
      { name: 'Test Time Logs', path: '/test-time-logs', description: 'Time tracking' },
      { name: 'Test Timesheet', path: '/test-timesheet', description: 'Timesheet management' },
      { name: 'Test Timesheets Step', path: '/test-timesheets-step', description: 'Timesheet workflow' },
      { name: 'Test Approvals', path: '/test-approvals', description: 'Approval system' },
      { name: 'Test Unapprove Timesheet', path: '/test-unapprove-timesheet', description: 'Timesheet unapproval' },
      { name: 'Test Auto Clockout', path: '/test-auto-clockout', description: 'Automatic clockout' },
    ]
  },
  {
    id: 'qr-system',
    title: 'QR Code System',
    description: 'Test QR code generation, scanning, and biometric verification',
    icon: QrCode,
    color: 'bg-orange-500',
    tools: [
      { name: 'QR Scan', path: '/qr-scan', description: 'QR code scanning' },
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard & UI',
    description: 'Test dashboard components and user interface',
    icon: BarChart3,
    color: 'bg-indigo-500',
    tools: [
      { name: 'Test Dashboard Overlay', path: '/test-dashboard-overlay', description: 'Dashboard overlays' },
      { name: 'Test Full Viewport', path: '/test-full-viewport', description: 'Full viewport testing' },
      { name: 'Test Company Overlay', path: '/test-company-overlay', description: 'Company overlay' },
    ]
  },
  {
    id: 'completion',
    title: 'Smart Completion',
    description: 'Test smart completion features and strategies',
    icon: Code,
    color: 'bg-teal-500',
    tools: [
      { name: 'Test Smart Completion', path: '/test-smart-completion', description: 'Smart completion logic' },
      { name: 'Test All Smart Completion', path: '/test-all-smart-completion', description: 'All completion tests' },
      { name: 'Test Completion Strategies', path: '/test-completion-strategies', description: 'Completion strategies' },
      { name: 'Test Workers Completion', path: '/test-workers-completion', description: 'Workers completion' },
      { name: 'Test Workers Step', path: '/test-workers-step', description: 'Workers step testing' },
    ]
  },
  {
    id: 'subscription',
    title: 'Subscription & Billing',
    description: 'Test subscription flows, billing, and plan management',
    icon: CreditCard,
    color: 'bg-pink-500',
    tools: [
      { name: 'Test Subscription Debug', path: '/test-subscription-debug', description: 'Subscription debugging' },
      { name: 'Test Subscription Limits', path: '/test-subscription-limits', description: 'Plan limits testing' },
      { name: 'Checkout', path: '/checkout', description: 'Payment checkout' },
    ]
  },
  {
    id: 'system',
    title: 'System & Integration',
    description: 'Test system integrations, email, and external services',
    icon: Server,
    color: 'bg-gray-500',
    tools: [
      { name: 'Test Email', path: '/test-email', description: 'Email system testing' },
      { name: 'Test Connection', path: '/test-connection', description: 'Connection testing' },
      { name: 'Test Imports', path: '/test-imports', description: 'Import functionality' },
      { name: 'Test Error', path: '/test-error', description: 'Error handling' },
      { name: 'Test Hybrid Approach', path: '/test-hybrid-approach', description: 'Hybrid testing' },
    ]
  },
  {
    id: 'complete-flow',
    title: 'Complete Flow Testing',
    description: 'End-to-end testing of complete user journeys',
    icon: TestTube,
    color: 'bg-red-500',
    tools: [
      { name: 'Test Complete Flow', path: '/test-complete-flow', description: 'Complete user journey' },
      { name: 'Test Setup Guide', path: '/test-setup-guide', description: 'Setup guide testing' },
    ]
  }
];

const API_ENDPOINTS = [
  { name: 'Debug Environment', path: '/api/debug-env', description: 'Environment variables' },
  { name: 'Test Supabase', path: '/api/test-supabase', description: 'Database connection' },
  { name: 'Test Email', path: '/api/test-email', description: 'Email functionality' },
  { name: 'Test Storage', path: '/api/test-storage', description: 'File storage' },
  { name: 'Debug Subscription Plans', path: '/api/debug-subscription-plans', description: 'Subscription plans' },
  { name: 'Test Signup Minimal', path: '/api/test-signup-minimal', description: 'Minimal signup' },
  { name: 'Test Signup No Plan', path: '/api/test-signup-no-plan', description: 'Signup without plan' },
  { name: 'Test Trial Subscription', path: '/api/test-trial-subscription', description: 'Trial subscription' },
];

export default function DeveloperPortal() {
  // const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              The developer portal is only available in development mode.
            </p>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bug className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Developer Portal</h1>
              <p className="text-gray-600">Test and debug features in a controlled environment</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-600 border-green-200">
              Development Mode
            </Badge>
            <Badge variant="outline">
              {DEV_CATEGORIES.length} Categories
            </Badge>
            <Badge variant="outline">
              {DEV_CATEGORIES.reduce((acc, cat) => acc + cat.tools.length, 0)} Tools
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/dashboard">
                  <div className="text-center">
                    <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Dashboard</div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/api/debug-env" target="_blank">
                  <div className="text-center">
                    <Server className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Environment</div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/test-complete-flow">
                  <div className="text-center">
                    <TestTube className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Complete Flow</div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4">
                <Link href="/test-auth">
                  <div className="text-center">
                    <Shield className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Auth Test</div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DEV_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.tools.map((tool, index) => (
                      <Button
                        key={index}
                        asChild
                        variant="ghost"
                        className="w-full justify-start h-auto p-3"
                      >
                        <Link href={tool.path}>
                          <div className="flex items-center justify-between w-full">
                            <div className="text-left">
                              <div className="font-medium text-sm">{tool.name}</div>
                              <div className="text-xs text-gray-500">{tool.description}</div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        </Link>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* API Testing Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              API Testing
            </CardTitle>
            <p className="text-sm text-gray-600">
              Direct access to test API endpoints
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {API_ENDPOINTS.map((endpoint, index) => (
                <Button
                  key={index}
                  asChild
                  variant="outline"
                  className="h-auto p-3 justify-start"
                >
                  <Link href={endpoint.path} target="_blank">
                    <div className="flex items-center justify-between w-full">
                      <div className="text-left">
                        <div className="font-medium text-sm">{endpoint.name}</div>
                        <div className="text-xs text-gray-500">{endpoint.description}</div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Developer Portal - TropiTrack v1.0</p>
          <p className="mt-1">Only accessible in development mode</p>
        </div>
      </div>
    </div>
  );
}
