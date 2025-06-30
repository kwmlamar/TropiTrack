-- Function to get all currently clocked-in workers for a company
CREATE OR REPLACE FUNCTION get_clocked_in_workers(company_uuid UUID)
RETURNS TABLE (
  worker_id UUID,
  worker_name TEXT,
  project_id UUID,
  project_name TEXT,
  last_clock_in TIMESTAMPTZ,
  clock_in_event_id UUID
) AS $$
BEGIN
  RETURN QUERY
  WITH worker_clock_status AS (
    SELECT 
      w.id as worker_id,
      w.name as worker_name,
      p.id as project_id,
      p.name as project_name,
      ce.event_time as last_clock_in,
      ce.id as clock_in_event_id,
      ROW_NUMBER() OVER (PARTITION BY w.id, p.id ORDER BY ce.event_time DESC) as rn
    FROM workers w
    JOIN clock_events ce ON w.id = ce.worker_id
    JOIN projects p ON ce.project_id = p.id
    WHERE w.company_id = company_uuid
      AND w.is_active = true
      AND ce.event_type = 'clock_in'
      AND ce.event_time = (
        SELECT MAX(ce2.event_time)
        FROM clock_events ce2
        WHERE ce2.worker_id = w.id 
          AND ce2.project_id = p.id
          AND ce2.event_type = 'clock_in'
      )
  ),
  worker_clock_out_status AS (
    SELECT 
      wcs.worker_id,
      wcs.project_id,
      MAX(ce.event_time) as last_clock_out
    FROM worker_clock_status wcs
    JOIN clock_events ce ON wcs.worker_id = ce.worker_id AND wcs.project_id = ce.project_id
    WHERE ce.event_type = 'clock_out'
      AND ce.event_time > wcs.last_clock_in
    GROUP BY wcs.worker_id, wcs.project_id
  )
  SELECT 
    wcs.worker_id,
    wcs.worker_name,
    wcs.project_id,
    wcs.project_name,
    wcs.last_clock_in,
    wcs.clock_in_event_id
  FROM worker_clock_status wcs
  LEFT JOIN worker_clock_out_status wcos ON wcs.worker_id = wcos.worker_id AND wcs.project_id = wcos.project_id
  WHERE wcs.rn = 1
    AND (wcos.last_clock_out IS NULL OR wcs.last_clock_in > wcos.last_clock_out);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_clocked_in_workers(UUID) TO authenticated; 