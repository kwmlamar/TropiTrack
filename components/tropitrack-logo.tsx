const TropiTrackLogo = () => (
    <svg 
    className="w-full h-full"
    width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Bar chart base as tree trunk */}
      <rect x="45" y="50" width="10" height="40" fill="#000" />
      <rect x="40" y="55" width="5" height="35" fill="#4cc9f0" />
      <rect x="55" y="45" width="5" height="45" fill="#4cc9f0" />
  
      {/* Palm fronds */}
      <path d="M50 50 C30 30, 20 20, 10 30" stroke="#00bb7a" fill="none" strokeWidth="3" />
      <path d="M50 50 C70 30, 80 20, 90 30" stroke="#00bb7a" fill="none" strokeWidth="3" />
      <path d="M50 50 C35 25, 50 10, 65 25" stroke="#00bb7a" fill="none" strokeWidth="3" />
    </svg>
  );

export default TropiTrackLogo;
  