-- Create recent projects table
CREATE TABLE IF NOT EXISTS recent_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE (user_id, project_id)
);

-- Create index for faster lookups
CREATE INDEX recent_projects_user_id_idx ON recent_projects(user_id);
CREATE INDEX recent_projects_company_id_idx ON recent_projects(company_id);

-- Add function to update last_accessed timestamp
CREATE OR REPLACE FUNCTION update_recent_project()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete old entries if more than 5 for this user
    DELETE FROM recent_projects
    WHERE user_id = NEW.user_id
    AND id NOT IN (
        SELECT id
        FROM recent_projects
        WHERE user_id = NEW.user_id
        ORDER BY last_accessed DESC
        LIMIT 4
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain recent projects list
CREATE TRIGGER maintain_recent_projects
AFTER INSERT ON recent_projects
FOR EACH ROW
EXECUTE FUNCTION update_recent_project(); 