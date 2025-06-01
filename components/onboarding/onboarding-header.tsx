import { Building2, Clock } from "lucide-react"

export function OnboardingHeader() {
  return (
    <div className="text-center">
      {/* Logo */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
        <div className="relative">
          <Building2 className="h-6 w-6 text-white" />
          <Clock className="absolute -bottom-1 -right-1 h-4 w-4 text-orange-100" />
        </div>
      </div>

      {/* Brand Name */}
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
        Tropi<span className="text-orange-500">Track</span>
      </h1>

      {/* Tagline */}
      <p className="text-sm text-muted-foreground">Construction Time Tracking Made Simple</p>
    </div>
  )
}
