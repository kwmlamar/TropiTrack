"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Users, 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import { getWorkers } from "@/lib/data/workers"
import { getWorkerPinStatus, resetWorkerPin } from "@/lib/data/worker-pins"
import { WorkerPinSetup } from "@/components/workers/worker-pin-setup"
import { WorkerConnection } from "@/components/workers/worker-connection"

interface Worker {
  id: string
  name: string
  email?: string
  phone?: string
  position: string
  department?: string
  is_active: boolean
  created_at: string
}

interface WorkerWithPinStatus extends Worker {
  pinStatus?: {
    hasPin: boolean
    pinSetAt?: string
    pinLastUsed?: string
    isLocked: boolean
    attempts: number
  }
}

export default function WorkerPinManagementPage() {
  const [workers, setWorkers] = useState<WorkerWithPinStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [showConnection, setShowConnection] = useState(false)

  useEffect(() => {
    loadWorkers()
  }, [])

  const loadWorkers = async () => {
    setIsLoading(true)
    try {
      // Get company ID from user context (you'll need to implement this)
      const companyId = "your-company-id" // Replace with actual company ID
      
      const result = await getWorkers(companyId, { is_active: true })
      if (result.success && result.data) {
        // Load PIN status for each worker
        const workersWithPinStatus = await Promise.all(
          result.data.map(async (worker) => {
            const pinResult = await getWorkerPinStatus(worker.id)
            return {
              ...worker,
              pinStatus: pinResult.success ? pinResult.data : undefined
            }
          })
        )
        setWorkers(workersWithPinStatus)
      }
    } catch (error) {
      console.error("Error loading workers:", error)
      toast.error("Failed to load workers")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetPin = (worker: Worker) => {
    setSelectedWorker(worker)
    setShowPinSetup(true)
  }

  const handleResetPin = async (workerId: string) => {
    try {
      const result = await resetWorkerPin("", workerId) // Empty userId for now
      if (result.success) {
        toast.success("PIN reset successfully")
        loadWorkers()
      } else {
        toast.error(result.error || "Failed to reset PIN")
      }
    } catch (error) {
      console.error("Error resetting PIN:", error)
      toast.error("Failed to reset PIN")
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  if (showPinSetup && selectedWorker) {
    return (
      <div className="container mx-auto py-6">
        <WorkerPinSetup
          workerId={selectedWorker.id}
          workerName={selectedWorker.name}
          onPinSet={() => {
            setShowPinSetup(false)
            setSelectedWorker(null)
            loadWorkers()
          }}
          onCancel={() => {
            setShowPinSetup(false)
            setSelectedWorker(null)
          }}
        />
      </div>
    )
  }

  if (showConnection) {
    return (
      <div className="container mx-auto py-6">
        <WorkerConnection
          companyId="your-company-id" // Replace with actual company ID
          onWorkerConnected={() => {
            setShowConnection(false)
            loadWorkers()
          }}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Worker PIN Management</h1>
          <p className="text-muted-foreground">
            Manage PINs for worker clock in/out verification
          </p>
        </div>
        <Button onClick={() => setShowConnection(true)}>
          <Users className="h-4 w-4 mr-2" />
          Connect Workers
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Workers</p>
                <p className="text-2xl font-bold">{workers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">PINs Set</p>
                <p className="text-2xl font-bold">
                  {workers.filter(w => w.pinStatus?.hasPin).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Locked PINs</p>
                <p className="text-2xl font-bold">
                  {workers.filter(w => w.pinStatus?.isLocked).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          <strong>How to set up worker PINs:</strong>
          <ol className="mt-2 space-y-1 text-sm">
            <li>1. Click &quot;Connect Workers&quot; to set up PINs for existing workers</li>
            <li>2. Or use the &quot;Set PIN&quot; button below for individual workers</li>
            <li>3. Workers will use their PINs to verify identity when clocking in/out</li>
            <li>4. PINs are secure and encrypted in the database</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Workers List */}
      <Card>
        <CardHeader>
          <CardTitle>Workers & PIN Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : workers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No workers found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workers.map((worker) => (
                <div key={worker.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{worker.name}</h3>
                      <Badge variant={worker.is_active ? "default" : "secondary"}>
                        {worker.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {worker.pinStatus?.hasPin ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          PIN Set
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          No PIN
                        </Badge>
                      )}
                      {worker.pinStatus?.isLocked && (
                        <Badge variant="destructive">Locked</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {worker.position} • {worker.department || "No department"}
                    </div>
                    
                    {worker.pinStatus?.hasPin && (
                      <div className="text-xs text-muted-foreground">
                        Set: {formatDate(worker.pinStatus.pinSetAt)} • 
                        Last used: {formatDate(worker.pinStatus.pinLastUsed)}
                        {worker.pinStatus.attempts > 0 && (
                          <span> • Failed attempts: {worker.pinStatus.attempts}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSetPin(worker)}
                    >
                      <Key className="h-4 w-4 mr-1" />
                      {worker.pinStatus?.hasPin ? "Update PIN" : "Set PIN"}
                    </Button>
                    
                    {worker.pinStatus?.hasPin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetPin(worker.id)}
                      >
                        Reset PIN
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
