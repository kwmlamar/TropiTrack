# Loading Screen Implementation

This document explains the implementation of the minimal PWA loading screen for TropiTrack.

## Overview

The loading screen prevents the landing page from flashing while authentication state is being checked. It shows immediately on app load and displays until authentication status is resolved.

## Files Created/Modified

### 1. `components/loading-screen.tsx` (NEW)
**Purpose**: Minimal loading screen component with TropiTrack branding

**Features**:
- White background (`bg-white`)
- Centered text: "TropiTrack"
- Exact styling match to secondary sidebar:
  - "Tropi": `font-extrabold text-[#2596be]` (blue)
  - "Track": `font-medium text-[#145369]` (dark blue/gray)
  - Text size: `text-lg`
  - Font family: Inter (inherited from layout)
- Fixed positioning covering entire viewport
- No animations, no spinner
- Clean, app-like appearance

### 2. `app/page.tsx` (MODIFIED)
**Purpose**: Root page with loading screen during auth check

**Changes**:
- Added `isAuthLoading` state (initialized to `true`)
- Updated `useEffect` to check authentication immediately on load
- Shows `LoadingScreen` component while `isAuthLoading` is `true`
- Only renders landing page after auth check completes (for unauthenticated web users)

**Auth Check Logic**:
1. **Authenticated users** (both PWA and web):
   - Redirect to `/dashboard`
   - Loading screen shown during redirect

2. **Unauthenticated PWA users**:
   - Redirect to `/login`
   - Loading screen shown during redirect

3. **Unauthenticated web users**:
   - Set `isAuthLoading` to `false`
   - Show landing page

## Behavior Flow

```
App Load
  ↓
Show LoadingScreen
  ↓
Check Authentication
  ↓
┌─────────────────┬─────────────────┐
│ Authenticated   │ Not Authenticated│
│      ↓          │        ↓         │
│ Redirect to     │  ┌──────┴──────┐ │
│ /dashboard      │  │ PWA? Web?   │ │
│ (loading shown  │  │   ↓    ↓    │ │
│  during redirect)│  │/login Landing│ │
└─────────────────┴─────────────────┴─┘
```

## Key Implementation Details

### Loading State Management
- `isAuthLoading` starts as `true`
- Only set to `false` when:
  - User is unauthenticated AND on web (show landing page)
  - Error occurs AND on web (fallback to landing page)
- For redirects (authenticated users, PWA unauthenticated), the redirect happens and the component unmounts

### Authentication Check
- Uses `supabase.auth.getUser()` to check session
- Runs immediately on component mount
- Handles errors gracefully (shows landing page on web, redirects to login on PWA)

### PWA Detection
- Uses `isPWAStandalone()` utility
- PWA mode: Always redirect (dashboard if auth, login if not)
- Web mode: Show landing page if not authenticated

### Styling Match
The loading screen text matches the secondary sidebar exactly:
- **Font**: Inter (inherited from root layout)
- **Size**: `text-lg`
- **Tropi**: `font-extrabold text-[#2596be]`
- **Track**: `font-medium text-[#145369]`
- **Layout**: Centered on white background

## Testing

### Web Testing
1. Open app in browser (not authenticated)
2. Should see loading screen briefly
3. Landing page should appear (no flash)

2. Login and refresh page
3. Should see loading screen briefly
4. Should redirect to dashboard (no landing page flash)

### PWA Testing
1. Install PWA and open from home screen (not authenticated)
2. Should see loading screen briefly
3. Should redirect to login (no landing page flash)

2. Login and close/reopen PWA
3. Should see loading screen briefly
4. Should redirect to dashboard (no landing page flash)

### Edge Cases
- **Slow network**: Loading screen shows until auth check completes
- **Auth error**: Falls back gracefully (login for PWA, landing for web)
- **Session expired**: Treated as unauthenticated (appropriate redirect/page)

## Benefits

1. **No Landing Page Flash**: Loading screen prevents landing page from appearing during auth check
2. **Consistent Experience**: Same behavior for PWA and web
3. **Clean Branding**: Matches TropiTrack design system
4. **Minimal**: No animations or distractions
5. **Fast**: Immediate render, no additional dependencies

## Future Enhancements

Potential improvements (not currently needed):
- Add fade transition when loading completes (optional)
- Show app version or build info (optional)
- Add subtle animation (optional, but currently avoided for minimal approach)

## Summary

The loading screen implementation:
- ✅ Prevents landing page flash
- ✅ Shows immediately on app load
- ✅ Matches TropiTrack branding exactly
- ✅ Works for both PWA and web
- ✅ Minimal, clean design
- ✅ Handles all auth states correctly

