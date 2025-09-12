"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  MapPin, 
  Save,
  Edit,
  Trash2
} from "lucide-react"
import { toast } from "sonner"
import { getProjectLocations, createProjectLocation, deleteProjectLocation } from "@/lib/data/qr-clock"
import { getProject } from "@/lib/data/projects"
import { getProfile } from "@/lib/data/data"
import type { ProjectLocation, NewProjectLocation } from "@/lib/types/qr-clock"
import type { Project } from "@/lib/types/project"
import { LocationMap } from "@/components/ui/location-map"

interface ProjectLocationsSectionProps {
  projectId: string
  userId: string
}

export function ProjectLocationsSection({ projectId, userId }: ProjectLocationsSectionProps) {
  const [location, setLocation] = useState<ProjectLocation | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    radius_meters: "50"
  })

  useEffect(() => {
    loadData()
  }, [projectId, loadData])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load project data
      const profile = await getProfile(userId)
      const projectResponse = await getProject(profile.company_id, projectId)
      if (projectResponse.success && projectResponse.data) {
        setProject(projectResponse.data)
      }

      // Load existing location
      const result = await getProjectLocations(profile.company_id)
      if (result.success && result.data) {
        // Get the first location for this project
        const projectLocation = result.data.find(loc => loc.project_id === projectId)
        setLocation(projectLocation || null)
        
        if (projectLocation) {
          setSelectedCoordinates({
            lat: projectLocation.latitude || 0,
            lng: projectLocation.longitude || 0
          })
        }
      } else {
        toast.error("Failed to load project location")
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load project data")
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedCoordinates({ lat, lng })
  }

  const handleSetLocation = () => {
    if (!selectedCoordinates) {
      toast.error("Please select a location on the map first")
      return
    }
    
    // Auto-populate form with project data
    const projectName = project?.name || ""
    const projectLocation = project?.location || ""
    
    setFormData({
      name: projectName ? `${projectName} Location` : "",
      description: project?.description || "",
      address: projectLocation,
      radius_meters: "50"
    })
    
    setDialogOpen(true)
  }

  const handleSaveLocation = async () => {
    if (!selectedCoordinates || !formData.name) {
      toast.error("Please provide a location name")
      return
    }

    try {
      const locationData: NewProjectLocation = {
        project_id: projectId,
        name: formData.name,
        description: formData.description || undefined,
        address: formData.address || undefined,
        latitude: selectedCoordinates.lat,
        longitude: selectedCoordinates.lng,
        radius_meters: parseInt(formData.radius_meters) || 50
      }

      if (location) {
        // TODO: Implement update functionality
        toast.success("Location updated successfully")
      } else {
        const result = await createProjectLocation(userId, locationData)
        if (result.success && result.data) {
          toast.success("Project location created successfully")
          setLocation(result.data)
        } else {
          toast.error(result.error || "Failed to create project location")
        }
      }
      
      setDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Error saving location:", error)
      toast.error("Failed to save project location")
    }
  }

  const handleDeleteLocation = async () => {
    if (!location) return

    if (!confirm("Are you sure you want to delete this location? This will also remove any associated QR codes.")) {
      return
    }

    try {
      const result = await deleteProjectLocation(userId, location.id)
      if (result.success) {
        toast.success("Project location deleted successfully")
        setLocation(null)
        setSelectedCoordinates(null)
        setFormData({ name: "", description: "", address: "", radius_meters: "50" })
      } else {
        toast.error(result.error || "Failed to delete project location")
      }
    } catch (error) {
      console.error("Error deleting location:", error)
      toast.error("Failed to delete project location")
    }
  }

  const openEditDialog = () => {
    if (location) {
      setFormData({
        name: location.name,
        description: location.description || "",
        address: location.address || "",
        radius_meters: (location.radius_meters || 50).toString()
      })
      setSelectedCoordinates({
        lat: location.latitude || 0,
        lng: location.longitude || 0
      })
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    if (location) {
      setFormData({
        name: location.name,
        description: location.description || "",
        address: location.address || "",
        radius_meters: (location.radius_meters || 50).toString()
      })
      setSelectedCoordinates({
        lat: location.latitude || 0,
        lng: location.longitude || 0
      })
    } else {
      setFormData({ name: "", description: "", address: "", radius_meters: "50" })
      setSelectedCoordinates(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading location...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Location</h3>
          <p className="text-sm text-gray-500">
            Click on the map to select a location, then click &quot;Set Location&quot; to configure it
          </p>
        </div>
        <div className="flex gap-2">
          {location ? (
            <>
              <Button variant="outline" onClick={openEditDialog}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Location
              </Button>
              <Button variant="outline" onClick={handleDeleteLocation}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleSetLocation}
              disabled={!selectedCoordinates}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Set Location
            </Button>
          )}
        </div>
      </div>

      {/* Map */}
      <LocationMap
        onLocationSelect={handleLocationSelect}
        className="h-96 w-full"
        existingLocations={location ? [location] : []}
        initialLat={selectedCoordinates?.lat}
        initialLng={selectedCoordinates?.lng}
      />

      {/* Location Details */}
      {location && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Location Name</Label>
                <p className="text-sm mt-1">{location.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Scan Range</Label>
                <p className="text-sm mt-1">{location.radius_meters || 50}m radius</p>
              </div>
            </div>
            
            {location.description && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <p className="text-sm mt-1">{location.description}</p>
              </div>
            )}
            
            {location.address && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Address</Label>
                <p className="text-sm mt-1">{location.address}</p>
              </div>
            )}
            
            {location.latitude && location.longitude && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Coordinates</Label>
                <p className="text-sm mt-1">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Location State */}
      {!location && (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No project location set</h3>
            <p className="text-gray-500 mb-4">
              Click on the map above to select a location, then click &quot;Set Location&quot; to configure it
            </p>
          </CardContent>
        </Card>
      )}

      {/* Location Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {location ? "Edit Project Location" : "Set Project Location"}
            </DialogTitle>
            <DialogDescription>
              Configure the details for your project location
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="location-name">Location Name *</Label>
              <Input
                id="location-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Entrance, Site Office"
              />
            </div>
            
            <div>
              <Label htmlFor="location-radius">Scan Range (meters)</Label>
              <Input
                id="location-radius"
                type="number"
                min="10"
                max="1000"
                value={formData.radius_meters}
                onChange={(e) => setFormData({ ...formData, radius_meters: e.target.value })}
                placeholder="50"
              />
            </div>
            
            <div>
              <Label htmlFor="location-description">Description (Optional)</Label>
              <Textarea
                id="location-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about this location"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="location-address">Address (Optional)</Label>
              <Input
                id="location-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street, Nassau, Bahamas"
              />
            </div>

            {selectedCoordinates && (
              <div className="text-sm text-gray-500 bg-muted/50 p-2 rounded">
                <strong>Selected coordinates:</strong> {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveLocation}
              disabled={!formData.name}
            >
              <Save className="h-4 w-4 mr-2" />
              {location ? "Update Location" : "Save Location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 