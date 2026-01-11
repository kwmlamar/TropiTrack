"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface ProjectTabsContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const ProjectTabsContext = createContext<ProjectTabsContextType | undefined>(undefined)

export function ProjectTabsProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <ProjectTabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ProjectTabsContext.Provider>
  )
}

export function useProjectTabs() {
  const context = useContext(ProjectTabsContext)
  if (context === undefined) {
    throw new Error("useProjectTabs must be used within a ProjectTabsProvider")
  }
  return context
}
