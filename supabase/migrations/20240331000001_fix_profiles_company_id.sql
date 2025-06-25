-- Fix profiles table to include company_id field
-- Add company_id column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add email column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Create index for company_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);

-- Update the trigger to include company_id and email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, created_at, name, email)
  VALUES (new.id, 'employee', now(), new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the payroll settings policies to use 'profiles' instead of 'user_profiles'
DROP POLICY IF EXISTS "Users can view their company's payroll settings" ON payroll_settings;
DROP POLICY IF EXISTS "Users can insert their company's payroll settings" ON payroll_settings;
DROP POLICY IF EXISTS "Users can update their company's payroll settings" ON payroll_settings;

CREATE POLICY "Users can view their company's payroll settings"
ON payroll_settings FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert their company's payroll settings"
ON payroll_settings FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update their company's payroll settings"
ON payroll_settings FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
);

-- Fix payment schedules policies
DROP POLICY IF EXISTS "Users can view their company's payment schedules" ON payment_schedules;
DROP POLICY IF EXISTS "Users can insert their company's payment schedules" ON payment_schedules;
DROP POLICY IF EXISTS "Users can update their company's payment schedules" ON payment_schedules;

CREATE POLICY "Users can view their company's payment schedules"
ON payment_schedules FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert their company's payment schedules"
ON payment_schedules FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update their company's payment schedules"
ON payment_schedules FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
);

-- Fix deduction rules policies
DROP POLICY IF EXISTS "Users can view their company's deduction rules" ON deduction_rules;
DROP POLICY IF EXISTS "Users can insert their company's deduction rules" ON deduction_rules;
DROP POLICY IF EXISTS "Users can update their company's deduction rules" ON deduction_rules;
DROP POLICY IF EXISTS "Users can delete their company's deduction rules" ON deduction_rules;

CREATE POLICY "Users can view their company's deduction rules"
ON deduction_rules FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert their company's deduction rules"
ON deduction_rules FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update their company's deduction rules"
ON deduction_rules FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete their company's deduction rules"
ON deduction_rules FOR DELETE
USING (
    company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
    )
); 