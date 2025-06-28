-- Revert profile fields migration
-- Remove the additional fields added to profiles table

-- Drop the trigger and function
DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.update_profiles_updated_at();

-- Drop the index
DROP INDEX IF EXISTS idx_profiles_updated_at;

-- Remove the new columns
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS bio,
DROP COLUMN IF EXISTS location,
DROP COLUMN IF EXISTS website,
DROP COLUMN IF EXISTS avatar_url,
DROP COLUMN IF EXISTS updated_at;

-- Note: RLS policies will be recreated by other migrations if needed 