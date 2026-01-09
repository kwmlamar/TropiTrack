"use client";

import { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect if the current viewport is mobile-sized.
 * Returns null during initial render/hydration, then boolean once resolved.
 * This prevents layout shifts and allows components to show loading states
 * until the viewport size is known.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return null during SSR and initial hydration
  if (!mounted) {
    return null
  }

  return isMobile
}
