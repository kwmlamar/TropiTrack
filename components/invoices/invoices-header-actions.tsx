"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

export function InvoicesHeaderActions() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleNavigate = () => {
    startTransition(() => {
      router.push("/dashboard/invoices/new")
    })
  }

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={handleNavigate}
      className="gap-2"
    >
      <Plus className="h-4 w-4" />
      {isPending ? "Opening..." : "New Invoice"}
    </Button>
  )
}



