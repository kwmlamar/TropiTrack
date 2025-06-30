# Automatic Clock-Out Feature

## Overview

The automatic clock-out feature helps manage workers who forget to clock out at the end of their shift. Instead of leaving them clocked in indefinitely, the system automatically generates a clock-out event and creates a timesheet with a maximum hour limit to prevent over-billing.

## How It Works

### 1. Detection
- The system identifies all workers who are currently clocked in
- Uses the `get_clocked_in_workers` database function to find workers without matching clock-out events

### 2. Automatic Clock-Out Generation
- Creates automatic clock-out events for each worker still clocked in
- Marks these events as automatic with special device info
- Adds notes indicating the reason for auto-generation

### 3. Timesheet Generation with Limits
- Generates timesheets using the existing clock events plus the new auto clock-out
- **Limits total hours to a maximum (default: 8 hours)** to prevent over-billing
- Adds notes to the timesheet indicating it was auto-generated due to missing clock-out

## API Endpoints

### GET `/api/qr-clock/auto-clockout`
Check currently clocked-in workers for the authenticated user's company.

**Response:**
```json
{
  "success": true,
  "data": {
    "clockedInWorkers": [
      {
        "worker_id": "uuid",
        "worker_name": "John Doe",
        "project_id": "uuid",
        "project_name": "Project Alpha",
        "last_clock_in": "2025-06-30T08:00:00.000Z",
        "clock_in_event_id": "uuid"
      }
    ],
    "count": 1
  }
}
```

### POST `/api/qr-clock/auto-clockout`
Generate automatic clock-outs for workers who forgot to clock out.

**Request Body:**
```json
{
  "date": "2025-06-30",
  "maxHours": 8,
  "endOfDayTime": "17:00"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 2 workers",
  "data": {
    "processed": 2,
    "errors": []
  }
}
```

## Configuration Options

- **`date`**: The date for which to generate timesheets (YYYY-MM-DD format)
- **`maxHours`**: Maximum hours to allow (default: 8 hours)
- **`endOfDayTime`**: Reference time for end-of-day processing (default: 17:00)

## Database Function

### `get_clocked_in_workers(company_uuid UUID)`
Returns all workers who are currently clocked in for a company.

**Returns:**
- `worker_id`: Worker's UUID
- `worker_name`: Worker's name
- `project_id`: Project UUID
- `project_name`: Project name
- `last_clock_in`: Timestamp of last clock-in
- `clock_in_event_id`: UUID of the clock-in event

## Usage Examples

### Manual Trigger
```javascript
// Check for clocked-in workers
const response = await fetch('/api/qr-clock/auto-clockout')
const data = await response.json()

// Generate automatic clock-outs
const result = await fetch('/api/qr-clock/auto-clockout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2025-06-30',
    maxHours: 8,
    endOfDayTime: '17:00'
  })
})
```

### Automated via Cron Job
Set up a daily cron job to run at the end of each work day:

```bash
# Run at 6 PM daily
0 18 * * * curl -X POST https://your-domain.com/api/qr-clock/auto-clockout \
  -H "Content-Type: application/json" \
  -d '{"date":"$(date +%Y-%m-%d)","maxHours":8,"endOfDayTime":"17:00"}'
```

## Test Page

Visit `/test-auto-clockout` to test the functionality with a user interface.

## Benefits

1. **Prevents Over-Billing**: Limits hours to prevent excessive charges
2. **Ensures Payroll Completeness**: All workers get timesheets for payroll processing
3. **Maintains Data Integrity**: Properly closes clock sessions
4. **Audit Trail**: Clear notes indicate auto-generated events
5. **Configurable**: Adjustable maximum hours and timing

## Notes

- The feature respects existing timesheets (won't create duplicates)
- Automatic clock-out events are clearly marked in the database
- Timesheet notes indicate the limitation was applied
- The system handles multiple projects per worker correctly
- Error handling ensures partial failures don't stop the entire process

## Security

- Requires authentication
- Only processes workers from the authenticated user's company
- All operations are logged for audit purposes
- Database function uses SECURITY DEFINER for proper permissions 