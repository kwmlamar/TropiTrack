interface TropiTrackLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TropiTrackLogo({ 
  size = "md", 
  className = "" 
}: TropiTrackLogoProps) {
  const textSizes = {
    sm: "text-lg",
    md: "text-2xl", 
    lg: "text-3xl"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className={`font-bold tracking-tight ${textSizes[size]}`}>
        TropiTrack
      </span>
    </div>
  );
}
