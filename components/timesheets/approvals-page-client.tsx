"use client";

import { useState, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import { DashboardLayoutClient } from "@/components/layouts/dashboard-layout-client";
import { ApprovalsPage } from "./approvals-page";
import { MobileApprovalsPage } from "./mobile-approvals-page";
import { Button } from "@/components/ui/button";
import { getUserProfileWithCompany } from "@/lib/data/userProfiles";
import { isPWAStandalone } from "@/lib/utils/pwa";
import type { UserProfileWithCompany } from "@/lib/types/userProfile";

export function ApprovalsPageClient() {
  const { theme } = useTheme();
  const [isPWA, setIsPWA] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfileWithCompany | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [approveHandler, setApproveHandler] = useState<(() => void) | null>(null);
  const [refreshHandler, setRefreshHandler] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Set mounted to true and check PWA status immediately on client
    setMounted(true);
    const pwa = isPWAStandalone();
    setIsPWA(pwa);
    
    const checkMobile = () => {
      const windowWidth = window.innerWidth;
      setIsMobile(pwa || windowWidth < 768);
    };

    // Check immediately on client
    checkMobile();
    
    // Add resize listener
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    getUserProfileWithCompany().then(setProfile);
  }, []);

  const handleApproveSelected = useCallback(() => {
    if (approveHandler) {
      approveHandler();
    }
  }, [approveHandler]);

  const handleRefresh = useCallback(() => {
    if (refreshHandler) {
      refreshHandler();
    }
  }, [refreshHandler]);

  const handleApproveHandlerChange = useCallback((handler: () => void) => {
    setApproveHandler(() => handler);
  }, []);

  const handleRefreshHandlerChange = useCallback((handler: () => void) => {
    setRefreshHandler(() => handler);
  }, []);

  const headerActions = totalCount > 0 ? (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={handleRefresh}
        size="sm"
        style={{
          backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
          borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
          color: theme === 'dark' ? '#d1d5db' : '#374151'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : '#ffffff'
        }}
      >
        Refresh
      </Button>
      <Button
        onClick={handleApproveSelected}
        disabled={selectedCount === 0}
        size="sm"
      >
        Approve Selected
      </Button>
    </div>
  ) : null;

  // Still detecting mobile - show loading spinner only if we're actually on mobile/PWA
  // On desktop, we can render immediately once mounted to avoid loading screen flash
  if (!mounted) {
    // On server and initial client render, always return null to prevent hydration mismatch
    // The useEffect will set mounted=true immediately on client and update isMobile
    return null;
  }
  
  // After mounted, show loading only if we're still detecting and it's mobile/PWA
  if (isMobile === null && isPWA) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // If still null and not PWA (desktop), assume desktop to avoid loading screen
  if (isMobile === null) {
    // On desktop, we can safely assume it's desktop and render
    // This prevents the loading screen flash
  }

  // Mobile: render mobile view without dashboard layout
  if (isMobile) {
    return <MobileApprovalsPage />;
  }

  // Desktop: render with dashboard layout
  if (!profile) {
    return (
      <div className="space-y-2 pt-2 pb-0 h-[calc(100vh-4rem)] flex flex-col">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards flex-1 flex flex-col">
          {/* Header Skeleton */}
          <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative mb-0 px-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-9 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
              <div className="h-9 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
            </div>
          </div>

          {/* Table Skeleton */}
          <div
            className="border-t border-b flex-1 flex flex-col"
            style={{
              backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
              borderColor: theme === 'dark' ? '#262626' : 'rgb(226 232 240 / 0.5)'
            }}
          >
            <div className="px-0 flex-1 flex flex-col">
              <div className="overflow-x-auto flex-1 overflow-y-auto">
                <table className="w-full border-collapse border-spacing-0">
                  <thead
                    className="sticky top-0 z-50 shadow-sm"
                    style={{
                      backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                      borderBottom: theme === 'dark' ? '2px solid #262626' : '2px solid rgb(226 232 240 / 0.5)'
                    }}
                  >
                    <tr style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}>
                      <th className="text-left p-4 pb-4 font-medium text-sm" style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}>
                        <div className="h-4 w-4 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                      </th>
                      <th className="text-left p-4 pb-4 font-medium text-sm" style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}>
                        <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                      </th>
                      <th className="text-left p-4 pb-4 font-medium text-sm" style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}>
                        <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                      </th>
                      <th className="text-left p-4 pb-4 font-medium text-sm" style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}>
                        <div className="h-4 w-12 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr
                        key={i}
                        className="border-b last:border-b-0"
                        style={{
                          borderColor: theme === 'dark' ? '#262626' : 'rgb(229 231 235 / 0.2)',
                        }}
                      >
                        <td className="p-4">
                          <div className="h-4 w-4 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-muted-foreground/20 dark:bg-muted/50 rounded-full animate-pulse" />
                            <div className="space-y-1.5">
                              <div className="h-4 w-28 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                              <div className="h-3 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1.5">
                            <div className="h-4 w-32 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                            <div className="h-3 w-24 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20 dark:bg-muted/50" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayoutClient
      title="Approvals"
      profile={profile}
      fullWidth={true}
      headerActions={headerActions}
    >
      <ApprovalsPage
        onSelectedCountChange={setSelectedCount}
        onTotalCountChange={setTotalCount}
        onApproveHandlerChange={handleApproveHandlerChange}
        onRefreshHandlerChange={handleRefreshHandlerChange}
      />
    </DashboardLayoutClient>
  );
}

