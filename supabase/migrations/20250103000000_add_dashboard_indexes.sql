-- Add indexes for dashboard queries to improve performance
-- These indexes will significantly speed up dashboard data loading

-- Timesheets table indexes
CREATE INDEX IF NOT EXISTS idx_timesheets_company_date ON timesheets(company_id, date);
CREATE INDEX IF NOT EXISTS idx_timesheets_company_worker ON timesheets(company_id, worker_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_company_project ON timesheets(company_id, project_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_approval_status ON timesheets(company_id, supervisor_approval);
-- Removed partial index with CURRENT_DATE as it requires IMMUTABLE function

-- Workers table indexes
CREATE INDEX IF NOT EXISTS idx_workers_company_active ON workers(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_workers_company_role ON workers(company_id, role);
CREATE INDEX IF NOT EXISTS idx_workers_created_by ON workers(company_id, created_by);

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_company_active ON projects(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_projects_company_status ON projects(company_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_company_priority ON projects(company_id, priority);

-- Project assignments table indexes
CREATE INDEX IF NOT EXISTS idx_project_assignments_company ON project_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_worker ON project_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_active ON project_assignments(company_id, is_active);

-- Clock events table indexes
CREATE INDEX IF NOT EXISTS idx_clock_events_company_worker ON clock_events(company_id, worker_id);
CREATE INDEX IF NOT EXISTS idx_clock_events_event_time ON clock_events(company_id, event_time);
CREATE INDEX IF NOT EXISTS idx_clock_events_event_type ON clock_events(company_id, event_type);

-- Add comments to explain the purpose of each index
COMMENT ON INDEX idx_timesheets_company_date IS 'Index for dashboard timesheet queries by company and date';
COMMENT ON INDEX idx_timesheets_company_worker IS 'Index for worker-specific timesheet queries';
COMMENT ON INDEX idx_timesheets_company_project IS 'Index for project-specific timesheet queries';
COMMENT ON INDEX idx_timesheets_approval_status IS 'Index for approval status filtering';
COMMENT ON INDEX idx_timesheets_date_range IS 'Partial index for recent timesheet queries';

COMMENT ON INDEX idx_workers_company_active IS 'Index for active workers queries';
COMMENT ON INDEX idx_workers_company_role IS 'Index for role-based worker queries';
COMMENT ON INDEX idx_workers_created_by IS 'Index for worker creation tracking';

COMMENT ON INDEX idx_projects_company_active IS 'Index for active projects queries';
COMMENT ON INDEX idx_projects_company_status IS 'Index for project status filtering';
COMMENT ON INDEX idx_projects_company_priority IS 'Index for project priority filtering';

COMMENT ON INDEX idx_project_assignments_company IS 'Index for company project assignments';
COMMENT ON INDEX idx_project_assignments_project IS 'Index for project-specific assignments';
COMMENT ON INDEX idx_project_assignments_worker IS 'Index for worker-specific assignments';
COMMENT ON INDEX idx_project_assignments_active IS 'Index for active project assignments';

COMMENT ON INDEX idx_clock_events_company_worker IS 'Index for worker clock events';
COMMENT ON INDEX idx_clock_events_event_time IS 'Index for time-based clock event queries';
COMMENT ON INDEX idx_clock_events_event_type IS 'Index for clock event type filtering'; 