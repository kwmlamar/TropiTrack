"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  User, 
  MapPin,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface SecurityViolation {
  id: string
  worker_id: string
  violation_type: string
  description: string
  device_info?: Record<string, unknown>
  location_data?: Record<string, unknown>
  timestamp: string
  resolved: boolean
  worker?: {
    name: string
  }
}

export function SecurityMonitor() {
  const [violations, setViolations] = useState<SecurityViolation[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    today: 0
  })

  useEffect(() => {
    loadSecurityData()
  }, [])

  const loadSecurityData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/security/violations')
      const data = await response.json()
      
      if (data.success) {
        setViolations(data.violations || [])
        
        // Calculate stats
        const total = data.violations?.length || 0
        const resolved = data.violations?.filter((v: SecurityViolation) => v.resolved).length || 0
        const pending = total - resolved
        const today = data.violations?.filter((v: SecurityViolation) => {
          const today = new Date().toDateString()
          const violationDate = new Date(v.timestamp).toDateString()
          return today === violationDate
        }).length || 0
        
        setStats({ total, resolved, pending, today })
      }
    } catch (error) {
      console.error("Error loading security data:", error)
      toast.error("Failed to load security data")
    } finally {
      setLoading(false)
    }
  }

  const resolveViolation = async (violationId: string) => {
    try {
      const response = await fetch(`/api/security/violations/${violationId}/resolve`, {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success("Violation marked as resolved")
        loadSecurityData() // Reload data
      } else {
        toast.error(result.message || "Failed to resolve violation")
      }
    } catch (error) {
      console.error("Error resolving violation:", error)
      toast.error("Failed to resolve violation")
    }
  }

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'buddy_punching':
        return <User className="h-4 w-4 text-red-600" />
      case 'location_mismatch':
        return <MapPin className="h-4 w-4 text-orange-600" />
      case 'time_violation':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const getViolationColor = (type: string) => {
    switch (type) {
      case 'buddy_punching':
        return 'bg-red-50 border-red-200'
      case 'location_mismatch':
        return 'bg-orange-50 border-orange-200'
      case 'time_violation':
        return 'bg-yellow-50 border-yellow-200'
      case 'suspicious_activity':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading security data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Monitor</h1>
          <p className="text-gray-500">
            Monitor and manage security violations and potential buddy punching
          </p>
        </div>
        <Button onClick={loadSecurityData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Violations</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Today</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Violations List */}
      <Card>
        <CardHeader>
          <CardTitle>Security Violations</CardTitle>
        </CardHeader>
        <CardContent>
          {violations.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-gray-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No security violations</h3>
              <p className="text-gray-500">
                All systems are secure and no violations have been detected
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {violations.map((violation) => (
                <Card key={violation.id} className={`border ${getViolationColor(violation.violation_type)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getViolationIcon(violation.violation_type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">
                              {violation.worker?.name || 'Unknown Worker'}
                            </h4>
                            <Badge variant={violation.resolved ? "default" : "destructive"}>
                              {violation.resolved ? "Resolved" : "Pending"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {violation.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>
                              {new Date(violation.timestamp).toLocaleString()}
                            </span>
                            <span className="capitalize">
                              {violation.violation_type.replace('_', ' ')}
                            </span>
                          </div>
                          
                          {/* Device and Location Info */}
                          {(violation.device_info || violation.location_data) && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs font-medium text-gray-700 mb-1">Technical Details:</p>
                              {violation.device_info && (
                                <p className="text-xs text-gray-600">
                                  Device: {
                                    typeof violation.device_info.device_id === 'string' 
                                      ? violation.device_info.device_id 
                                      : 'Unknown'
                                  }
                                </p>
                              )}
                              {violation.location_data && (
                                <p className="text-xs text-gray-600">
                                  Location: {
                                    typeof violation.location_data.latitude === 'number' 
                                      ? violation.location_data.latitude.toFixed(4) 
                                      : 'Unknown'
                                  }, {
                                    typeof violation.location_data.longitude === 'number' 
                                      ? violation.location_data.longitude.toFixed(4) 
                                      : 'Unknown'
                                  }
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!violation.resolved && (
                        <Button
                          onClick={() => resolveViolation(violation.id)}
                          size="sm"
                          variant="outline"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Anti-Buddy Punching Measures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-700">Active Protections:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Biometric verification required</li>
                <li>• Location tracking and verification</li>
                <li>• Device fingerprinting</li>
                <li>• Time-based restrictions (6 AM - 6 PM)</li>
                <li>• Rapid event detection (30-second cooldown)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-700">Monitoring:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time violation detection</li>
                <li>• Suspicious activity alerts</li>
                <li>• Device usage tracking</li>
                <li>• Location anomaly detection</li>
                <li>• Automated violation logging</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 