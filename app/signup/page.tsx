import { Suspense } from "react"
import { SignupForm } from "@/components/signup-form"
import { Loader2 } from "lucide-react"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-[400px]">
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading signup form...</span>
            </div>
          </div>
        }>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
