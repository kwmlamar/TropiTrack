"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  QrCode, 
  Plus, 
  Download, 
  Copy, 
  Clock,
  MapPin,
  Edit,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { getQRCodes, getProjectLocations } from "@/lib/data/qr-clock"
import { getProfile } from "@/lib/data/data"
import { getProjects } from "@/lib/data/projects"
import { getWorkers } from "@/lib/data/workers"
import type { QRCode, ProjectLocation } from "@/lib/types/qr-clock"
import type { Project } from "@/lib/types/project"
import type { Worker } from "@/lib/types/worker"
import QRCodeGenerator from 'qrcode'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { GenerateTimesheetsDialog } from "./generate-timesheets-dialog"

interface QRCodeManagerProps {
  userId: string
}

export function QRCodeManager({ userId }: QRCodeManagerProps) {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([])
  const [projectLocations, setProjectLocations] = useState<ProjectLocation[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [generateTimesheetsOpen, setGenerateTimesheetsOpen] = useState(false)
  const [qrCodeImages, setQrCodeImages] = useState<Record<string, string>>({})
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedQRCode, setSelectedQRCode] = useState<QRCode | null>(null)
  const [largeQRCodeImage, setLargeQRCodeImage] = useState<string | null>(null)

  // Simplified form state - just location and name
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    project_location_id: "",
  })

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    project_location_id: "",
    is_active: true,
  })

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadData = async () => {
    setLoading(true)
    try {
      // Get user's company ID from profile
      const profile = await getProfile(userId)
      const companyId = profile.company_id
      
      const [qrCodesResult, locationsResult, projectsResult, workersResult] = await Promise.all([
        getQRCodes(companyId),
        getProjectLocations(companyId),
        getProjects(userId),
        getWorkers(userId)
      ])

      if (qrCodesResult.success) {
        const codes = qrCodesResult.data || []
        setQRCodes(codes)
        
        // Generate QR code images for preview
        const images: Record<string, string> = {}
        for (const qrCode of codes) {
          try {
            const url = `${window.location.origin}/qr-scan/${qrCode.code_hash}`
            const qrDataUrl = await QRCodeGenerator.toDataURL(url, {
              width: 150,
              margin: 1,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            })
            images[qrCode.id] = qrDataUrl
          } catch (error) {
            console.error("Error generating QR preview for", qrCode.id, error)
          }
        }
        setQrCodeImages(images)
      }
      
      if (locationsResult.success) setProjectLocations(locationsResult.data || [])
      if (projectsResult.success) setProjects(projectsResult.data || [])
      if (workersResult.success) setWorkers(workersResult.data || [])
    } catch (error) {
      console.error("Error loading QR code data:", error)
      toast.error("Failed to load QR codes")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQRCode = async () => {
    try {
      const response = await fetch("/api/qr-clock/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("QR code created successfully")
        setCreateDialogOpen(false)
        setFormData({
          name: "",
          description: "",
          project_location_id: "",
        })
        
        // Reload data to get the new QR code
        await loadData()
      } else {
        console.error("QR code creation failed:", result)
        toast.error(result.message || result.details || "Failed to create QR code")
      }
    } catch (error) {
      console.error("Error creating QR code:", error)
      toast.error("Failed to create QR code")
    }
  }

  const handleEditQRCode = async () => {
    if (!selectedQRCode) return

    try {
      const response = await fetch("/api/qr-clock/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrCodeId: selectedQRCode.id,
          updates: editFormData,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("QR code updated successfully")
        setEditDialogOpen(false)
        setEditFormData({
          name: "",
          description: "",
          project_location_id: "",
          is_active: true,
        })
        setSelectedQRCode(null)
        
        // Reload data to get the updated QR code
        await loadData()
      } else {
        console.error("QR code update failed:", result)
        toast.error(result.message || "Failed to update QR code")
      }
    } catch (error) {
      console.error("Error updating QR code:", error)
      toast.error("Failed to update QR code")
    }
  }

  const openEditDialog = (qrCode: QRCode) => {
    setSelectedQRCode(qrCode)
    setEditFormData({
      name: qrCode.name,
      description: qrCode.description || "",
      project_location_id: qrCode.project_location_id,
      is_active: qrCode.is_active,
    })
    setEditDialogOpen(true)
  }

  const copyQRCodeUrl = (qrCode: QRCode) => {
    const url = `${window.location.origin}/qr-scan/${qrCode.code_hash}`
    navigator.clipboard.writeText(url)
    toast.success("QR code URL copied to clipboard")
  }

  const downloadQRCode = async (qrCode: QRCode) => {
    try {
      const url = `${window.location.origin}/qr-scan/${qrCode.code_hash}`
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCodeGenerator.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      // Create a temporary link to download the QR code
      const link = document.createElement("a")
      link.href = qrDataUrl
      link.download = `${qrCode.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success("QR code image downloaded")
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast.error("Failed to generate QR code image")
    }
  }

  const openQRPreview = async (qrCode: QRCode) => {
    setSelectedQRCode(qrCode)
    setPreviewModalOpen(true)
    
    // Generate larger QR code for preview
    const largeImage = await getLargeQRCode(qrCode)
    setLargeQRCodeImage(largeImage)
  }

  const getLargeQRCode = async (qrCode: QRCode) => {
    try {
      const url = `${window.location.origin}/qr-scan/${qrCode.code_hash}`
      return await QRCodeGenerator.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    } catch (error) {
      console.error("Error generating large QR code:", error)
      return null
    }
  }

  const handleToggleActive = async (qrCode: QRCode, checked: boolean) => {
    try {
      const response = await fetch("/api/qr-clock/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrCodeId: qrCode.id,
          updates: {
            is_active: checked,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("QR code status updated successfully")
        setEditDialogOpen(false)
        setSelectedQRCode(null)
        
        // Reload data to get the updated QR code
        await loadData()
      } else {
        console.error("QR code status update failed:", result)
        toast.error(result.message || "Failed to update QR code status")
      }
    } catch (error) {
      console.error("Error updating QR code status:", error)
      toast.error("Failed to update QR code status")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading QR codes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">QR Code Management</h1>
          <p className="text-gray-500">
            Create QR codes for workers to clock in/out at project locations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setGenerateTimesheetsOpen(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Timesheets
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Create New QR Code</DialogTitle>
                <DialogDescription>
                  Create a QR code for workers to scan and automatically clock in/out
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Entrance, Site Office, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional details about this location"
                  />
                </div>
                <div>
                  <Label htmlFor="project_location">Project Location</Label>
                  <Select
                    value={formData.project_location_id}
                    onValueChange={(value) => setFormData({ ...formData, project_location_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project location" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQRCode} disabled={!formData.name || !formData.project_location_id}>
                  Create QR Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrCodes
          .sort((a, b) => {
            // Sort by active status first (active first), then by creation date (newest first)
            if (a.is_active !== b.is_active) {
              return a.is_active ? -1 : 1;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .map((qrCode) => (
          <Card key={qrCode.id} className={`relative ${!qrCode.is_active ? 'opacity-60 bg-muted/50' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className={`text-lg ${!qrCode.is_active ? 'text-gray-500' : ''}`}>
                    {qrCode.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Active</span>
                    <Switch
                      checked={qrCode.is_active}
                      onCheckedChange={(checked) => handleToggleActive(qrCode, checked)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Preview */}
              <div className="flex justify-center">
                {qrCodeImages[qrCode.id] ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Image 
                          src={qrCodeImages[qrCode.id]} 
                          alt={`QR Code for ${qrCode.name}`}
                          width={128}
                          height={128}
                          className={`w-32 h-32 border rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${
                            !qrCode.is_active ? 'grayscale opacity-50' : ''
                          }`}
                          onClick={() => openQRPreview(qrCode)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to view larger preview</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div className={`w-32 h-32 border rounded-lg flex items-center justify-center bg-muted ${
                    !qrCode.is_active ? 'opacity-50' : ''
                  }`}>
                    <QrCode className="h-8 w-8 text-gray-500" />
                  </div>
                )}
              </div>

              {qrCode.description && (
                <p className="text-sm text-gray-500">{qrCode.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Location:</span>
                  <span>{qrCode.project_location?.name || 'Unknown'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Auto:</span>
                  <span>Clock In/Out</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyQRCodeUrl(qrCode)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadQRCode(qrCode)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(qrCode)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {qrCodes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <QrCode className="h-12 w-12 mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No QR codes yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first QR code to enable simple clock in/out for workers
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create QR Code
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {previewModalOpen && selectedQRCode && (
        <Dialog open={previewModalOpen} onOpenChange={(open) => {
          setPreviewModalOpen(open)
          if (!open) {
            setLargeQRCodeImage(null)
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedQRCode.name}</DialogTitle>
              <DialogDescription>
                QR Code Preview - Workers scan this to automatically clock in/out
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center">
              {largeQRCodeImage ? (
                <Image 
                  src={largeQRCodeImage} 
                  alt={`QR Code for ${selectedQRCode.name}`}
                  width={256}
                  height={256}
                  className="w-64 h-64 border rounded-lg"
                />
              ) : (
                <div className="w-64 h-64 border rounded-lg flex items-center justify-center bg-muted">
                  <QrCode className="h-8 w-8 text-gray-500" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>
                Close
              </Button>
              {selectedQRCode && (
                <Button 
                  onClick={() => downloadQRCode(selectedQRCode)}
                  disabled={!largeQRCodeImage}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit QR Code</DialogTitle>
            <DialogDescription>
              Update the QR code details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Location Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., Main Entrance, Site Office, etc."
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Additional details about this location"
              />
            </div>
            <div>
              <Label htmlFor="edit-project-location">Project Location</Label>
              <Select
                value={editFormData.project_location_id}
                onValueChange={(value) => setEditFormData({ ...editFormData, project_location_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project location" />
                </SelectTrigger>
                <SelectContent>
                  {projectLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-active">Active Status</Label>
                <p className="text-sm text-gray-500">
                  {editFormData.is_active ? "QR code is active and can be scanned" : "QR code is inactive and cannot be scanned"}
                </p>
              </div>
              <Switch
                id="edit-active"
                checked={editFormData.is_active}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditQRCode} disabled={!editFormData.name || !editFormData.project_location_id}>
              Update QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Timesheets Dialog */}
      <GenerateTimesheetsDialog
        open={generateTimesheetsOpen}
        onOpenChange={setGenerateTimesheetsOpen}
        projects={projects}
        workers={workers}
        onSuccess={() => {
          // Optionally refresh data or show success message
          toast.success("Timesheets generated successfully!")
        }}
      />
    </div>
  )
} 