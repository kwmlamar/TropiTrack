"use client"

import { Tabs } from "@/components/ui/tabs"
import { useProjectTabs } from "@/context/project-tabs-context"

interface ProjectTabsWrapperProps {
  children: React.ReactNode
  className?: string
}

export function ProjectTabsWrapper({ children, className }: ProjectTabsWrapperProps) {
  const { activeTab, setActiveTab } = useProjectTabs()

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={className}>
      {children}
    </Tabs>
  )
}
