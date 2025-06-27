-- Revert the additional company fields
-- Remove indexes
DROP INDEX IF EXISTS idx_companies_industry;
DROP INDEX IF EXISTS idx_companies_country;

-- Remove columns from companies table
ALTER TABLE companies 
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state,
DROP COLUMN IF EXISTS zip_code,
DROP COLUMN IF EXISTS country,
DROP COLUMN IF EXISTS website,
DROP COLUMN IF EXISTS tax_id,
DROP COLUMN IF EXISTS business_number,
DROP COLUMN IF EXISTS industry,
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS logo_url; 