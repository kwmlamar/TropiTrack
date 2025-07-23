"use client"

import { useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, Circle } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapPin } from "lucide-react"

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Custom marker icon for selected location (red MapPin)
const selectedLocationIcon = new L.DivIcon({
  html: `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #f57373;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  className: "custom-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

// Custom marker icon for existing locations (blue MapPin)
const existingLocationIcon = new L.DivIcon({
  html: `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: #4a739c;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  className: "custom-marker",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

interface ProjectLocation {
  id: string
  name: string
  description?: string
  address?: string
  latitude?: number
  longitude?: number
  radius_meters?: number
}

interface LocationMapProps {
  onLocationSelect: (lat: number, lng: number) => void
  initialLat?: number
  initialLng?: number
  className?: string
  existingLocations?: ProjectLocation[]
  showRadius?: boolean
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onLocationSelect(lat, lng)
    },
  })
  
  return null
}

export function LocationMap({ 
  onLocationSelect, 
  initialLat, 
  initialLng, 
  className = "h-64 w-full",
  existingLocations = [],
  showRadius = true
}: LocationMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  )

  // Default center (Nassau, Bahamas)
  const defaultCenter: [number, number] = [25.0343, -77.3963]

  // Calculate map center based on existing locations or default
  const getMapCenter = (): [number, number] => {
    if (position) return position
    
    if (existingLocations.length > 0) {
      const validLocations = existingLocations.filter(loc => loc.latitude && loc.longitude)
      if (validLocations.length > 0) {
        const avgLat = validLocations.reduce((sum, loc) => sum + (loc.latitude || 0), 0) / validLocations.length
        const avgLng = validLocations.reduce((sum, loc) => sum + (loc.longitude || 0), 0) / validLocations.length
        return [avgLat, avgLng]
      }
    }
    
    return defaultCenter
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng])
    onLocationSelect(lat, lng)
  }

  return (
    <div className={`border rounded-lg overflow-hidden bg-background ${className}`}>
      <MapContainer
        center={getMapCenter()}
        zoom={position || existingLocations.length > 0 ? 14 : 10}
        className="h-full w-full"
        style={{ minHeight: "256px" }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onLocationSelect={handleLocationSelect} />
        
        {/* Show existing locations */}
        {existingLocations.map((location) => {
          if (location.latitude && location.longitude) {
            return (
              <div key={location.id}>
                <Marker 
                  position={[location.latitude, location.longitude]} 
                  icon={existingLocationIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <MapPin className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                      <p className="text-sm font-medium">{location.name}</p>
                      {location.description && (
                        <p className="text-xs text-gray-500 mb-1">{location.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {location.radius_meters || 50}m radius
                      </p>
                    </div>
                  </Popup>
                </Marker>
                {showRadius && location.radius_meters && (
                  <Circle
                    center={[location.latitude, location.longitude]}
                    radius={location.radius_meters}
                    pathOptions={{
                      color: '#4a739c',
                      fillColor: '#4a739c',
                      fillOpacity: 0.1,
                      weight: 2
                    }}
                  />
                )}
              </div>
            )
          }
          return null
        })}
        
        {/* Show selected location (if different from existing) */}
        {position && !existingLocations.some(loc => 
          loc.latitude === position[0] && loc.longitude === position[1]
        ) && (
          <div>
            <Marker position={position} icon={selectedLocationIcon}>
              <Popup>
                <div className="text-center">
                  <MapPin className="h-4 w-4 mx-auto mb-1 text-red-500" />
                  <p className="text-sm font-medium">Selected Location</p>
                  <p className="text-xs text-gray-500">
                    {position[0].toFixed(6)}, {position[1].toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
            {showRadius && (
              <Circle
                center={position}
                radius={50} // Default radius
                pathOptions={{
                  color: '#f57373',
                  fillColor: '#f57373',
                  fillOpacity: 0.1,
                  weight: 2
                }}
              />
            )}
          </div>
        )}
      </MapContainer>

      <style jsx global>{`
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-content {
          margin: 0.5rem;
          font-size: 0.875rem;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }
        .leaflet-control-zoom a {
          background: white !important;
          color: #374151 !important;
          border: 1px solid #e5e7eb !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f9fafb !important;
        }
        .leaflet-container {
          cursor: crosshair !important;
        }
        .leaflet-container.leaflet-grab {
          cursor: grab !important;
        }
        .leaflet-container.leaflet-grabbing {
          cursor: grabbing !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  )
} 