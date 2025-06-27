-- Revert the OAuth trigger changes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Revert permissions
REVOKE ALL ON companies FROM authenticated;
REVOKE ALL ON profiles FROM authenticated; 