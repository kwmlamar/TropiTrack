"use client"

import { SiteHeader } from "@/components/site-header"
import { useReportsTabs } from "@/context/reports-tabs-context"

interface ReportsHeaderWrapperProps {
  title: string | React.ReactNode
  children?: React.ReactNode
}

export function ReportsHeaderWrapper({ title, children }: ReportsHeaderWrapperProps) {
  const { activeTab, setActiveTab } = useReportsTabs()

  return (
    <SiteHeader 
      title={title} 
      hideDateRangePicker={true}
      showReportsTabs={true}
      activeReportTab={activeTab}
      onReportTabChange={setActiveTab}
    >
      {children}
    </SiteHeader>
  )
}




