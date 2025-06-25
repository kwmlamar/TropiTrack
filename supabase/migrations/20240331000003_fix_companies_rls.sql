-- Fix companies table RLS policies to allow trigger-based company creation
-- This ensures that the handle_new_user trigger can create companies for new OAuth users

-- Enable RLS on companies table if not already enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "System can insert companies" ON companies;

-- Policy to allow users to view their own company
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy to allow users to update their own company
CREATE POLICY "Users can update their own company" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy to allow system/trigger to insert companies
-- This is crucial for the handle_new_user trigger to work
CREATE POLICY "System can insert companies" ON companies
  FOR INSERT WITH CHECK (true);

-- Grant necessary permissions for the trigger function
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON companies TO authenticated;
GRANT ALL ON profiles TO authenticated; 