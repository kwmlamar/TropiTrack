-- Drop biometric_templates table
-- Migration: 20250102000000_create_biometric_templates.down.sql

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_update_biometric_templates_updated_at ON biometric_templates;

-- Drop the function
DROP FUNCTION IF EXISTS update_biometric_templates_updated_at();

-- Drop the table (this will also drop all indexes and policies)
DROP TABLE IF EXISTS biometric_templates; 