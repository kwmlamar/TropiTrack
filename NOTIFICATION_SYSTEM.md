# Notification System

The TropiTrack notification system provides real-time notifications with a comprehensive UI and backend infrastructure.

## Features

- **Real-time Updates**: Notifications appear instantly using Supabase real-time subscriptions
- **Multiple Types**: Support for info, success, warning, and error notifications
- **Categories**: Organized by general, timesheet, payroll, project, worker, client, and system
- **Action URLs**: Clickable notifications that can navigate to specific pages
- **Read/Unread Status**: Track notification state with visual indicators
- **Bulk Operations**: Mark all notifications as read
- **Filtering**: Filter by status and category
- **Responsive Design**: Works on desktop and mobile

## Database Schema

The notifications table includes:

```sql
- id: UUID (Primary Key)
- user_id: UUID (References auth.users)
- company_id: UUID (References companies)
- title: TEXT (Notification title)
- message: TEXT (Notification message)
- type: VARCHAR (info, success, warning, error)
- category: VARCHAR (general, timesheet, payroll, project, worker, client, system)
- is_read: BOOLEAN (Read status)
- action_url: TEXT (Optional URL to navigate to)
- action_text: VARCHAR (Optional button text)
- metadata: JSONB (Additional data)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Components

### NotificationBell
A bell icon with unread count badge that opens the notification panel.

### NotificationPanel
A dropdown panel showing recent notifications with actions to mark as read or delete.

### NotificationsPage
A full page for managing all notifications with filtering and bulk operations.

### NotificationTest
A development component for testing different notification types.

## Hooks

### useNotifications
A React hook that provides:

```typescript
const {
  notifications,        // Array of notifications
  unreadCount,         // Number of unread notifications
  loading,             // Loading state
  error,               // Error state
  fetchNotifications,  // Function to fetch notifications
  markAsRead,          // Mark single notification as read
  markAllAsRead,       // Mark all notifications as read
  removeNotification,  // Delete a notification
  createNotification,  // Create a new notification
  subscribe,           // Subscribe to real-time updates
  unsubscribe          // Unsubscribe from real-time updates
} = useNotifications(options)
```

## Usage Examples

### Creating Notifications

```typescript
import { createSystemNotification } from '@/lib/data/notifications'

// Create a simple notification
await createSystemNotification(
  userId,
  companyId,
  'Welcome!',
  'Welcome to TropiTrack!',
  'success',
  'general',
  '/dashboard',
  'Get Started'
)
```

### Using Helper Functions

```typescript
import { createTimesheetSubmittedNotification } from '@/lib/utils/notifications'

// Create a timesheet notification
await createTimesheetSubmittedNotification({
  userId: user.id,
  companyId: company.id,
  workerName: 'John Doe',
  projectName: 'Beach Resort',
  hours: 8,
  date: '2024-03-27',
  actionUrl: '/dashboard/timesheets'
})
```

### In React Components

```typescript
import { useNotifications } from '@/hooks/use-notifications'

function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  
  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      {notifications.map(notification => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          {notification.title}
        </div>
      ))}
    </div>
  )
}
```

## Real-time Features

The notification system uses Supabase real-time subscriptions to:

1. **Auto-subscribe**: Automatically subscribes to user's notifications on component mount
2. **Live Updates**: New notifications appear instantly without page refresh
3. **State Sync**: Updates unread count and notification list in real-time
4. **Cleanup**: Properly unsubscribes when components unmount

## Integration Points

### Navigation
The notification bell is integrated into the site header and shows unread count.

### User Menu
The user dropdown menu includes a link to the full notifications page.

### Dashboard
The notifications page is accessible at `/dashboard/notifications`.

## Testing

Use the NotificationTest component to create test notifications:

1. Navigate to `/dashboard/notifications`
2. Use the test panel to create different types of notifications
3. Watch them appear in real-time in the notification bell and panel

## Security

- **Row Level Security**: Users can only see their own notifications
- **Company Isolation**: Notifications are scoped to the user's company
- **Input Validation**: All notification data is validated before storage

## Performance

- **Indexed Queries**: Database indexes on user_id, company_id, and created_at
- **Pagination**: Notifications are paginated to limit data transfer
- **Efficient Updates**: Only necessary data is updated when marking as read
- **Connection Management**: Real-time subscriptions are properly managed

## Future Enhancements

- Email notifications
- Push notifications
- Notification preferences
- Notification templates
- Bulk notification sending
- Notification analytics 