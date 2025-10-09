"use client";

import { useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { DashboardLayoutClient } from "@/components/layouts/dashboard-layout-client";
import { ApprovalsPage } from "./approvals-page";
import { Button } from "@/components/ui/button";
import { getUserProfileWithCompany } from "@/lib/data/userProfiles";
import { useEffect } from "react";
import type { UserProfileWithCompany } from "@/lib/types/userProfile";

export function ApprovalsPageClient() {
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfileWithCompany | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [approveHandler, setApproveHandler] = useState<(() => void) | null>(null);
  const [refreshHandler, setRefreshHandler] = useState<(() => void) | null>(null);

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

  if (!profile) {
    return <div>Loading...</div>;
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

