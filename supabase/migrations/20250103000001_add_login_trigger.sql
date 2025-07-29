-- Alternative: Add trigger to automatically update last_login_at
-- Migration: 20250103000001_add_login_trigger.sql

-- Create a function to handle login events
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_login_at when user logs in
  UPDATE public.profiles 
  SET last_login_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
-- Note: This is a conceptual example - Supabase doesn't provide direct triggers on auth events
-- In practice, you'd need to use Supabase's auth hooks or handle this in your application code

-- Alternative: Create a function that can be called from your application
CREATE OR REPLACE FUNCTION public.record_user_login(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.record_user_login(UUID) TO authenticated; 