/**
 * PWA Detection Utilities
 * 
 * These utilities help detect if the app is running in PWA/standalone mode.
 * PWA mode is when the app is installed and opened from the home screen,
 * rather than being opened in a regular browser tab.
 */

/**
 * Detects if the app is running in PWA/standalone mode on the client side.
 * 
 * This works by checking:
 * 1. window.matchMedia for display-mode: standalone
 * 2. window.navigator.standalone (iOS Safari)
 * 3. window.matchMedia for display-mode: fullscreen (Android Chrome)
 * 
 * @returns true if running in PWA/standalone mode, false otherwise
 */
export function isPWAStandalone(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false
  }

  // Check for display-mode: standalone (standard PWA detection)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  // Check for display-mode: fullscreen (Android Chrome PWA)
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return true
  }

  // Check for iOS Safari standalone mode
  // @ts-expect-error - navigator.standalone is iOS-specific and not in TypeScript types
  if (window.navigator.standalone === true) {
    return true
  }

  // Check if launched from home screen (Android)
  // This is a heuristic: if there's no referrer and we're at the root, likely PWA
  if (
    !document.referrer &&
    window.location.pathname === '/' &&
    window.matchMedia('(display-mode: minimal-ui)').matches
  ) {
    return true
  }

  return false
}

/**
 * Detects if the app is running in PWA/standalone mode on the server side.
 * 
 * This checks the User-Agent header and Sec-CH-UA headers to determine
 * if the request is coming from a PWA context.
 * 
 * Note: Server-side detection is less reliable than client-side detection.
 * We primarily use this in middleware, but client-side checks are more accurate.
 * 
 * @param userAgent - The User-Agent header from the request
 * @param secChUaMode - The Sec-CH-UA-Mode header (if available)
 * @returns true if likely running in PWA mode, false otherwise
 */
export function isPWAStandaloneServer(
  userAgent?: string | null,
  secChUaMode?: string | null
): boolean {
  // Check Sec-CH-UA-Mode header (Chrome/Edge PWA indicator)
  if (secChUaMode === 'standalone' || secChUaMode === 'fullscreen') {
    return true
  }

  // Check User-Agent for PWA indicators
  if (!userAgent) {
    return false
  }

  // If it's a mobile browser, it could be PWA (but we can't be certain server-side)
  // We'll rely more on client-side detection for accuracy
  // For now, return false to be conservative - let client-side handle it
  return false
}

/**
 * Gets the PWA display mode from the client.
 * 
 * @returns 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser' | null
 */
export function getPWADisplayMode(): 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser' | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone'
  }

  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen'
  }

  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui'
  }

  return 'browser'
}

