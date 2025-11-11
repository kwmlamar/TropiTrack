import Image from 'next/image';

interface TropiTrackLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TropiTrackLogo({ 
  size = "md", 
  className = "" 
}: TropiTrackLogoProps) {
  const imageSizes = {
    sm: { width: 120, height: 40 },
    md: { width: 160, height: 53 }, 
    lg: { width: 200, height: 66 }
  };

  const sizeConfig = imageSizes[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/images/tropitrack-logo.png"
        alt="TropiTrack"
        width={sizeConfig.width}
        height={sizeConfig.height}
        className="object-contain"
        priority
      />
    </div>
  );
}
