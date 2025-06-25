"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function MigratePayrollTransactions() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)

  const handleMigration = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/migrate-payroll-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          details: data.data
        })
        toast.success("Migration completed successfully")
      } else {
        setResult({
          success: false,
          message: data.error,
          details: data.details
        })
        toast.error("Migration failed", {
          description: data.error
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setResult({
        success: false,
        message: "Failed to execute migration",
        details: errorMessage
      })
      toast.error("Migration failed", {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Migrate Payroll Transactions
        </CardTitle>
        <CardDescription>
          Create transactions for existing payrolls that don&apos;t have corresponding accounting entries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>This will:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Create liability transactions for all existing payrolls</li>
            <li>Create expense transactions for paid/confirmed payrolls</li>
            <li>Skip payrolls that already have transactions</li>
          </ul>
        </div>

        <Button 
          onClick={handleMigration} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Start Migration
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
              <div className="font-medium">{result.message}</div>
              {result.details && (
                <div className="mt-1 text-sm opacity-80">{result.details}</div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 