
import Image from 'next/image';

export function OnboardingHeader() {
  return (
    <div className="text-center">
      {/* Header with Logo */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2">
          {/* Light Mode Logo */}
          <Image
            src="/logo/5.png"
            alt="TropiTrack logo"
            width={200}
            height={200}
            className="w-50 h-50 object-contain block dark:hidden"
          />

          {/* Dark Mode Logo */}
          <Image
            src="/logo/2.png"
            alt="TropiTrack logo dark"
            width={200}
            height={200}
            className="w-50 h-50 object-contain hidden dark:block"
          />
        </div>
      </div>

      {/* Tagline */}
              <p className="text-sm text-muted-foreground">Construction Time Tracking Made Simple</p>
    </div>
  )
}
