"use client"

import { Toaster } from "@/components/ui/sonner"

export default function QRScanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
      <Toaster />
    </div>
  )
}
