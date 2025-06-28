"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Navigation, QrCode } from "lucide-react"
import { LocationMap } from "@/components/ui/location-map"
import type { ProjectLocation, NewProjectLocation } from "@/lib/types/qr-clock"

interface ProjectLocationFormProps {
  projectId: string
  location?: ProjectLocation
  onSubmit: (data: NewProjectLocation) => void
  onCancel: () => void
}

export function ProjectLocationForm({ 
  projectId, 
  location, 
  onSubmit, 
  onCancel 
}: ProjectLocationFormProps) {
  const [formData, setFormData] = useState({
    name: location?.name || "",
    description: location?.description || "",
    address: location?.address || "",
    latitude: location?.latitude || null as number | null,
    longitude: location?.longitude || null as number | null,
    radius_meters: location?.radius_meters?.toString() || "50"
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const locationData: NewProjectLocation = {
      project_id: projectId,
      name: formData.name,
      description: formData.description || undefined,
      address: formData.address || undefined,
      latitude: formData.latitude || undefined,
      longitude: formData.longitude || undefined,
      radius_meters: formData.radius_meters ? parseInt(formData.radius_meters) : 50
    }

    onSubmit(locationData)
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Location Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Main Entrance, Site Office, North Gate"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional details about this location"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="address">Address (Optional)</Label>
        <div className="relative">
          <Navigation className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Main Street, Nassau, Bahamas"
            className="pl-10"
          />
        </div>
      </div>

      {/* Map Location Selector */}
      <div>
        <Label>Location on Map</Label>
        <LocationMap
          onLocationSelect={handleLocationSelect}
          initialLat={formData.latitude || undefined}
          initialLng={formData.longitude || undefined}
          className="h-80 w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Click on the map to set the exact location, or use the &quot;Use Current&quot; button
        </p>
      </div>

      <div>
        <Label htmlFor="radius_meters">Scan Range (meters)</Label>
        <div className="relative">
          <QrCode className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="radius_meters"
            type="number"
            min="10"
            max="1000"
            value={formData.radius_meters}
            onChange={(e) => setFormData({ ...formData, radius_meters: e.target.value })}
            placeholder="50"
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Workers must be within this distance to successfully scan the QR code
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name} className="flex-1">
          {location ? "Update Location" : "Create Location"}
        </Button>
      </div>
    </form>
  )
} 