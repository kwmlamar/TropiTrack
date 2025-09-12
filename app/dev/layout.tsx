import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Portal - TropiTrack',
  description: 'Development tools and testing environment for TropiTrack',
  robots: 'noindex, nofollow', // Prevent search engine indexing
};

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

