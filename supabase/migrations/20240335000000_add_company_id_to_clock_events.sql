-- Migration to add company_id column to existing clock_events table
-- This migration handles the case where clock_events table already exists

-- Add company_id column to existing clock_events table
ALTER TABLE clock_events ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add index for company_id for better performance
CREATE INDEX IF NOT EXISTS idx_clock_events_company_id ON clock_events(company_id);

-- Update existing clock_events to set company_id based on worker's company
-- This ensures all existing records have the correct company_id
UPDATE clock_events 
SET company_id = w.company_id 
FROM workers w 
WHERE clock_events.worker_id = w.id 
AND clock_events.company_id IS NULL;

-- Make company_id NOT NULL after populating existing records
-- This ensures data integrity going forward
ALTER TABLE clock_events ALTER COLUMN company_id SET NOT NULL;

-- Drop existing RLS policies that use complex joins
DROP POLICY IF EXISTS "Users can view clock events for their company" ON clock_events;
DROP POLICY IF EXISTS "Users can insert clock events for their company" ON clock_events;

-- Create new simplified RLS policies using company_id directly
CREATE POLICY "Users can view clock events for their company" ON clock_events
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert clock events for their company" ON clock_events
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- Add comment to document the change
COMMENT ON COLUMN clock_events.company_id IS 'Direct reference to company for better performance and simplified RLS policies'; 