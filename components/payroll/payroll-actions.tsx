"use client"

import { useState } from "react"
import { Download, FileText, Send, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import Link from "next/link"

export function PayrollActions() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleGeneratePayslips = async () => {
    setIsGenerating(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success("Payslips generated successfully", {
        description: "All payslips have been generated and are ready for distribution.",
      })
    } catch {
      toast.error("Failed to generate payslips", {
        description: "Please try again or contact support if the issue persists.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExport = async (format: string) => {
    setIsExporting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success(`Payroll exported as ${format.toUpperCase()}`, {
        description: "The file has been downloaded to your device.",
      })
    } catch {
      toast.error("Export failed", {
        description: "Please try again or contact support if the issue persists.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleSendPayslips = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Payslips sent successfully", {
        description: "All employees have been notified via email.",
      })
    } catch {
      toast.error("Failed to send payslips", {
        description: "Please try again or contact support if the issue persists.",
      })
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleGeneratePayslips} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate Payslips
            </>
          )}
        </Button>

        <Button onClick={handleSendPayslips} variant="outline" className="w-full">
          <Send className="mr-2 h-4 w-4" />
          Send Payslips
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full" disabled={isExporting}>
              {isExporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Payroll
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              <FileText className="mr-2 h-4 w-4" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("excel")}>
              <Download className="mr-2 h-4 w-4" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              <Download className="mr-2 h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="pt-3 border-t">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/dashboard/settings/payroll">
              <Settings className="mr-2 h-4 w-4" />
              Payroll Settings
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
