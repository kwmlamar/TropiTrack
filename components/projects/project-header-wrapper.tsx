"use client"

import { SiteHeader } from "@/components/site-header"
import { useProjectTabs } from "@/context/project-tabs-context"

interface ProjectHeaderWrapperProps {
  title: string | React.ReactNode
  children?: React.ReactNode
}

export function ProjectHeaderWrapper({ title, children }: ProjectHeaderWrapperProps) {
  const { activeTab, setActiveTab } = useProjectTabs()

  return (
    <SiteHeader
      title={title}
      hideDateRangePicker={true}
      showProjectTabs={true}
      activeProjectTab={activeTab}
      onProjectTabChange={setActiveTab}
    >
      {children}
    </SiteHeader>
  )
}
