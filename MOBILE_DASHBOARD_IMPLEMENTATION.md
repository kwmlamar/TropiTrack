# Mobile Dashboard Implementation

This document explains the implementation of the Connecteam-style mobile-first dashboard for TropiTrack.

## Overview

The mobile dashboard provides a native app-like experience when users open the PWA on mobile devices. It features:
- **Personalized greeting** with time-based messages and user's first name
- **Three primary action buttons** for quick access to key features
- **Clean, minimal design** optimized for mobile screens
- **Mobile/PWA-only display** - desktop users see the standard dashboard

## Files Created/Modified

### 1. `lib/utils/greetings.ts` (NEW)
**Purpose**: Utility functions for time-based greetings and name extraction

**Functions**:
- `getTimeBasedGreeting(date?)`: Returns greeting based on time of day
  - Good morning: 5:00 AM - 11:59 AM
  - Good afternoon: 12:00 PM - 4:59 PM
  - Good evening: 5:00 PM - 8:59 PM
  - Good night: 9:00 PM - 4:59 AM
- `getPersonalizedGreeting(firstName, date?)`: Combines time-based greeting with user's first name
- `getFirstName(fullName)`: Extracts first name from full name string, handles edge cases

**Why**: Centralized greeting logic that can be reused across the app

### 2. `components/dashboard/mobile-dashboard.tsx` (NEW)
**Purpose**: Main mobile dashboard component with greeting and action buttons

**Features**:
- **Greeting Header**: Large, prominent display of personalized greeting
  - Shows time-based greeting + user's first name
  - Displays company name below greeting
  - Most visually prominent element on screen

- **Primary Action Buttons**: Three large, tappable buttons
  - **Time Clock** → `/dashboard/timesheets` (Blue)
  - **Directory** → `/dashboard/workers` (Green)
  - **Payroll** → `/dashboard/payroll` (Purple)
  - Each button includes:
    - Large icon in semi-transparent container
    - Label and description
    - Touch-friendly size (h-20, full width)
    - Active state animation (scale on press)

- **Placeholder Sections**: Minimal cards for future expansion
  - Recent Activity placeholder
  - Quick Stats placeholder

**Design Decisions**:
- **Mobile-first**: Optimized for phone screens (max-width: 768px)
- **PWA-aware**: Also shows in PWA standalone mode
- **Large touch targets**: Buttons are 80px tall (meets accessibility guidelines)
- **Color-coded actions**: Each button has distinct color for quick recognition
- **Gradient background**: Subtle gradient from gray-50 to white for depth
- **Spacing**: Generous padding and spacing for comfortable mobile use

### 3. `components/dashboard/dashboard-home-client.tsx` (NEW)
**Purpose**: Client-side wrapper that handles conditional rendering logic

**Behavior**:
- Detects mobile/PWA mode using `useIsMobile()` and `isPWAStandalone()`
- Shows `MobileDashboard` on mobile or PWA
- Redirects to `/dashboard/timesheets` on desktop (maintains existing behavior)

**Why Separate Component**:
- Allows server-side profile fetching in page component
- Handles client-side mobile/PWA detection
- Provides different experiences for mobile vs desktop

### 4. `app/dashboard/(overview)/page.tsx` (MODIFIED)
**Purpose**: Dashboard home page entry point

**Changes**:
- Fetches user profile server-side
- Renders `DashboardHomeClient` which handles mobile/desktop logic
- Maintains existing redirect behavior for desktop users

**Before**: Always redirected to `/dashboard/timesheets`
**After**: Shows mobile dashboard on mobile/PWA, redirects on desktop

## Layout Structure

```
┌─────────────────────────────┐
│   Greeting Header           │
│   "Good morning, Lamar"      │
│   Company Name              │
├─────────────────────────────┤
│                             │
│   [Time Clock Button]       │
│   Large, Blue, Icon + Text  │
│                             │
│   [Directory Button]        │
│   Large, Green, Icon + Text │
│                             │
│   [Payroll Button]          │
│   Large, Purple, Icon + Text│
│                             │
├─────────────────────────────┤
│   Recent Activity Card      │
│   (Placeholder)             │
│                             │
│   Quick Stats Card          │
│   (Placeholder)             │
└─────────────────────────────┘
```

## Technical Details

### Mobile Detection
- Uses `useIsMobile()` hook (checks window width < 768px)
- Also checks `isPWAStandalone()` for PWA mode
- Component only renders if mobile OR PWA mode

### Responsive Behavior
- **Mobile/PWA**: Shows full mobile dashboard
- **Desktop**: Redirects to timesheets (existing behavior)
- **Transition**: Smooth redirect via Next.js router

### Button Styling
- **Height**: 80px (h-20) - meets accessibility guidelines for touch targets
- **Colors**: 
  - Time Clock: Blue (bg-blue-500)
  - Directory: Green (bg-green-500)
  - Payroll: Purple (bg-purple-500)
- **Interactions**: 
  - Hover state: Darker shade
  - Active state: Scale down (0.98) for tactile feedback
  - Shadow: Subtle shadow for depth

### Greeting Logic
- Extracts first name from full name (handles edge cases)
- Falls back to "there" if no name available
- Updates based on time of day (client-side, updates on page load)

## User Experience Flow

1. **User opens PWA on mobile** → Lands on `/dashboard`
2. **Mobile detection** → Shows mobile dashboard
3. **Greeting displayed** → "Good morning, [FirstName]"
4. **User taps action button** → Navigates to corresponding page
5. **Desktop user** → Automatically redirected to timesheets (existing behavior)

## Future Enhancements

The placeholder sections can be expanded with:
- **Recent Activity**: 
  - Recent timesheet entries
  - Recent approvals
  - Recent notifications
- **Quick Stats**:
  - Hours worked today/week
  - Pending approvals count
  - Upcoming payroll date

## Testing

### Mobile Testing
1. Open app on mobile device or mobile browser
2. Navigate to `/dashboard`
3. Verify greeting shows with correct time-based message
4. Verify three action buttons are visible and tappable
5. Verify buttons navigate to correct routes

### PWA Testing
1. Install PWA on mobile device
2. Open from home screen
3. Verify mobile dashboard appears (not landing page)
4. Verify greeting and buttons display correctly

### Desktop Testing
1. Open app on desktop browser
2. Navigate to `/dashboard`
3. Verify redirects to `/dashboard/timesheets` (existing behavior)

## Accessibility

- **Touch targets**: All buttons meet 44x44px minimum (80px height)
- **Color contrast**: High contrast text on colored buttons
- **Semantic HTML**: Proper heading hierarchy (h1 for greeting)
- **Screen readers**: Descriptive button labels and descriptions

## Summary

The mobile dashboard provides a native app-like experience that:
- ✅ Shows personalized greeting with user's first name
- ✅ Provides quick access to primary features
- ✅ Only displays on mobile/PWA (desktop unchanged)
- ✅ Uses clean, modern design optimized for mobile
- ✅ Is extensible for future enhancements

