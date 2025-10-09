"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface ReportsTabsContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const ReportsTabsContext = createContext<ReportsTabsContextType | undefined>(undefined)

export function ReportsTabsProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("summary")

  return (
    <ReportsTabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ReportsTabsContext.Provider>
  )
}

export function useReportsTabs() {
  const context = useContext(ReportsTabsContext)
  if (context === undefined) {
    throw new Error("useReportsTabs must be used within a ReportsTabsProvider")
  }
  return context
}




