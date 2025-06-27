-- Add missing RLS policies and helper function
-- This migration only adds policies that don't already exist

-- ============================================================================
-- HELPER FUNCTION TO GET USER'S COMPANY ID
-- ============================================================================
-- Create a function that can safely get the user's company_id without RLS recursion
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- PROFILES TABLE - Add missing policies
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- System can insert profiles (for OAuth triggers)
CREATE POLICY IF NOT EXISTS "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- WORKERS TABLE - Add missing policies
-- ============================================================================
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Users can view workers in their company
CREATE POLICY IF NOT EXISTS "Users can view company workers" ON workers
  FOR SELECT USING (company_id = get_user_company_id());

-- Users can insert workers in their company
CREATE POLICY IF NOT EXISTS "Users can insert company workers" ON workers
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- Users can update workers in their company
CREATE POLICY IF NOT EXISTS "Users can update company workers" ON workers
  FOR UPDATE USING (company_id = get_user_company_id());

-- Users can delete workers in their company
CREATE POLICY IF NOT EXISTS "Users can delete company workers" ON workers
  FOR DELETE USING (company_id = get_user_company_id());

-- ============================================================================
-- CLIENTS TABLE - Add missing policies
-- ============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Users can view clients in their company
CREATE POLICY IF NOT EXISTS "Users can view company clients" ON clients
  FOR SELECT USING (company_id = get_user_company_id());

-- Users can insert clients in their company
CREATE POLICY IF NOT EXISTS "Users can insert company clients" ON clients
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- Users can update clients in their company
CREATE POLICY IF NOT EXISTS "Users can update company clients" ON clients
  FOR UPDATE USING (company_id = get_user_company_id());

-- Users can delete clients in their company
CREATE POLICY IF NOT EXISTS "Users can delete company clients" ON clients
  FOR DELETE USING (company_id = get_user_company_id());

-- ============================================================================
-- PROJECTS TABLE - Add missing policies
-- ============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can view projects in their company
CREATE POLICY IF NOT EXISTS "Users can view company projects" ON projects
  FOR SELECT USING (company_id = get_user_company_id());

-- Users can insert projects in their company
CREATE POLICY IF NOT EXISTS "Users can insert company projects" ON projects
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- Users can update projects in their company
CREATE POLICY IF NOT EXISTS "Users can update company projects" ON projects
  FOR UPDATE USING (company_id = get_user_company_id());

-- Users can delete projects in their company
CREATE POLICY IF NOT EXISTS "Users can delete company projects" ON projects
  FOR DELETE USING (company_id = get_user_company_id());

-- ============================================================================
-- PROJECT_ASSIGNMENTS TABLE - Add missing policies
-- ============================================================================
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view project assignments for projects in their company
CREATE POLICY IF NOT EXISTS "Users can view company project assignments" ON project_assignments
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.company_id = get_user_company_id()
    )
  );

-- Users can insert project assignments for projects in their company
CREATE POLICY IF NOT EXISTS "Users can insert company project assignments" ON project_assignments
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.company_id = get_user_company_id()
    )
  );

-- Users can update project assignments for projects in their company
CREATE POLICY IF NOT EXISTS "Users can update company project assignments" ON project_assignments
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.company_id = get_user_company_id()
    )
  );

-- Users can delete project assignments for projects in their company
CREATE POLICY IF NOT EXISTS "Users can delete company project assignments" ON project_assignments
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.company_id = get_user_company_id()
    )
  );

-- ============================================================================
-- TIMESHEETS TABLE - Add missing policies
-- ============================================================================
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Users can view timesheets in their company
CREATE POLICY IF NOT EXISTS "Users can view company timesheets" ON timesheets
  FOR SELECT USING (company_id = get_user_company_id());

-- Users can insert timesheets in their company
CREATE POLICY IF NOT EXISTS "Users can insert company timesheets" ON timesheets
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- Users can update timesheets in their company
CREATE POLICY IF NOT EXISTS "Users can update company timesheets" ON timesheets
  FOR UPDATE USING (company_id = get_user_company_id());

-- Users can delete timesheets in their company
CREATE POLICY IF NOT EXISTS "Users can delete company timesheets" ON timesheets
  FOR DELETE USING (company_id = get_user_company_id());

-- ============================================================================
-- PAYROLL TABLE - Add missing policies
-- ============================================================================
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- Users can view payroll records in their company
CREATE POLICY IF NOT EXISTS "Users can view company payroll" ON payroll
  FOR SELECT USING (company_id = get_user_company_id());

-- Users can insert payroll records in their company
CREATE POLICY IF NOT EXISTS "Users can insert company payroll" ON payroll
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- Users can update payroll records in their company
CREATE POLICY IF NOT EXISTS "Users can update company payroll" ON payroll
  FOR UPDATE USING (company_id = get_user_company_id());

-- Users can delete payroll records in their company
CREATE POLICY IF NOT EXISTS "Users can delete company payroll" ON payroll
  FOR DELETE USING (company_id = get_user_company_id());

-- ============================================================================
-- RECENT_PROJECTS TABLE - Add missing policies
-- ============================================================================
ALTER TABLE recent_projects ENABLE ROW LEVEL SECURITY;

-- Users can view their own recent projects
CREATE POLICY IF NOT EXISTS "Users can view own recent projects" ON recent_projects
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own recent projects
CREATE POLICY IF NOT EXISTS "Users can insert own recent projects" ON recent_projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own recent projects
CREATE POLICY IF NOT EXISTS "Users can update own recent projects" ON recent_projects
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own recent projects
CREATE POLICY IF NOT EXISTS "Users can delete own recent projects" ON recent_projects
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- INVITES TABLE - Add missing policies
-- ============================================================================
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites for their company
CREATE POLICY IF NOT EXISTS "Users can view company invites" ON invites
  FOR SELECT USING (company_id = get_user_company_id());

-- Users can insert invites for their company
CREATE POLICY IF NOT EXISTS "Users can insert company invites" ON invites
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- Users can update invites for their company
CREATE POLICY IF NOT EXISTS "Users can update company invites" ON invites
  FOR UPDATE USING (company_id = get_user_company_id());

-- Users can delete invites for their company
CREATE POLICY IF NOT EXISTS "Users can delete company invites" ON invites
  FOR DELETE USING (company_id = get_user_company_id());

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant necessary permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON companies TO authenticated;
GRANT ALL ON workers TO authenticated;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON projects TO authenticated;
GRANT ALL ON project_assignments TO authenticated;
GRANT ALL ON timesheets TO authenticated;
GRANT ALL ON payroll TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON payroll_settings TO authenticated;
GRANT ALL ON payment_schedules TO authenticated;
GRANT ALL ON deduction_rules TO authenticated;
GRANT ALL ON project_documents TO authenticated;
GRANT ALL ON project_files TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON recent_projects TO authenticated;
GRANT ALL ON invites TO authenticated; 