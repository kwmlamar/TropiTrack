
import Image from 'next/image';

export function OnboardingHeader() {
  return (
    <div className="text-center">
      {/* Header with Logo */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2">
          <Image
            src="/images/tropitrack-logo.png"
            alt="TropiTrack"
            width={200}
            height={66}
            className="object-contain"
          />
        </div>
      </div>

      {/* Tagline */}
              <p className="text-sm text-muted-foreground">Construction Time Tracking Made Simple</p>
    </div>
  )
}
