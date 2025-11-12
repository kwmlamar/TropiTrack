"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface SidebarContextType {
  isSecondarySidebarCollapsed: boolean
  setIsSecondarySidebarCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSecondarySidebarCollapsed, setIsSecondarySidebarCollapsed] = useState(false)

  return (
    <SidebarContext.Provider value={{ isSecondarySidebarCollapsed, setIsSecondarySidebarCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebarCollapse() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    // Return default values if used outside provider
    return { isSecondarySidebarCollapsed: false, setIsSecondarySidebarCollapsed: () => {} }
  }
  return context
}


