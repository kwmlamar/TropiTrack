"use client";

import { useState, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import { DashboardLayoutClient } from "@/components/layouts/dashboard-layout-client";
import PayrollPage from "./page";
import { MobilePayrollOverview } from "./mobile-payroll-overview";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { isPWAStandalone } from "@/lib/utils/pwa";
import type { UserProfileWithCompany } from "@/lib/types/userProfile";
import type { PayrollRecord } from "@/lib/types";

interface PayrollPageClientProps {
  user: UserProfileWithCompany;
}

export function PayrollPageClient({ user }: PayrollPageClientProps) {
  const { theme } = useTheme();
  const isPWA = isPWAStandalone();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [selectedPayrollIds, setSelectedPayrollIds] = useState<Set<string>>(new Set());
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [confirmHandler, setConfirmHandler] = useState<(() => void) | null>(null);
  const [markAsPaidHandler, setMarkAsPaidHandler] = useState<(() => void) | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const windowWidth = window.innerWidth;
      setIsMobile(isPWA || windowWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [isPWA]);

  const handleConfirmPayroll = useCallback(() => {
    if (confirmHandler) {
      confirmHandler();
    }
  }, [confirmHandler]);

  const handleMarkAsPaid = useCallback(() => {
    if (markAsPaidHandler) {
      markAsPaidHandler();
    }
  }, [markAsPaidHandler]);

  const handleConfirmHandlerChange = useCallback((handler: () => void) => {
    setConfirmHandler(() => handler);
  }, []);

  const handleMarkAsPaidHandlerChange = useCallback((handler: () => void) => {
    setMarkAsPaidHandler(() => handler);
  }, []);

  // Still detecting - show loading spinner
  if (isMobile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Mobile: render mobile payroll overview
  if (isMobile) {
    return <MobilePayrollOverview companyId={user.company_id} />;
  }

  // Desktop: render with dashboard layout
  const headerActions = (
    <div className="flex items-center gap-2">
      {/* Confirm Payroll Button */}
      <Button
        onClick={handleConfirmPayroll}
        disabled={selectedPayrollIds.size === 0 || !Array.from(selectedPayrollIds).every(id =>
          payrolls.find(payroll => payroll.id === id)?.status === "pending"
        )}
        variant="outline"
        size="sm"
        style={{
          backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
          borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
          color: theme === 'dark' ? '#d1d5db' : '#374151'
        }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : '#ffffff'
        }}
      >
        Confirm Payroll
      </Button>

      {/* Run Payroll Button */}
      <Button
        onClick={handleMarkAsPaid}
        disabled={selectedPayrollIds.size === 0 || !Array.from(selectedPayrollIds).every(id =>
          payrolls.find(payroll => payroll.id === id)?.status === "confirmed"
        )}
        size="sm"
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Run Payroll
      </Button>
    </div>
  );

  return (
    <DashboardLayoutClient
      title="Payroll"
      profile={user}
      fullWidth={true}
      headerActions={headerActions}
    >
      <PayrollPage
        user={user as unknown as import("@supabase/supabase-js").User}
        selectedPayrollIds={selectedPayrollIds}
        onSelectedPayrollIdsChange={setSelectedPayrollIds}
        onPayrollsChange={setPayrolls}
        onConfirmHandlerChange={handleConfirmHandlerChange}
        onMarkAsPaidHandlerChange={handleMarkAsPaidHandlerChange}
      />
    </DashboardLayoutClient>
  );
}

