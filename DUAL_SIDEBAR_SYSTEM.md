# Dual Sidebar System

## Overview
The TropiTrack dashboard now features a modern dual sidebar layout that provides better navigation and contextual access to features.

## Architecture

### Primary Sidebar (Icon-based)
- **Width**: 64px (4rem)
- **Location**: Left-most edge
- **Purpose**: Main navigation
- **Features**:
  - Icon-only navigation items
  - Hover tooltips with descriptions
  - Active state indicators (left accent bar)
  - Settings at the bottom
  - Smooth animations and transitions

### Secondary Sidebar (Contextual)
- **Width**: 256px (16rem) when expanded, 0px when collapsed
- **Location**: Between primary sidebar and main content
- **Purpose**: Contextual navigation and quick actions
- **Features**:
  - Section-specific navigation
  - Quick action buttons (New Timesheet, Run Payroll, etc.)
  - Recent items (where applicable)
  - User info footer
  - Collapsible with smooth animation
  - Auto-detects current section from URL

## Navigation Structure

### Primary Navigation Items:
1. **Dashboard** - `/dashboard`
2. **Time Tracking** - `/dashboard/timesheets`
   - Timesheets
   - Approvals
   - Time Logs
3. **Payroll** - `/dashboard/payroll`
   - Pay Periods
   - Pay History
   - Transactions
4. **Accounting** - `/dashboard/accounting`
   - Overview
   - Transactions
   - Reports
5. **Projects** - `/dashboard/projects`
   - All Projects
   - Active
   - Completed
6. **Clients** - `/dashboard/clients`
   - All Clients
   - Active
7. **Workers** - `/dashboard/workers`
   - All Workers
   - Active
   - Biometric Setup
8. **Reports** - `/dashboard/reports`
   - Overview
   - Time Reports
   - Payroll Reports
   - Project Reports
9. **Settings** - `/dashboard/settings`

## Key Features

### Collapsible Secondary Sidebar
- Click the chevron button in the secondary sidebar header to collapse
- When collapsed, a menu button appears in the main content header to expand
- Smooth width transition animation (300ms)
- State is maintained during navigation within the same section

### Auto-Detection
The secondary sidebar automatically detects which section you're in based on the current URL pathname and displays relevant content.

### Responsive Design
- Sidebars are properly sized for desktop use
- Overflow handling prevents layout issues
- Fixed heights ensure proper scrolling behavior

## Components

### `/components/primary-sidebar.tsx`
- Renders the icon-based navigation
- Handles section selection
- Manages tooltips and active states

### `/components/secondary-sidebar.tsx`
- Renders contextual navigation
- Manages collapse/expand state
- Auto-detects current section
- Shows quick actions and links

### `/components/layouts/dashboard-layout-client.tsx`
- Orchestrates both sidebars
- Manages collapse state
- Provides consistent layout structure

## Customization

### Adding New Sections
To add a new section to the secondary sidebar, edit `/components/secondary-sidebar.tsx`:

```typescript
const sectionContent: Record<string, SectionContent> = {
  // ... existing sections
  newSection: {
    title: "New Section",
    quickActions: [
      { title: "Quick Action", icon: Plus, href: "/path" },
    ],
    links: [
      { title: "Link 1", href: "/path", icon: IconName },
    ],
    showRecent: true,
  },
}
```

### Styling
- Uses Tailwind CSS classes
- Follows the existing design system
- Backdrop blur effects for modern look
- Smooth transitions on all interactive elements

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Supports backdrop-filter for blur effects
- Graceful degradation for older browsers

## Performance
- Minimal re-renders with proper React state management
- Smooth CSS transitions
- Lazy loading where applicable
- Optimized icon imports from lucide-react

