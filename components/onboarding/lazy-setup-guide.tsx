"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useOnboarding } from '@/context/onboarding-context';

// Lazy load the setup guide dropdown to reduce initial bundle size
const SetupGuideDropdown = dynamic(
  () => import('./setup-guide-dropdown').then(mod => ({ default: mod.SetupGuideDropdown })),
  { 
    ssr: false,
    loading: () => null // Don't show loading state for setup guide
  }
);

export function LazySetupGuide() {
  const { state } = useOnboarding();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Only load the setup guide if onboarding is active or if we're on a relevant page
    const isRelevantPage = typeof window !== 'undefined' && (
      window.location.pathname.includes('/dashboard') ||
      window.location.pathname.includes('/workers') ||
      window.location.pathname.includes('/projects') ||
      window.location.pathname.includes('/timesheets')
    );

    if (state.isActive || isRelevantPage) {
      // Add a small delay to prevent blocking the main page load
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [state.isActive]);

  // Don't render anything if we shouldn't load the setup guide
  if (!shouldLoad) {
    return null;
  }

  return <SetupGuideDropdown />;
}
