-- Drop the trigger first
DROP TRIGGER IF EXISTS update_project_documents_updated_at ON project_documents;

-- Drop the function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop the table
DROP TABLE IF EXISTS project_documents; 