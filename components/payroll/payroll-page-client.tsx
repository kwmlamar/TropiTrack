"use client";

import { useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { DashboardLayoutClient } from "@/components/layouts/dashboard-layout-client";
import PayrollPage from "./page";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import type { UserProfileWithCompany } from "@/lib/types/userProfile";
import type { PayrollRecord } from "@/lib/types";

interface PayrollPageClientProps {
  user: UserProfileWithCompany;
}

export function PayrollPageClient({ user }: PayrollPageClientProps) {
  const { theme } = useTheme();
  const [selectedPayrollIds, setSelectedPayrollIds] = useState<Set<string>>(new Set());
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [confirmHandler, setConfirmHandler] = useState<(() => void) | null>(null);
  const [markAsPaidHandler, setMarkAsPaidHandler] = useState<(() => void) | null>(null);

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
        user={user}
        selectedPayrollIds={selectedPayrollIds}
        onSelectedPayrollIdsChange={setSelectedPayrollIds}
        onPayrollsChange={setPayrolls}
        onConfirmHandlerChange={handleConfirmHandlerChange}
        onMarkAsPaidHandlerChange={handleMarkAsPaidHandlerChange}
      />
    </DashboardLayoutClient>
  );
}

