-- Drop triggers
DROP TRIGGER IF EXISTS update_payroll_settings_updated_at ON payroll_settings;
DROP TRIGGER IF EXISTS update_payment_schedules_updated_at ON payment_schedules;
DROP TRIGGER IF EXISTS update_deduction_rules_updated_at ON deduction_rules;

-- Drop tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS deduction_rules;
DROP TABLE IF EXISTS payroll_settings;
DROP TABLE IF EXISTS payment_schedules;

-- Drop enum types
DROP TYPE IF EXISTS pay_period_type;
DROP TYPE IF EXISTS day_type; 