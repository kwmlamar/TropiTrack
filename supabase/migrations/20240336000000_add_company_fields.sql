-- Add additional fields to companies table for comprehensive company information
-- This migration adds fields for phone, address, website, tax info, etc.

-- Add new columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS business_number TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);

-- Add comments for documentation
COMMENT ON COLUMN companies.phone IS 'Company phone number';
COMMENT ON COLUMN companies.address IS 'Company street address';
COMMENT ON COLUMN companies.city IS 'Company city';
COMMENT ON COLUMN companies.state IS 'Company state/province';
COMMENT ON COLUMN companies.zip_code IS 'Company ZIP/postal code';
COMMENT ON COLUMN companies.country IS 'Company country';
COMMENT ON COLUMN companies.website IS 'Company website URL';
COMMENT ON COLUMN companies.tax_id IS 'Company tax ID or EIN';
COMMENT ON COLUMN companies.business_number IS 'Company business registration number';
COMMENT ON COLUMN companies.industry IS 'Company industry/sector';
COMMENT ON COLUMN companies.description IS 'Company description';
COMMENT ON COLUMN companies.logo_url IS 'Company logo URL'; 