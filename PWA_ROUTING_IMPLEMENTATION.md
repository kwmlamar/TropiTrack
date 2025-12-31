# PWA Routing Implementation

This document explains the implementation of PWA-specific routing that skips the landing page and goes directly to the app experience when the app is opened from the home screen.

## Overview

When TropiTrack is installed as a PWA and opened from the home screen:
- **Authenticated users** → Redirected directly to `/dashboard`
- **Unauthenticated users** → Redirected directly to `/login`
- **Desktop browser** → Normal behavior (shows landing page)

## Files Modified

### 1. `lib/utils/pwa.ts` (NEW)
**Purpose**: Utility functions to detect PWA/standalone mode

**Key Functions**:
- `isPWAStandalone()`: Client-side detection using `window.matchMedia` and `navigator.standalone`
- `isPWAStandaloneServer()`: Server-side detection using headers (less reliable, used as fallback)
- `getPWADisplayMode()`: Returns the current display mode

**Detection Methods**:
1. `display-mode: standalone` media query (standard PWA detection)
2. `display-mode: fullscreen` media query (Android Chrome PWA)
3. `navigator.standalone` (iOS Safari specific)
4. `display-mode: minimal-ui` with no referrer (heuristic for Android)

### 2. `utils/supabase/middleware.ts` (MODIFIED)
**Purpose**: Server-side routing logic that redirects PWA users away from the landing page

**Changes**:
- Added PWA detection using `isPWAStandaloneServer()` and `x-pwa-mode` header
- When in PWA mode and on root path (`/`):
  - If authenticated → Redirect to `/dashboard`
  - If not authenticated → Redirect to `/login`
- Preserves all Supabase session cookies during redirect

**Why This Works**:
- Runs on every request before the page loads
- Can detect PWA mode from request headers
- Has access to authentication state via Supabase
- Redirects happen server-side, avoiding any flash of landing page content

### 3. `app/page.tsx` (MODIFIED)
**Purpose**: Client-side fallback for PWA detection and redirect

**Changes**:
- Added `useEffect` hook that runs on component mount
- Checks if app is in PWA mode using `isPWAStandalone()`
- If in PWA mode:
  - Checks authentication status via Supabase client
  - Redirects to `/dashboard` if authenticated
  - Redirects to `/login` if not authenticated

**Why This Is Needed**:
- Server-side PWA detection is less reliable (headers can be inconsistent)
- Client-side detection is more accurate (has access to `window.matchMedia`)
- Acts as a fallback if middleware doesn't catch the PWA mode
- Ensures PWA users never see the landing page, even if server detection fails

## Authentication Persistence

### How It Works

Supabase SSR (Server-Side Rendering) handles session persistence automatically:

1. **Session Storage**: Sessions are stored in secure HTTP-only cookies
2. **Automatic Refresh**: The middleware calls `supabase.auth.getUser()` on every request, which:
   - Reads the session from cookies
   - Automatically refreshes expired sessions if refresh token is valid
   - Updates cookies with new session data
3. **Cross-Session Persistence**: Cookies persist across:
   - App restarts
   - Browser restarts (unless cookies are cleared)
   - PWA launches from home screen

### Session Lifecycle

1. **Login**: User logs in → Session stored in cookies
2. **PWA Launch**: User opens PWA from home screen
3. **Middleware Check**: `supabase.auth.getUser()` reads session from cookies
4. **Auto-Refresh**: If session expired but refresh token valid → Session refreshed automatically
5. **Redirect**: User redirected to dashboard (authenticated) or login (not authenticated)

### Session Expiration

- **Access Token**: Short-lived (typically 1 hour)
- **Refresh Token**: Long-lived (typically 30 days)
- **Behavior**: If access token expires but refresh token is valid, Supabase automatically refreshes the session
- **User Experience**: User stays logged in unless:
  - Refresh token expires (after ~30 days of inactivity)
  - User explicitly logs out
  - Cookies are cleared

## Testing PWA Mode

### Desktop Browser Testing

1. **Chrome DevTools**:
   - Open DevTools → Application tab → Manifest
   - Click "Add to homescreen" (if available)
   - Or use "Application" → "Service Workers" → "Update on reload"

2. **Simulate Standalone Mode**:
   - DevTools → More tools → Rendering
   - Set "Emulate CSS media feature `display-mode`" to `standalone`

### Mobile Testing

1. **Install PWA**:
   - Open app in mobile browser
   - Tap "Add to Home Screen" or "Install App"
   - Open app from home screen icon

2. **Verify Behavior**:
   - Should skip landing page
   - Should go directly to dashboard (if logged in) or login (if not)

## Implementation Details

### Why Both Server and Client-Side Detection?

1. **Server-Side (Middleware)**:
   - Faster (redirects before page loads)
   - No flash of landing page content
   - Less reliable (header-based detection)

2. **Client-Side (Page Component)**:
   - More accurate (has access to `window.matchMedia`)
   - Acts as fallback if server detection fails
   - Slight delay (runs after component mounts)

### Cookie Preservation

When redirecting in middleware, we must preserve Supabase cookies:

```typescript
// Copy all cookies from supabaseResponse to maintain session
supabaseResponse.cookies.getAll().forEach((cookie) => {
  redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
})
```

This ensures the session is maintained across redirects.

## Browser Compatibility

### Supported Browsers

- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iOS & macOS)
- ✅ Firefox (Android & Desktop)
- ✅ Samsung Internet

### Detection Methods by Browser

- **Chrome/Edge**: `display-mode: standalone` media query
- **Safari iOS**: `navigator.standalone` property
- **Firefox**: `display-mode: standalone` media query
- **Samsung Internet**: `display-mode: standalone` media query

## Troubleshooting

### Issue: Landing page still shows in PWA

**Possible Causes**:
1. PWA detection failing (check browser console for errors)
2. Middleware not running (check Next.js middleware config)
3. Client-side redirect not firing (check React DevTools)

**Solutions**:
1. Verify `isPWAStandalone()` returns `true` in browser console
2. Check middleware logs in server console
3. Add `console.log` statements to debug detection

### Issue: User logged out every time PWA opens

**Possible Causes**:
1. Cookies not persisting (check cookie settings)
2. Session refresh failing (check Supabase logs)
3. Cookie domain/path issues

**Solutions**:
1. Verify cookies are set with correct `SameSite` and `Secure` flags
2. Check Supabase session refresh logs
3. Verify cookie domain matches app domain

## Future Enhancements

1. **Service Worker Registration**: Add explicit service worker registration in `app/layout.tsx` for better offline support
2. **PWA Install Prompt**: Add install prompt component for browsers that support it
3. **Offline Detection**: Show offline indicator when PWA is offline
4. **Background Sync**: Implement background sync for offline actions

## Summary

The PWA routing implementation ensures a native app-like experience:
- ✅ Skips landing page in PWA mode
- ✅ Direct routing to dashboard/login based on auth state
- ✅ Persistent authentication across sessions
- ✅ Works on all major browsers
- ✅ Graceful fallback if detection fails

