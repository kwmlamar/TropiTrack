"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Building2, 
  Users, 
  DollarSign, 
  FileText, 
  Settings,
  Globe,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { CompanyInformationForm } from "@/components/settings/company-information-form"
import { PayrollSettingsForm } from "@/components/settings/payroll/payroll-settings-form"
import { PaymentScheduleForm } from "@/components/settings/payroll/payment-schedule-form"
import { DeductionRulesForm } from "@/components/settings/payroll/deduction-rules-form"

export default function CompanySettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [company] = useState({
    name: "TropiTech Solutions",
    industry: "Construction",
    size: "50-100 employees",
    founded: "2020",
    status: "active"
  })

  const tabs = [
    { id: "general", label: "General", icon: Building2 },
    { id: "payroll", label: "Payroll", icon: DollarSign },
    { id: "workers", label: "Workers", icon: Users },
    { id: "compliance", label: "Compliance", icon: Shield },
  ]

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Company Name</span>
                <span className="text-sm font-medium">{company.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Industry</span>
                <span className="text-sm text-gray-500">{company.industry}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Company Size</span>
                <span className="text-sm text-gray-500">{company.size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Founded</span>
                <span className="text-sm text-gray-500">{company.founded}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                  {company.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Workers</span>
                <span className="text-sm font-medium">47</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Projects</span>
                <span className="text-sm font-medium">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">This Month Payroll</span>
                <span className="text-sm font-medium">$127,450</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Compliance Score</span>
                <Badge variant="default">98%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <CompanyInformationForm />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                  <CardDescription>
                    Additional business details and contact information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Address</label>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        123 Construction Ave, Miami, FL 33101
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="h-4 w-4" />
                        +1 (305) 555-0123
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="h-4 w-4" />
                        info@tropitech.com
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Hours</label>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        Mon-Fri 8AM-6PM
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents & Licenses
                  </CardTitle>
                  <CardDescription>
                    Manage business licenses and important documents.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Business License</p>
                      <p className="text-sm text-gray-500">Expires: Dec 31, 2024</p>
                    </div>
                    <Badge variant="default">Valid</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Insurance Certificate</p>
                      <p className="text-sm text-gray-500">Expires: Mar 15, 2025</p>
                    </div>
                    <Badge variant="default">Valid</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Tax ID Certificate</p>
                      <p className="text-sm text-gray-500">Expires: Never</p>
                    </div>
                    <Badge variant="default">Valid</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payroll Settings */}
          {activeTab === "payroll" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payroll Settings
                  </CardTitle>
                  <CardDescription>
                    Configure payroll settings and defaults.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PayrollSettingsForm />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Payment Schedule
                  </CardTitle>
                  <CardDescription>
                    Configure payment schedules and pay periods.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentScheduleForm />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Deductions
                  </CardTitle>
                  <CardDescription>
                    Configure standard deductions and calculations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DeductionRulesForm />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Workers Settings */}
          {activeTab === "workers" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Worker Management
                  </CardTitle>
                  <CardDescription>
                    Configure worker-related settings and defaults.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Pay Rate</label>
                      <div className="text-sm text-gray-500">$25.00/hour</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Overtime Rate</label>
                      <div className="text-sm text-gray-500">1.5x after 40 hours</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time Tracking</label>
                      <div className="text-sm text-gray-500">QR Code + Biometric</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Approval Required</label>
                      <div className="text-sm text-gray-500">Yes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Departments & Positions</CardTitle>
                  <CardDescription>
                    Manage departments and job positions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Departments</p>
                      <p className="text-sm text-gray-500">5 departments configured</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Job Positions</p>
                      <p className="text-sm text-gray-500">12 positions defined</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Compliance Settings */}
          {activeTab === "compliance" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Compliance Overview
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage compliance requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">98%</div>
                      <div className="text-sm text-gray-500">Overall Score</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">15</div>
                      <div className="text-sm text-gray-500">Requirements Met</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">1</div>
                      <div className="text-sm text-gray-500">Pending Review</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">OSHA Compliance</p>
                          <p className="text-sm text-gray-500">Last updated: 2 days ago</p>
                        </div>
                      </div>
                      <Badge variant="default">Compliant</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Labor Law Compliance</p>
                          <p className="text-sm text-gray-500">Last updated: 1 week ago</p>
                        </div>
                      </div>
                      <Badge variant="default">Compliant</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">Tax Filing</p>
                          <p className="text-sm text-gray-500">Due: March 15, 2024</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Reports</CardTitle>
                  <CardDescription>
                    Generate and download compliance reports.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    OSHA Safety Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Labor Law Compliance Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Tax Filing Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 