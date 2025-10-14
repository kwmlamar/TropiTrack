-- Create timesheet settings table
CREATE TABLE IF NOT EXISTS timesheet_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_day_start TIME DEFAULT '07:00:00',
    work_day_end TIME DEFAULT '16:00:00',
    break_time INTEGER DEFAULT 60, -- in minutes
    overtime_threshold INTEGER DEFAULT 40, -- in hours per week
    rounding_method VARCHAR(20) DEFAULT 'nearest_15' CHECK (rounding_method IN ('nearest_15', 'nearest_30', 'exact')),
    auto_clockout BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT false,
    allow_overtime BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE (company_id)
);

-- Enable RLS
ALTER TABLE timesheet_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company's timesheet settings"
ON timesheet_settings FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert their company's timesheet settings"
ON timesheet_settings FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update their company's timesheet settings"
ON timesheet_settings FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
);

-- Create function to get or create default timesheet settings
CREATE OR REPLACE FUNCTION get_or_create_timesheet_settings(p_company_id UUID)
RETURNS timesheet_settings AS $$
DECLARE
    result timesheet_settings;
BEGIN
    -- Try to get existing settings
    SELECT * INTO result
    FROM timesheet_settings
    WHERE company_id = p_company_id;
    
    -- If no settings exist, create default ones
    IF NOT FOUND THEN
        INSERT INTO timesheet_settings (company_id)
        VALUES (p_company_id)
        RETURNING * INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON TABLE timesheet_settings IS 'Company-specific timesheet configuration settings';
COMMENT ON COLUMN timesheet_settings.require_approval IS 'Whether timesheets require supervisor approval before being considered final';
