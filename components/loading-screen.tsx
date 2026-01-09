/**
 * Loading Screen Component
 * 
 * Minimal loading screen that matches the TropiTrack branding.
 * Used during initial authentication check to prevent landing page flash.
 * 
 * Styling matches the secondary sidebar TropiTrack text exactly:
 * - Same font family (Inter, inherited)
 * - Same font weights (extrabold for Tropi, medium for Track)
 * - Same colors (#2596be for Tropi, #145369 for Track)
 * - Same text size (text-lg)
 * - No animations or spinners
 */

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
       <h1 className="text-4xl">
        <span className="font-extrabold text-[#2596be]">Tropi</span>
        <span className="font-medium text-[#145369]">Track</span>
      </h1>
    </div>
  )
}

