-- Add GPS coordinates and radius to project_locations table
-- This migration adds precise location tracking for QR code scanning

-- Add new columns to project_locations table
ALTER TABLE project_locations 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS radius_meters INTEGER DEFAULT 50;

-- Add comments for documentation
COMMENT ON COLUMN project_locations.latitude IS 'GPS latitude coordinate for precise location tracking';
COMMENT ON COLUMN project_locations.longitude IS 'GPS longitude coordinate for precise location tracking';
COMMENT ON COLUMN project_locations.radius_meters IS 'Acceptable scanning radius in meters (default 50m)';

-- Add indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_project_locations_coordinates ON project_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_project_locations_radius ON project_locations(radius_meters); 