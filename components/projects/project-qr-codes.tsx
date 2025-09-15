"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  QrCode, 
  Plus, 
  MapPin, 
  Users, 
  Download, 
  Trash2, 
  Copy,
  Eye
} from "lucide-react"
import { toast } from "sonner"
import { getQRCodes, createProjectLocation, generateQRCode, updateQRCode } from "@/lib/data/qr-clock"
import { getProfile } from "@/lib/data/data"
import Image from "next/image"

interface QRCode {
  id: string
  company_id: string
  project_location_id: string
  code_hash: string
  name: string
  description?: string
  qr_type: string
  is_active: boolean
  expires_at?: string
  created_by: string
  created_at: string
  updated_at: string
  project_location?: {
    id: string
    name: string
    description?: string
    project_id: string
  }
}

interface ProjectQRCodesProps {
  projectId: string
  userId: string
}

export function ProjectQRCodes({ projectId, userId }: ProjectQRCodesProps) {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newLocationName, setNewLocationName] = useState("")
  const [newLocationDescription, setNewLocationDescription] = useState("")
  const [viewingQRCode, setViewingQRCode] = useState<QRCode | null>(null)

  // Load existing QR codes
  const loadQRCodes = useCallback(async () => {
    try {
      setLoading(true)
      const profile = await getProfile(userId)
      if (!profile) {
        throw new Error('User profile not found')
      }
      
      const result = await getQRCodes(profile.company_id)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch QR codes')
      }
      
      // Filter QR codes for this project
      const projectQRCodes = result.data.filter(qrCode => 
        qrCode.project_location?.project_id === projectId
      )
      
      console.log('Loaded QR codes:', projectQRCodes)
      setQrCodes(projectQRCodes)
    } catch (error) {
      console.error('Error loading QR codes:', error)
      toast.error('Failed to load QR codes')
    } finally {
      setLoading(false)
    }
  }, [userId, projectId])

  // Generate new QR code
  const generateQRCodeHandler = async () => {
    if (!newLocationName.trim()) {
      toast.error('Location name is required')
      return
    }

    try {
      setIsGenerating(true)
      
      // First create a project location
      const locationResult = await createProjectLocation(userId, {
        project_id: projectId,
        name: newLocationName.trim(),
        description: newLocationDescription.trim() || null,
        address: null,
        latitude: null,
        longitude: null,
        radius_meters: 50
      })
      
      if (!locationResult.success || !locationResult.data) {
        throw new Error(locationResult.error || 'Failed to create project location')
      }
      
      // Then create a QR code for the location
      const qrResult = await generateQRCode(userId, {
        project_location_id: locationResult.data.id,
        name: newLocationName.trim(),
        description: newLocationDescription.trim() || null,
        qr_type: 'clock_in'
      })
      
      if (!qrResult.success || !qrResult.data) {
        throw new Error(qrResult.error || 'Failed to generate QR code')
      }
      
      // Add the new QR code to the list
      const newQRCode = {
        ...qrResult.data,
        project_location: {
          id: locationResult.data.id,
          name: locationResult.data.name,
          description: locationResult.data.description,
          project_id: locationResult.data.project_id
        }
      }
      
      setQrCodes(prev => [newQRCode, ...prev])
      setNewLocationName("")
      setNewLocationDescription("")
      setIsDialogOpen(false)
      toast.success('QR code generated successfully!')
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  // Delete QR code
  const deleteQRCode = async (qrCodeId: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return

    try {
      const response = await fetch(`/api/qr-clock/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCodeId,
          updates: { is_active: false }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete QR code')
      }

      setQrCodes(prev => prev.filter(qr => qr.id !== qrCodeId))
      toast.success('QR code deleted successfully')
    } catch (error) {
      console.error('Error deleting QR code:', error)
      toast.error('Failed to delete QR code')
    }
  }

  // Toggle QR code active status
  const toggleQRCodeStatus = async (qrCodeId: string, currentStatus: boolean) => {
    try {
      const result = await updateQRCode(userId, qrCodeId, {
        is_active: !currentStatus
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update QR code status')
      }

      setQrCodes(prev => prev.map(qr => 
        qr.id === qrCodeId ? { ...qr, is_active: !currentStatus } : qr
      ))
      toast.success(`QR code ${!currentStatus ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Error updating QR code status:', error)
      toast.error('Failed to update QR code status')
    }
  }

  // Copy QR code data to clipboard
  const copyQRData = (codeHash: string) => {
    navigator.clipboard.writeText(codeHash)
    toast.success('QR code data copied to clipboard')
  }

  // View QR code in modal
  const viewQRCode = (qrCode: QRCode) => {
    setViewingQRCode(qrCode)
  }

  // Download QR code as image
  const downloadQRCode = async (qrCode: QRCode) => {
    try {
      // Create QR code data URL
      const qrData = qrCode.code_hash
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`
      
      // Fetch the image as a blob
      const response = await fetch(qrUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch QR code image')
      }
      
      const blob = await response.blob()
      
      // Create object URL from blob
      const blobUrl = URL.createObjectURL(blob)
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${qrCode.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`
      
      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the object URL
      URL.revokeObjectURL(blobUrl)
      
      toast.success('QR code downloaded successfully!')
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Failed to download QR code')
    }
  }

  useEffect(() => {
    loadQRCodes()
  }, [loadQRCodes])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <QrCode className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Loading QR Codes</h3>
          <p className="text-gray-500">Please wait while we load the QR codes...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project QR Codes</h3>
          <p className="text-sm text-gray-500">
            Manage QR codes for worker clock-in/clock-out at project locations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Generate New QR Code</DialogTitle>
              <DialogDescription>
                Create a new QR code for a specific project location
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="location-name">Location Name *</Label>
                <Input
                  id="location-name"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="e.g., Main Entrance, Site Office, Work Area A"
                />
              </div>
              <div>
                <Label htmlFor="location-description">Location Description</Label>
                <Input
                  id="location-description"
                  value={newLocationDescription}
                  onChange={(e) => setNewLocationDescription(e.target.value)}
                  placeholder="Optional description of the location"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={generateQRCodeHandler} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate QR Code"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* QR Codes Table */}
      {qrCodes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <QrCode className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No QR Codes</h3>
            <p className="text-gray-500 mb-4">
              Generate your first QR code to enable worker clock-in/clock-out at project locations.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate QR Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-sidebar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 text-gray-500">Location</TableHead>
                <TableHead className="px-4 text-gray-500">Status</TableHead>
                <TableHead className="px-4 text-gray-500">Usage Count</TableHead>
                <TableHead className="px-4 text-gray-500">Last Used</TableHead>
                <TableHead className="px-4 text-gray-500">Created</TableHead>
                <TableHead className="px-4 text-gray-500 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qrCodes.filter(qrCode => qrCode && qrCode.id).map((qrCode) => (
                <TableRow key={qrCode.id}>
                  <TableCell className="px-4">
                    <div>
                      <div className="font-medium">{qrCode.name}</div>
                      {qrCode.description && (
                        <div className="text-sm text-gray-500">
                          {qrCode.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4">{getStatusBadge(qrCode.is_active)}</TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      0
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    Never
                  </TableCell>
                  <TableCell className="px-4">{formatDate(qrCode.created_at)}</TableCell>
                  <TableCell className="px-4 w-12">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyQRData(qrCode.code_hash)}
                        title="Copy QR data"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewQRCode(qrCode)}
                        title="View QR code"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleQRCodeStatus(qrCode.id, qrCode.is_active)}
                        title={qrCode.is_active ? "Deactivate" : "Activate"}
                      >
                        {qrCode.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQRCode(qrCode.id)}
                        title="Delete QR code"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use QR Codes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">1. Generate QR Code</h4>
                <p className="text-sm text-gray-500">
                  Create QR codes for specific project locations
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">2. Place at Location</h4>
                <p className="text-sm text-gray-500">
                  Print and place QR codes at designated project locations
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">3. Workers Scan</h4>
                <p className="text-sm text-gray-500">
                  Workers scan QR codes to clock in/out at specific locations
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code View Modal */}
      <Dialog open={!!viewingQRCode} onOpenChange={() => setViewingQRCode(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>QR Code: {viewingQRCode?.name}</DialogTitle>
            <DialogDescription>
              Scan this QR code with your mobile device to access the location.
            </DialogDescription>
          </DialogHeader>
          
          {viewingQRCode && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(viewingQRCode.code_hash)}`}
                  alt={`QR Code for ${viewingQRCode.name}`}
                  width={300}
                  height={300}
                  className="border rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Location:</span> {viewingQRCode.name}
                </div>
                {viewingQRCode.description && (
                  <div className="text-sm">
                    <span className="font-medium">Description:</span> {viewingQRCode.description}
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">QR Data:</span> 
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                    {viewingQRCode.code_hash}
                  </code>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => copyQRData(viewingQRCode.code_hash)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Data
                </Button>
                <Button
                  onClick={() => downloadQRCode(viewingQRCode)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
