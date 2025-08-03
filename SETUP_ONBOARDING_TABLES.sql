-- Onboarding Progress Table Setup
-- Run this in your Supabase SQL Editor

-- Create onboarding progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate step completions
CREATE UNIQUE INDEX IF NOT EXISTS onboarding_progress_user_step_unique 
ON onboarding_progress(user_id, step_name);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS onboarding_progress_user_id_idx 
ON onboarding_progress(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress_updated_at();

-- Add onboarding columns to profiles table (if they don't exist)
DO $$ 
BEGIN
  -- Add onboarding_completed column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add onboarding_started_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'onboarding_started_at') THEN
    ALTER TABLE profiles ADD COLUMN onboarding_started_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add onboarding_completed_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'onboarding_completed_at') THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Insert some test data for development (commented out - will be created by real users)
-- INSERT INTO onboarding_progress (user_id, step_name, data) 
-- VALUES 
--   ('00000000-0000-0000-0000-000000000000', 'company-setup', '{"company_name": "Test Company"}'),
--   ('00000000-0000-0000-0000-000000000000', 'workers', '{}')
-- ON CONFLICT (user_id, step_name) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON onboarding_progress TO authenticated;
GRANT ALL ON onboarding_progress TO service_role;

-- Enable RLS (Row Level Security)
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own onboarding progress" ON onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress" ON onboarding_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress" ON onboarding_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding progress" ON onboarding_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can do everything (for admin functions)
CREATE POLICY "Service role can do everything" ON onboarding_progress
  FOR ALL USING (auth.role() = 'service_role'); 