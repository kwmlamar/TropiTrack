-- Create leads table for storing lead capture form submissions
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  source TEXT DEFAULT 'landing_page',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Add RLS policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read leads (for admin purposes)
CREATE POLICY "Allow authenticated users to read leads" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow anyone to insert leads (for the landing page form)
CREATE POLICY "Allow anyone to insert leads" ON leads
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update leads
CREATE POLICY "Allow authenticated users to update leads" ON leads
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
