-- Revert companies table RLS policies
-- This removes the policies that were added to fix trigger-based company creation

-- Drop the policies we created
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "System can insert companies" ON companies;

-- Note: We don't disable RLS as it might have been enabled for other reasons
-- If you need to disable RLS, run: ALTER TABLE companies DISABLE ROW LEVEL SECURITY; 