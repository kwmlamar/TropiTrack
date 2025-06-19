"use client"

import { useState, useEffect } from "react"
import { PayrollHeader } from "@/components/payroll/payroll-header"
import { PayrollTable } from "@/components/payroll/payroll-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAggregatedPayrolls } from "@/lib/data/payroll"
import type { PayrollRecord } from "@/lib/types"
import type { User } from "@supabase/supabase-js"
import type { DateRange } from "react-day-picker"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { Button } from "@/components/ui/button"
import { CheckCircle, Search, SlidersHorizontal, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { updatePayrollStatus } from "@/lib/data/payroll"
import { toast } from "sonner"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const ITEMS_PER_PAGE = 10;

export default function PayrollPage({ user }: { user: User }) {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [filteredPayrolls, setFilteredPayrolls] = useState<PayrollRecord[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [payPeriodType, setPayPeriodType] = useState<string>("weekly")
  const [selectedPayrollIds, setSelectedPayrollIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [weekStartDay, setWeekStartDay] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(1) // Default to Monday

  const {
    loading: settingsLoading,
    payrollSettings,
    paymentSchedule,
    calculateDeductions,
  } = usePayrollSettings()

  // Initialize week start day from payroll settings
  useEffect(() => {
    if (!settingsLoading && paymentSchedule?.period_start_type === "day_of_week") {
      const dayMap: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
        1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0,
      }
      const newWeekStartDay = dayMap[paymentSchedule.period_start_day] || 1
      setWeekStartDay(newWeekStartDay)
      
      // Update date range to use the new week start day
      if (!dateRange) {
        setDateRange({
          from: startOfWeek(new Date(), { weekStartsOn: newWeekStartDay }),
          to: endOfWeek(new Date(), { weekStartsOn: newWeekStartDay }),
        })
      }
    }
  }, [paymentSchedule, settingsLoading, dateRange])

  useEffect(() => {
    if (!settingsLoading) {
      setPayPeriodType("weekly")
    }
  }, [settingsLoading])

  useEffect(() => {
    loadPayroll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateRange, payPeriodType])

  // Filter payrolls based on search term
  useEffect(() => {
    const filtered = payrolls.filter(payroll => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        payroll.worker_name?.toLowerCase().includes(searchLower) ||
        payroll.position?.toLowerCase().includes(searchLower) ||
        payroll.status?.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredPayrolls(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [payrolls, searchTerm]);

  const loadPayroll = async () => {
    try {
      const filters: { date_from?: string; date_to?: string; target_period_type: "weekly" | "bi-weekly" | "monthly" } = {
        target_period_type: payPeriodType as "weekly" | "bi-weekly" | "monthly"
      }

      if (dateRange?.from) {
        filters.date_from = format(dateRange.from, "yyyy-MM-dd")
      }
      if (dateRange?.to) {
        filters.date_to = format(dateRange.to, "yyyy-MM-dd")
      }

      const response = await getAggregatedPayrolls(filters)
      if (response.data) {
        // Apply deductions based on settings
        const processedPayrolls = response.data.map(payroll => {
          const overtimePay = payroll.overtime_hours * (payroll.hourly_rate * (payrollSettings?.overtime_rate || 1.5))
          const { nibDeduction, otherDeductions } = calculateDeductions(payroll.gross_pay, overtimePay)
          
          return {
            ...payroll,
            nib_deduction: nibDeduction,
            other_deductions: otherDeductions,
            total_deductions: nibDeduction + otherDeductions,
            net_pay: payroll.gross_pay - (nibDeduction + otherDeductions),
          }
        })
        setPayrolls(processedPayrolls)
      }
    } catch (error) {
      console.error('Failed to load payroll data:', error)
    }
  }

  const handlePreviousWeek = () => {
    if (dateRange?.from) {
      const newFrom = startOfWeek(new Date(dateRange.from), { weekStartsOn: weekStartDay })
      newFrom.setDate(newFrom.getDate() - 7)
      const newTo = endOfWeek(new Date(dateRange.from), { weekStartsOn: weekStartDay })
      newTo.setDate(newTo.getDate() - 7)
      setDateRange({ from: newFrom, to: newTo })
    }
  }

  const handleNextWeek = () => {
    if (dateRange?.from) {
      const newFrom = startOfWeek(new Date(dateRange.from), { weekStartsOn: weekStartDay })
      newFrom.setDate(newFrom.getDate() + 7)
      const newTo = endOfWeek(new Date(dateRange.from), { weekStartsOn: weekStartDay })
      newTo.setDate(newTo.getDate() + 7)
      setDateRange({ from: newFrom, to: newTo })
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredPayrolls.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPayrolls = filteredPayrolls.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate summary data from payrolls
  const totalGrossPay = payrolls.reduce((sum, record) => sum + record.gross_pay, 0)
  const totalNibDeductions = payrolls.reduce((sum, record) => sum + record.nib_deduction, 0)

  const handleMarkAsPaid = async () => {
    if (selectedPayrollIds.size === 0) {
      return
    }

    const payrollIdsToUpdate = Array.from(selectedPayrollIds)
    const result = await updatePayrollStatus(payrollIdsToUpdate, "paid")

    if (result.success) {
      toast.success("Selected payrolls marked as paid.")
      setSelectedPayrollIds(new Set())
      loadPayroll() // Refresh payroll data
    } else {
      toast.error("Failed to mark payrolls as paid.", {
        description: result.error || "An unknown error occurred.",
      })
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <PayrollHeader />

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b border-muted">
            <TabsList className="inline-flex h-12 items-center justify-start p-0 bg-transparent border-none">
              <TabsTrigger
                value="overview"
                className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
              >
                Overview
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>

              <TabsTrigger
                value="payments"
                className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
              >
                Payments
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>

              <TabsTrigger
                value="reports"
                className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[100px] border-none"
              >
                Reports
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Payroll Overview Header */}
            <div className="space-y-4 mt-4">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Payroll Overview
              </h2>
              <p className="text-muted-foreground">
                {payPeriodType.charAt(0).toUpperCase() + payPeriodType.slice(1)} Payroll Summary:
                {dateRange?.from && dateRange?.to
                  ? ` ${format(dateRange.from, "MMM d")}-${format(dateRange.to, "MMM d, yyyy")}`
                  : " Select a date range"}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="group border-border/50 bg-gradient-to-b from-[#E8EDF5] to-[#E8EDF5]/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-border/80">
                <CardContent className="px-6 py-4">
                  <div className="space-y-2">
                    <p className="text-base font-medium text-primary">Total Payroll</p>
                    <p className="text-3xl font-bold tracking-tight text-primary">
                      {new Intl.NumberFormat("en-BS", {
                        style: "currency",
                        currency: "BSD",
                        minimumFractionDigits: 2,
                      }).format(totalGrossPay)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="group border-border/50 bg-gradient-to-b from-[#E8EDF5] to-[#E8EDF5]/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-border/80">
                <CardContent className="px-6 py-4">
                  <div className="space-y-2">
                    <p className="text-base font-medium text-primary">Total Workers</p>
                    <p className="text-3xl font-bold tracking-tight text-primary">
                      {payrolls.length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="group border-border/50 bg-gradient-to-b from-[#E8EDF5] to-[#E8EDF5]/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-border/80">
                <CardContent className="px-6 py-4">
                  <div className="space-y-2">
                    <p className="text-base font-medium text-primary">NIB Remittance</p>
                    <p className="text-3xl font-bold tracking-tight text-primary">
                      {new Intl.NumberFormat("en-BS", {
                        style: "currency",
                        currency: "BSD",
                        minimumFractionDigits: 2,
                      }).format(totalNibDeductions)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="space-y-6 overflow-x-auto">
                {/* Search, Filters, and Actions Row */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 backdrop-blur-sm">
                  {/* Navigation Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handlePreviousWeek}
                      className="h-10 w-10 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleNextWeek}
                      className="h-10 w-10 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Search Bar */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search payroll records..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Filters Button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters

                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-4">
                      <DropdownMenuLabel className="text-base font-semibold">
                        Filter Payroll
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* Pay Period Type Filter */}
                      <div className="space-y-3 py-2">
                        <Label className="text-sm font-medium">Pay Period Type</Label>
                        <Select value={payPeriodType} onValueChange={setPayPeriodType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pay period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Date Range Filter */}
                      <div className="space-y-3 py-2">
                        <Label className="text-sm font-medium">Date Range</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarDays className="mr-2 h-4 w-4" />
                              {dateRange?.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(dateRange.from, "LLL dd, y")
                                )
                              ) : (
                                <span>Pick a date range</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              defaultMonth={dateRange?.from}
                              selected={dateRange}
                              onSelect={setDateRange}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <Separator />

                      {/* Clear Filters */}
                      {(dateRange?.from || dateRange?.to || payPeriodType !== "bi-weekly") && (
                        <div className="pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDateRange(undefined);
                              setPayPeriodType("bi-weekly");
                            }}
                            className="w-full justify-start text-muted-foreground hover:text-foreground"
                          >
                            Clear all filters
                          </Button>
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Mark as Paid Button */}
                  <Button
                    onClick={handleMarkAsPaid}
                    disabled={selectedPayrollIds.size === 0}
                    className="bg-[#E8EDF5] hover:bg-[#E8EDF5]/90 text-primary shadow-lg"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                </div>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="px-6">
                    <PayrollTable
                      data={paginatedPayrolls}
                      selectedPayrollIds={selectedPayrollIds}
                      setSelectedPayrollIds={setSelectedPayrollIds}
                    />
                  </CardContent>
                </Card>

                {/* Pagination Controls */}
                {filteredPayrolls.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/30">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredPayrolls.length)} of {filteredPayrolls.length} payroll records
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className={`h-8 w-8 p-0 ${
                              currentPage === page 
                                ? "bg-[#E8EDF5] text-primary border-[#E8EDF5]" 
                                : "hover:bg-[#E8EDF5]/70"
                            }`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Payment Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage payroll payments and payment schedules.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-muted-foreground">Payment management features coming soon...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Payroll Reports</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generate and view detailed payroll reports and analytics.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-muted-foreground">Reporting features coming soon...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
