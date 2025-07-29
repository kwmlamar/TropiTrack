-- Add last_login_at column to profiles table
-- Migration: 20250103000000_add_last_login_at.sql

-- Add the last_login_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON profiles(last_login_at);

-- Add a comment to document the field
COMMENT ON COLUMN public.profiles.last_login_at IS 'Timestamp of user last login';

-- Create a function to update last_login_at
CREATE OR REPLACE FUNCTION public.update_user_last_login(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_last_login(UUID) TO authenticated; 