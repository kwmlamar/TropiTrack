"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  QrCode, 
  Clock, 
  MapPin, 
  User,
  CheckCircle,
  XCircle
} from "lucide-react"
import { QRScanner } from "./qr-scanner"
import type { QRCode as QRCodeType } from "@/lib/types/qr-clock"
import type { Worker as WorkerType } from "@/lib/types/worker"
import type { Project as ProjectType } from "@/lib/types/project"

interface QRScanPageProps {
  qrCode: QRCodeType
  workers: WorkerType[]
  projects: ProjectType[]
  userId: string
}

export function QRScanPage({ qrCode, workers, projects }: QRScanPageProps) {
  const [selectedWorker, setSelectedWorker] = useState<WorkerType | null>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectType | null>(null)
  const [scanning, setScanning] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; message: string; event?: { event_time: string; worker?: { name: string }; project?: { name: string }; project_location?: { name: string } } } | null>(null)

  const getQRTypeIcon = (type: string) => {
    switch (type) {
      case 'clock_in':
        return <Clock className="h-4 w-4 text-green-600" />
      case 'clock_out':
        return <Clock className="h-4 w-4 text-red-600" />
      case 'break_start':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'break_end':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <QrCode className="h-4 w-4" />
    }
  }

  const getQRTypeLabel = (type: string) => {
    switch (type) {
      case 'clock_in':
        return 'Clock In'
      case 'clock_out':
        return 'Clock Out'
      case 'break_start':
        return 'Break Start'
      case 'break_end':
        return 'Break End'
      default:
        return type
    }
  }

  const handleScanSuccess = (result: { success: boolean; message: string; event?: { event_time: string; worker?: { name: string }; project?: { name: string }; project_location?: { name: string } } }) => {
    setLastScanResult(result)
    setScanning(false)
  }

  const handleScanError = (error: string) => {
    console.error("Scan error:", error)
  }

  const canStartScanning = selectedWorker && selectedProject

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            {getQRTypeIcon(qrCode.qr_type)}
            <h1 className="text-3xl font-bold">QR Code Scanner</h1>
          </div>
          <p className="text-muted-foreground">
            Scan this QR code to {getQRTypeLabel(qrCode.qr_type).toLowerCase()}
          </p>
        </div>

        {/* QR Code Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="font-semibold">{qrCode.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <div className="flex items-center gap-2">
                  {getQRTypeIcon(qrCode.qr_type)}
                  <span className="font-semibold">{getQRTypeLabel(qrCode.qr_type)}</span>
                </div>
              </div>
              {qrCode.description && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{qrCode.description}</p>
                </div>
              )}
              {qrCode.project_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Location:</span>
                  <span className="font-medium">{qrCode.project_location.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Worker and Project Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Worker and Project
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Worker</label>
                <Select
                  value={selectedWorker?.id || ""}
                  onValueChange={(value) => {
                    const worker = workers.find(w => w.id === value)
                    setSelectedWorker(worker || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Project</label>
                <Select
                  value={selectedProject?.id || ""}
                  onValueChange={(value) => {
                    const project = projects.find(p => p.id === value)
                    setSelectedProject(project || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {canStartScanning && (
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => setScanning(true)}
                  size="lg"
                  className="px-8"
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  Start Scanning
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Scanner */}
        {scanning && selectedWorker && selectedProject && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QRScanner
                worker={selectedWorker}
                project={selectedProject}
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
              />
            </CardContent>
          </Card>
        )}

        {/* Last Scan Result */}
        {lastScanResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {lastScanResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Scan Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant={lastScanResult.success ? "default" : "destructive"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{lastScanResult.message}</p>
                    {lastScanResult.success && lastScanResult.event && (
                      <div className="text-sm text-muted-foreground">
                        <p>Time: {new Date(lastScanResult.event.event_time).toLocaleString()}</p>
                        <p>Worker: {lastScanResult.event.worker?.name}</p>
                        <p>Project: {lastScanResult.event.project?.name}</p>
                        {lastScanResult.event.project_location && (
                          <p>Location: {lastScanResult.event.project_location.name}</p>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Select Worker and Project</p>
                <p className="text-sm text-muted-foreground">
                  Choose your name from the worker list and select the project you&apos;re working on
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Start Scanning</p>
                <p className="text-sm text-muted-foreground">
                  Click &quot;Start Scanning&quot; to activate your device&apos;s camera
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Scan QR Code</p>
                <p className="text-sm text-muted-foreground">
                  Point your camera at the QR code to automatically clock in/out
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 