-- Create enum types for pay period and day types
CREATE TYPE pay_period_type AS ENUM ('weekly', 'bi-weekly', 'monthly', 'custom');
CREATE TYPE day_type AS ENUM ('day_of_month', 'day_of_week');

-- Create payroll settings table
CREATE TABLE IF NOT EXISTS payroll_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    default_pay_period_type pay_period_type NOT NULL DEFAULT 'bi-weekly',
    overtime_rate DECIMAL(4,2) NOT NULL DEFAULT 1.5,
    default_nib_rate DECIMAL(5,2) NOT NULL DEFAULT 4.65,
    pay_schedule_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE (company_id)
);

-- Create payment schedules table
CREATE TABLE IF NOT EXISTS payment_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    pay_period_type pay_period_type NOT NULL DEFAULT 'bi-weekly',
    pay_day INTEGER NOT NULL CHECK (pay_day BETWEEN 1 AND 31),
    pay_day_type day_type NOT NULL DEFAULT 'day_of_week',
    period_start_day INTEGER NOT NULL CHECK (period_start_day BETWEEN 1 AND 31),
    period_start_type day_type NOT NULL DEFAULT 'day_of_week',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE (company_id)
);

-- Create deduction rules table
CREATE TABLE IF NOT EXISTS deduction_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    applies_to_overtime BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add foreign key constraint to link payroll settings with payment schedules
ALTER TABLE payroll_settings
ADD CONSTRAINT fk_payroll_settings_payment_schedule
FOREIGN KEY (pay_schedule_id) REFERENCES payment_schedules(id)
ON DELETE SET NULL;

-- Create RLS policies
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE deduction_rules ENABLE ROW LEVEL SECURITY;

-- Policies for payroll_settings
CREATE POLICY "Users can view their company's payroll settings"
ON payroll_settings FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM user_profiles
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their company's payroll settings"
ON payroll_settings FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM user_profiles
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their company's payroll settings"
ON payroll_settings FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM user_profiles
        WHERE user_id = auth.uid()
    )
);

-- Policies for payment_schedules
CREATE POLICY "Users can view their company's payment schedules"
ON payment_schedules FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM user_profiles
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their company's payment schedules"
ON payment_schedules FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM user_profiles
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their company's payment schedules"
ON payment_schedules FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM user_profiles
        WHERE user_id = auth.uid()
    )
);

-- Policies for deduction_rules
CREATE POLICY "Users can view their company's deduction rules"
ON deduction_rules FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM user_profiles
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their company's deduction rules"
ON deduction_rules FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM user_profiles
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their company's deduction rules"
ON deduction_rules FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM user_profiles
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their company's deduction rules"
ON deduction_rules FOR DELETE
USING (
    company_id IN (
        SELECT company_id FROM user_profiles
        WHERE user_id = auth.uid()
    )
);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payroll_settings_updated_at
    BEFORE UPDATE ON payroll_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_schedules_updated_at
    BEFORE UPDATE ON payment_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deduction_rules_updated_at
    BEFORE UPDATE ON deduction_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 