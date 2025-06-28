# Project Location System for QR Code Implementation

## Overview

The project location system allows construction companies to define specific physical locations where workers can scan QR codes to clock in/out. This system provides precise GPS-based location tracking with configurable radius settings to prevent buddy punching and ensure workers are actually at the job site.

## Key Features

### 1. **Streamlined Map Interface**
- **Always-visible map**: Map is directly on the project locations page
- **Quick add workflow**: Click "Add Location" to reveal form above map
- **Visual location selection**: Click anywhere on map to set precise locations
- **Current location detection**: One-click setup using device GPS
- **Existing location display**: See all project locations as markers on map

### 2. **GPS Coordinates & Radius**
- **Automatic coordinate capture**: GPS coordinates are captured from map selection
- **Radius (10-1000m)**: Configurable scanning range (default: 50m)
- **Real-time validation**: Workers must be within the specified radius to successfully scan

### 3. **Location Management**
- **Multiple locations per project**: Different entry points, work areas, etc.
- **Location names**: Human-readable names (e.g., "Main Entrance", "Site Office")
- **Address support**: Optional street addresses for reference
- **Description field**: Additional context about each location

### 4. **Security Features**
- **GPS validation**: Prevents remote scanning
- **Distance calculation**: Uses Haversine formula for accurate distance measurement
- **Configurable radius**: Adjustable based on site size and requirements
- **Real-time feedback**: Shows distance to workers when validation fails

## How to Set Up Project Locations

### Step 1: Access Project Locations
1. Navigate to your project details page
2. Click on the **"Locations"** tab
3. You'll see the map interface with existing locations

### Step 2: Add a New Location
1. Click **"Add Location"** button (top right)
2. A form appears above the map
3. **Click on the map** to select your desired location
4. Fill in the location details:
   - **Location Name** (required): e.g., "Main Entrance", "North Gate"
   - **Scan Range**: Radius in meters (10-1000m, default: 50m)
   - **Description** (optional): Additional context
   - **Address** (optional): Street address for reference
5. Click **"Save Location"** to create the location

### Step 3: Set Location on Map
You have two options for setting the location:

#### Option A: Click on Map
- **Navigate the map**: Use mouse/touch to pan and zoom
- **Click to place**: Click anywhere on the map to set the location
- **Red marker appears**: Shows your selected location
- **Coordinates displayed**: Exact latitude/longitude are shown below the form

#### Option B: Use Current Location
- **Click "Use Current"**: Automatically detects your current GPS location
- **Allow access**: Grant location permission when prompted
- **Location set**: Your current location is automatically placed on the map
- **Success message**: Confirmation that location was captured

### Step 4: Configure Scan Range
- **Small sites** (single building): 10-25m radius
- **Medium sites** (multiple buildings): 25-50m radius  
- **Large sites** (construction zones): 50-100m radius
- **Very large sites**: 100-1000m radius (use sparingly)

## Map Interface Features

### Visual Elements
- **Blue markers**: Existing project locations
- **Red marker**: Currently selected location for new entry
- **Interactive map**: Click anywhere to place new locations
- **Location popups**: Click markers to see location details

### Interactive Controls
- **Zoom in/out**: Use mouse wheel or zoom controls
- **Pan around**: Click and drag to move around the map
- **Search areas**: Navigate to any location worldwide
- **Street view**: Switch to satellite view for better context

### Workflow Benefits
- **Streamlined process**: No dialog boxes or separate forms
- **Visual context**: See all locations at once
- **Quick iteration**: Easy to adjust location placement
- **Immediate feedback**: See coordinates as you select

### Mobile Support
- **Touch-friendly**: Works perfectly on mobile devices
- **GPS integration**: Direct access to device location
- **Responsive design**: Adapts to different screen sizes
- **Offline capability**: Map tiles are cached for offline use

## QR Code Implementation

### How It Works
1. **Worker scans QR code** at a project location
2. **GPS coordinates** are captured from worker's device
3. **Distance calculation** compares worker location to project location
4. **Validation** ensures worker is within the specified radius
5. **Clock in/out** is processed if validation passes

### Security Benefits
- **Prevents remote scanning**: Workers must be physically present
- **Configurable security**: Adjust radius based on site requirements
- **Real-time feedback**: Workers see distance information
- **Audit trail**: All location data is logged for compliance

## Best Practices

### Location Placement
- **Entry/Exit points**: Place QR codes at main entrances
- **Work areas**: Add locations for different work zones
- **Security gates**: Include locations at security checkpoints
- **Break areas**: Consider locations near break rooms

### Map Usage Tips
- **Zoom in close**: Use high zoom levels for precise placement
- **Use satellite view**: Switch to satellite for better context
- **Test locations**: Use "Use Current" to verify accuracy
- **Multiple markers**: Add several locations for large sites
- **Visual planning**: Use map to plan optimal location placement

### Radius Settings
- **Start conservative**: Begin with 25-50m radius
- **Test and adjust**: Monitor usage and adjust as needed
- **Consider site layout**: Account for building structures
- **Balance security vs convenience**: Too small = false rejections, too large = security risk

### GPS Accuracy
- **Device quality**: Better devices provide more accurate GPS
- **Environmental factors**: Buildings, trees can affect accuracy
- **Weather conditions**: Cloud cover may impact GPS signal
- **Backup options**: Consider manual entry for problematic areas

## Technical Implementation

### Database Schema
```sql
CREATE TABLE project_locations (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius_meters INTEGER DEFAULT 50,
  qr_code_id UUID UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Map Technology
The system uses **Leaflet** with **OpenStreetMap** tiles:
- **Free and open source**: No API keys or usage limits
- **High performance**: Optimized for web and mobile
- **Rich features**: Zoom, pan, markers, popups
- **Mobile optimized**: Touch-friendly controls

### Location Validation
The system uses the Haversine formula to calculate the great-circle distance between two GPS coordinates:

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}
```

## Troubleshooting

### Common Issues

#### "Location validation failed"
- **Check GPS accuracy**: Ensure device has good GPS signal
- **Verify map placement**: Confirm location was set correctly on map
- **Adjust radius**: Consider increasing radius if too restrictive
- **Test location**: Use "Use Current Location" to verify accuracy

#### "Map not loading"
- **Check internet connection**: Map tiles require internet access
- **Browser compatibility**: Ensure browser supports modern web features
- **Clear cache**: Try refreshing the page or clearing browser cache
- **Try different browser**: Some browsers handle maps better than others

#### "Current location not working"
- **Check permissions**: Ensure location access is granted
- **HTTPS required**: GPS requires secure connection
- **Device GPS**: Make sure device GPS is enabled
- **Try manual placement**: Click on map as alternative

#### "QR code not found"
- **Check QR code**: Ensure QR code is properly generated and active
- **Verify project**: Confirm QR code is associated with correct project
- **Check permissions**: Ensure user has access to the project

### Support
For technical support or questions about the project location system, contact your system administrator or refer to the TropiTrack documentation.

## Future Enhancements

### Planned Features
- **Address search**: Type address to automatically place marker
- **Geofencing**: Advanced boundary definitions with custom shapes
- **Location analytics**: Usage patterns and optimization suggestions
- **Mobile app**: Dedicated mobile interface for location management
- **Offline support**: QR code scanning without internet connection
- **Satellite imagery**: High-resolution satellite view for precise placement
- **Location clustering**: Group nearby locations for better visualization

### Integration Possibilities
- **Weather data**: Adjust radius based on weather conditions
- **Site plans**: Import location data from CAD files
- **IoT sensors**: Integration with site sensors for enhanced validation
- **Biometric devices**: Additional security layers
- **3D mapping**: Three-dimensional location visualization 