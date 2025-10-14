"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

export function ThemeColor() {
  const { theme } = useTheme()

  useEffect(() => {
    // Update theme-color meta tag based on current theme
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    
    if (metaThemeColor) {
      // Black for dark mode, light gray for light mode
      metaThemeColor.setAttribute(
        'content',
        theme === 'dark' ? '#000000' : '#f3f4f6'
      )
    }
  }, [theme])

  return null
}


