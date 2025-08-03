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
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress_updated_at();

-- Add onboarding_completed column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add onboarding_started_at column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMP WITH TIME ZONE;

-- Add onboarding_completed_at column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE; 