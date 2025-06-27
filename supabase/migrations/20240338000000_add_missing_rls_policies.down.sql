-- Down migration to remove the missing RLS policies
-- This will drop the policies created in the up migration

-- ============================================================================
-- DROP HELPER FUNCTION
-- ============================================================================
DROP FUNCTION IF EXISTS get_user_company_id();

-- ============================================================================
-- DROP POLICIES
-- ============================================================================

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

-- Workers table policies
DROP POLICY IF EXISTS "Users can view company workers" ON workers;
DROP POLICY IF EXISTS "Users can insert company workers" ON workers;
DROP POLICY IF EXISTS "Users can update company workers" ON workers;
DROP POLICY IF EXISTS "Users can delete company workers" ON workers;

-- Clients table policies
DROP POLICY IF EXISTS "Users can view company clients" ON clients;
DROP POLICY IF EXISTS "Users can insert company clients" ON clients;
DROP POLICY IF EXISTS "Users can update company clients" ON clients;
DROP POLICY IF EXISTS "Users can delete company clients" ON clients;

-- Projects table policies
DROP POLICY IF EXISTS "Users can view company projects" ON projects;
DROP POLICY IF EXISTS "Users can insert company projects" ON projects;
DROP POLICY IF EXISTS "Users can update company projects" ON projects;
DROP POLICY IF EXISTS "Users can delete company projects" ON projects;

-- Project assignments table policies
DROP POLICY IF EXISTS "Users can view company project assignments" ON project_assignments;
DROP POLICY IF EXISTS "Users can insert company project assignments" ON project_assignments;
DROP POLICY IF EXISTS "Users can update company project assignments" ON project_assignments;
DROP POLICY IF EXISTS "Users can delete company project assignments" ON project_assignments;

-- Timesheets table policies
DROP POLICY IF EXISTS "Users can view company timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can insert company timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can update company timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can delete company timesheets" ON timesheets;

-- Payroll table policies
DROP POLICY IF EXISTS "Users can view company payroll" ON payroll;
DROP POLICY IF EXISTS "Users can insert company payroll" ON payroll;
DROP POLICY IF EXISTS "Users can update company payroll" ON payroll;
DROP POLICY IF EXISTS "Users can delete company payroll" ON payroll;

-- Recent projects table policies
DROP POLICY IF EXISTS "Users can view own recent projects" ON recent_projects;
DROP POLICY IF EXISTS "Users can insert own recent projects" ON recent_projects;
DROP POLICY IF EXISTS "Users can update own recent projects" ON recent_projects;
DROP POLICY IF EXISTS "Users can delete own recent projects" ON recent_projects;

-- Invites table policies
DROP POLICY IF EXISTS "Users can view company invites" ON invites;
DROP POLICY IF EXISTS "Users can insert company invites" ON invites;
DROP POLICY IF EXISTS "Users can update company invites" ON invites;
DROP POLICY IF EXISTS "Users can delete company invites" ON invites;

-- ============================================================================
-- DISABLE ROW LEVEL SECURITY (only for tables that didn't have RLS before)
-- ============================================================================
-- Note: We don't disable RLS for tables that already had it from previous migrations
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll DISABLE ROW LEVEL SECURITY;
ALTER TABLE recent_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE invites DISABLE ROW LEVEL SECURITY; 