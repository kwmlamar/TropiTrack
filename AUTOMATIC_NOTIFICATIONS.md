# Automatic Company-Wide Notifications

The TropiTrack application now includes an automatic company-wide notification system that triggers notifications for all users in a company when specific actions are performed.

## How It Works

### Database Triggers
The system uses PostgreSQL triggers to automatically create notifications when data changes in the database:

1. **Timesheet Triggers**: When timesheets are submitted, approved, or rejected
2. **Project Triggers**: When projects are created, completed, or put on hold
3. **Worker Triggers**: When workers are added, deactivated, or reactivated
4. **Client Triggers**: When clients are added or deactivated
5. **Payroll Triggers**: When payroll is generated

### Notification Flow
1. User performs an action (e.g., submits a timesheet)
2. Database trigger fires automatically
3. Trigger function creates notifications for all company users (except the user who performed the action)
4. Real-time subscriptions deliver notifications instantly to all connected users

## Database Functions

### Core Functions

#### `get_company_users_except(exclude_user_id, company_uuid)`
Returns all active users in a company except the specified user.

#### `create_company_notification(exclude_user_id, company_uuid, title, message, type, category, action_url, action_text, metadata)`
Creates notifications for all company users except the excluded user.

### Trigger Functions

#### `handle_timesheet_notification()`
- **INSERT**: Notifies when a timesheet is submitted
- **UPDATE**: Notifies when timesheet status changes (approved/rejected)

#### `handle_project_notification()`
- **INSERT**: Notifies when a new project is created
- **UPDATE**: Notifies when project status changes (completed/on hold)

#### `handle_worker_notification()`
- **INSERT**: Notifies when a new worker is added
- **UPDATE**: Notifies when worker status changes (activated/deactivated)

#### `handle_client_notification()`
- **INSERT**: Notifies when a new client is added
- **UPDATE**: Notifies when client is deactivated

#### `handle_payroll_notification()`
- **INSERT**: Notifies when payroll is generated

## Notification Types

### Timesheet Notifications
- **Submitted**: "John Doe submitted a timesheet for Beach Resort (8 hours on 2024-03-27)"
- **Approved**: "Timesheet for Beach Resort has been approved by Manager"
- **Rejected**: "Timesheet for Beach Resort has been rejected by Manager"

### Project Notifications
- **Created**: "Project 'Luxury Villa' has been created for Paradise Properties by John Smith"
- **Completed**: "Project 'Luxury Villa' has been marked as completed"
- **On Hold**: "Project 'Luxury Villa' has been put on hold"

### Worker Notifications
- **Added**: "Maria Rodriguez has been added to the team by John Smith"
- **Deactivated**: "Maria Rodriguez has been deactivated"
- **Reactivated**: "Maria Rodriguez has been reactivated"

### Client Notifications
- **Added**: "Client 'Sunset Properties' has been added by John Smith"
- **Deactivated**: "Client 'Sunset Properties' has been deactivated"

### Payroll Notifications
- **Generated**: "Payroll for Week of March 18-24 has been generated for 12 workers ($15,420.50)"

## Client-Side Utilities

### Company-Wide Notification Functions
The system includes client-side utility functions for manual company-wide notifications:

```typescript
// Create company-wide timesheet notification
await createTimesheetSubmittedNotificationCompanyWide({
  excludeUserId: user.id,
  companyId: company.id,
  workerName: 'John Doe',
  projectName: 'Beach Resort',
  hours: 8,
  date: '2024-03-27',
  actionUrl: '/dashboard/timesheets'
})

// Create company-wide project notification
await createProjectCreatedNotificationCompanyWide({
  excludeUserId: user.id,
  companyId: company.id,
  projectName: 'Luxury Villa',
  clientName: 'Paradise Properties',
  createdBy: 'John Smith',
  actionUrl: '/dashboard/projects'
})
```

## Testing

### Notification Test Panel
The application includes a comprehensive test panel with two tabs:

1. **Individual Notifications**: Create notifications for the current user only
2. **Company-Wide Notifications**: Create notifications for all company users

### Testing Different Scenarios
- Timesheet submissions and approvals
- Project creation and status changes
- Worker additions and status changes
- Client additions
- Payroll generation
- System maintenance notifications

## Real-Time Features

### Automatic Subscription
- Users automatically subscribe to their notifications on page load
- Real-time updates appear instantly without page refresh
- Unread count updates automatically

### Notification Management
- Mark individual notifications as read
- Mark all notifications as read
- Delete notifications
- Filter by category and read status

## Security

### Row Level Security (RLS)
- Users can only view their own notifications
- Users can only update their own notifications
- System can insert notifications for any user

### Company Isolation
- Notifications are scoped to company_id
- Users only receive notifications from their own company
- Cross-company data isolation is maintained

## Performance Considerations

### Database Indexes
- Optimized indexes on user_id, company_id, is_read, and created_at
- Composite indexes for common query patterns
- Efficient filtering and sorting

### Real-Time Optimization
- Selective subscriptions based on user_id
- Efficient payload structure
- Connection pooling and management

## Configuration

### Notification Settings
- Customizable notification types (info, success, warning, error)
- Configurable categories (timesheet, payroll, project, worker, client, system)
- Optional action URLs and button text
- Metadata support for additional context

### Company-Wide Settings
- Exclude specific users from company-wide notifications
- Filter by user activity status
- Configurable notification frequency

## Future Enhancements

### Planned Features
- Notification preferences per user
- Email notifications for important events
- Notification templates and customization
- Bulk notification management
- Notification analytics and reporting

### Integration Opportunities
- Slack/Teams integration
- Mobile push notifications
- Email digest summaries
- Custom webhook support 