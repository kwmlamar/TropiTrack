"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Building
} from "lucide-react"
import { toast } from "sonner"
import { getQRCodes, getProjectLocations } from "@/lib/data/qr-clock"
import { getProfile } from "@/lib/data/data"
import type { QRCode, ProjectLocation } from "@/lib/types/qr-clock"
import QRCodeGenerator from 'qrcode'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface QRCodeManagerProps {
  userId: string
}

export function QRCodeManager({ userId }: QRCodeManagerProps) {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([])
  const [projectLocations, setProjectLocations] = useState<ProjectLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Get user's company ID from profile
      const profile = await getProfile(userId)
      const companyId = profile.company_id
      
      const [qrCodesResult, locationsResult] = await Promise.all([
        getQRCodes(companyId),
        getProjectLocations(companyId)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-muted-foreground">
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Code Management</h1>
          <p className="text-muted-foreground">
            Create QR codes for workers to clock in/out at project locations
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create QR Code
            </Button>
          </DialogTrigger>
          <DialogContent>
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

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrCodes.map((qrCode) => (
          <Card key={qrCode.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-lg">{qrCode.name}</CardTitle>
                </div>
                <Badge variant={qrCode.is_active ? "default" : "secondary"}>
                  {qrCode.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Preview */}
              <div className="flex justify-center">
                {qrCodeImages[qrCode.id] ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <img 
                          src={qrCodeImages[qrCode.id]} 
                          alt={`QR Code for ${qrCode.name}`}
                          className="w-32 h-32 border rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openQRPreview(qrCode)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to view larger preview</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div className="w-32 h-32 border rounded-lg flex items-center justify-center bg-muted">
                    <QrCode className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {qrCode.description && (
                <p className="text-sm text-muted-foreground">{qrCode.description}</p>
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
            </CardContent>
          </Card>
        ))}
      </div>

      {qrCodes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No QR codes yet</h3>
            <p className="text-muted-foreground mb-4">
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
                <img 
                  src={largeQRCodeImage} 
                  alt={`QR Code for ${selectedQRCode.name}`}
                  className="w-64 h-64 border rounded-lg"
                />
              ) : (
                <div className="w-64 h-64 border rounded-lg flex items-center justify-center bg-muted">
                  <QrCode className="h-8 w-8 text-muted-foreground" />
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
    </div>
  )
} 