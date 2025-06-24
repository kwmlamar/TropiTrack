"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PayrollDistributionChart } from "./payroll-distribution-chart"
import type { PayrollRecord } from "@/lib/types"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, format } from "date-fns"

interface PayrollReportsProps {
  payrolls: PayrollRecord[]
}

const ITEMS_PER_PAGE = 10

export function PayrollReports({ payrolls }: PayrollReportsProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [dateRange, setDateRange] = useState("this-week")

  // Calculate date ranges
  const getDateRange = (range: string) => {
    const now = new Date()
    
    switch (range) {
      case "this-week":
        return {
          from: startOfWeek(now, { weekStartsOn: 1 }), // Monday start
          to: endOfWeek(now, { weekStartsOn: 1 })
        }
      case "last-week":
        const lastWeek = subWeeks(now, 1)
        return {
          from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          to: endOfWeek(lastWeek, { weekStartsOn: 1 })
        }
      case "this-month":
        return {
          from: startOfMonth(now),
          to: endOfMonth(now)
        }
      case "last-month":
        const lastMonth = subMonths(now, 1)
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth)
        }
      default:
        return {
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: endOfWeek(now, { weekStartsOn: 1 })
        }
    }
  }

  // Filter payrolls based on selected date range
  const filteredPayrolls = useMemo(() => {
    const { from, to } = getDateRange(dateRange)
    
    return payrolls.filter(payroll => {
      const payrollDate = new Date(payroll.created_at)
      return payrollDate >= from && payrollDate <= to
    })
  }, [payrolls, dateRange])

  // Aggregate payroll data by worker
  const aggregatedPayrolls = useMemo(() => {
    const workerMap = new Map<string, {
      worker_id: string
      worker_name: string
      position: string
      hourly_rate: number
      total_hours: number
      overtime_hours: number
      gross_pay: number
      net_pay: number
      nib_deduction: number
      status: string
      project_name?: string
      payroll_count: number
    }>()

    filteredPayrolls.forEach(payroll => {
      const key = payroll.worker_id || payroll.worker_name
      
      if (workerMap.has(key)) {
        const existing = workerMap.get(key)!
        existing.total_hours += payroll.total_hours
        existing.overtime_hours += payroll.overtime_hours
        existing.gross_pay += payroll.gross_pay
        existing.net_pay += payroll.net_pay
        existing.nib_deduction += payroll.nib_deduction
        existing.payroll_count += 1
        // Use the most recent status or keep existing if it's "paid"
        if (payroll.status === "paid" || existing.status !== "paid") {
          existing.status = payroll.status
        }
      } else {
        workerMap.set(key, {
          worker_id: payroll.worker_id || "",
          worker_name: payroll.worker_name,
          position: payroll.position || "",
          hourly_rate: payroll.hourly_rate,
          total_hours: payroll.total_hours,
          overtime_hours: payroll.overtime_hours,
          gross_pay: payroll.gross_pay,
          net_pay: payroll.net_pay,
          nib_deduction: payroll.nib_deduction,
          status: payroll.status,
          project_name: payroll.project_name,
          payroll_count: 1
        })
      }
    })

    return Array.from(workerMap.values())
  }, [filteredPayrolls])

  const getStatusBadge = (status: PayrollRecord['status']) => {
    const labels = {
      paid: "Paid",
      pending: "Pending",
      confirmed: "Confirmed",
      void: "Void",
    };

    return (
      <Badge className="bg-[#E8EDF5] text-primary border-[#E8EDF5] px-6 py-1 text-sm font-medium">
        {labels[status]}
      </Badge>
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    setCurrentPage(1); // Reset to first page when changing date range
  };

  const getPaginatedAggregatedData = (data: typeof aggregatedPayrolls) => {
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      paginatedData: data.slice(startIndex, endIndex),
      totalPages,
      startIndex,
      endIndex,
      totalItems: data.length
    };
  };

  const PaginationControls = ({ totalPages, startIndex, endIndex, totalItems }: {
    totalPages: number;
    startIndex: number;
    endIndex: number;
    totalItems: number;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/30">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} records
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Reports Header */}
      <div className="space-y-4 mt-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Payroll Reports
        </h2>
        <p className="text-muted-foreground">
          Generate detailed reports and analyze payroll data across different dimensions.
        </p>
      </div>

      {/* Detailed Reports Section */}
      <div className="space-y-6">
        {/* Date Range Filter */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-foreground">Detailed Reports</h3>
            <p className="text-sm text-muted-foreground">
              {(() => {
                const { from, to } = getDateRange(dateRange)
                return `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`
              })()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground">Date Range:</span>
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="payroll-summary" className="w-full">
          <div className="border-b border-muted">
            <TabsList className="inline-flex h-12 items-center justify-start p-0 bg-transparent border-none">
              <TabsTrigger
                value="payroll-summary"
                className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
              >
                Payroll Summary
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>

              <TabsTrigger
                value="worker-detail"
                className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
              >
                Worker Detail
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>

              <TabsTrigger
                value="nib-compliance"
                className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
              >
                NIB Compliance
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>

              <TabsTrigger
                value="overtime-analysis"
                className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
              >
                Overtime Analysis
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>

              <TabsTrigger
                value="project-allocation"
                className="group relative px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
              >
                Project Allocation
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Payroll Summary Tab */}
          <TabsContent value="payroll-summary" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Payroll Summary Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Overview of payroll totals by status and period
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <TableComponent className="min-w-full">
                    <TableHeader>
                      <TableRow className="border-b border-muted/30 bg-muted/20 hover:bg-muted/20">
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Period</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Status</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Workers</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Total Hours</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Gross Pay</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">NIB Deductions</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Net Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const summaryData = [
                          {
                            period: "Current Week",
                            status: "All",
                            workers: aggregatedPayrolls.length,
                            totalHours: aggregatedPayrolls.reduce((sum, p) => sum + p.total_hours, 0),
                            grossPay: aggregatedPayrolls.reduce((sum, p) => sum + p.gross_pay, 0),
                            nibDeductions: aggregatedPayrolls.reduce((sum, p) => sum + p.nib_deduction, 0),
                            netPay: aggregatedPayrolls.reduce((sum, p) => sum + p.net_pay, 0),
                          },
                          {
                            period: "Current Week",
                            status: "Paid",
                            workers: aggregatedPayrolls.filter(p => p.status === "paid").length,
                            totalHours: aggregatedPayrolls.filter(p => p.status === "paid").reduce((sum, p) => sum + p.total_hours, 0),
                            grossPay: aggregatedPayrolls.filter(p => p.status === "paid").reduce((sum, p) => sum + p.gross_pay, 0),
                            nibDeductions: aggregatedPayrolls.filter(p => p.status === "paid").reduce((sum, p) => sum + p.nib_deduction, 0),
                            netPay: aggregatedPayrolls.filter(p => p.status === "paid").reduce((sum, p) => sum + p.net_pay, 0),
                          },
                          {
                            period: "Current Week",
                            status: "Confirmed",
                            workers: aggregatedPayrolls.filter(p => p.status === "confirmed").length,
                            totalHours: aggregatedPayrolls.filter(p => p.status === "confirmed").reduce((sum, p) => sum + p.total_hours, 0),
                            grossPay: aggregatedPayrolls.filter(p => p.status === "confirmed").reduce((sum, p) => sum + p.gross_pay, 0),
                            nibDeductions: aggregatedPayrolls.filter(p => p.status === "confirmed").reduce((sum, p) => sum + p.nib_deduction, 0),
                            netPay: aggregatedPayrolls.filter(p => p.status === "confirmed").reduce((sum, p) => sum + p.net_pay, 0),
                          },
                          {
                            period: "Current Week",
                            status: "Pending",
                            workers: aggregatedPayrolls.filter(p => p.status === "pending").length,
                            totalHours: aggregatedPayrolls.filter(p => p.status === "pending").reduce((sum, p) => sum + p.total_hours, 0),
                            grossPay: aggregatedPayrolls.filter(p => p.status === "pending").reduce((sum, p) => sum + p.gross_pay, 0),
                            nibDeductions: aggregatedPayrolls.filter(p => p.status === "pending").reduce((sum, p) => sum + p.nib_deduction, 0),
                            netPay: aggregatedPayrolls.filter(p => p.status === "pending").reduce((sum, p) => sum + p.net_pay, 0),
                          }
                        ];

                        return summaryData.map((row, index) => (
                          <TableRow key={index} className="border-b border-muted/20 last:border-b-0 hover:bg-muted/40 transition-all duration-200">
                            <TableCell className="py-4 px-6 font-medium">{row.period}</TableCell>
                            <TableCell className="py-4 px-6">
                              <Badge className="bg-[#E8EDF5] text-primary border-[#E8EDF5] px-3 py-1 text-xs">
                                {row.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 px-6">{row.workers}</TableCell>
                            <TableCell className="py-4 px-6">{row.totalHours.toFixed(1)}</TableCell>
                            <TableCell className="py-4 px-6">
                              {new Intl.NumberFormat("en-BS", {
                                style: "currency",
                                currency: "BSD",
                                minimumFractionDigits: 2,
                              }).format(row.grossPay)}
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              {new Intl.NumberFormat("en-BS", {
                                style: "currency",
                                currency: "BSD",
                                minimumFractionDigits: 2,
                              }).format(row.nibDeductions)}
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              {new Intl.NumberFormat("en-BS", {
                                style: "currency",
                                currency: "BSD",
                                minimumFractionDigits: 2,
                              }).format(row.netPay)}
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </TableComponent>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Worker Detail Tab */}
          <TabsContent value="worker-detail" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Worker Detail Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Individual worker payroll breakdown and performance metrics
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <TableComponent className="min-w-full">
                    <TableHeader>
                      <TableRow className="border-b border-muted/30 bg-muted/20 hover:bg-muted/20">
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Worker Name</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Position</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Hourly Rate</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Regular Hours</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Overtime Hours</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Total Hours</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Gross Pay</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Net Pay</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const { paginatedData } = getPaginatedAggregatedData(aggregatedPayrolls);
                        return (
                          <>
                            {paginatedData.map((payroll) => (
                              <TableRow key={payroll.worker_id} className="border-b border-muted/20 last:border-b-0 hover:bg-muted/40 transition-all duration-200">
                                <TableCell className="py-4 px-6 font-medium">{payroll.worker_name}</TableCell>
                                <TableCell className="py-4 px-6 text-sm text-muted-foreground">{payroll.position}</TableCell>
                                <TableCell className="py-4 px-6">
                                  {new Intl.NumberFormat("en-BS", {
                                    style: "currency",
                                    currency: "BSD",
                                    minimumFractionDigits: 2,
                                  }).format(payroll.hourly_rate)}
                                </TableCell>
                                <TableCell className="py-4 px-6">{payroll.total_hours - payroll.overtime_hours}</TableCell>
                                <TableCell className="py-4 px-6">{payroll.overtime_hours}</TableCell>
                                <TableCell className="py-4 px-6 font-medium">{payroll.total_hours}</TableCell>
                                <TableCell className="py-4 px-6">
                                  {new Intl.NumberFormat("en-BS", {
                                    style: "currency",
                                    currency: "BSD",
                                    minimumFractionDigits: 2,
                                  }).format(payroll.gross_pay)}
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  {new Intl.NumberFormat("en-BS", {
                                    style: "currency",
                                    currency: "BSD",
                                    minimumFractionDigits: 2,
                                  }).format(payroll.net_pay)}
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  {getStatusBadge(payroll.status as PayrollRecord['status'])}
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        );
                      })()}
                    </TableBody>
                  </TableComponent>
                </div>
              </CardContent>
            </Card>
            {(() => {
              return <PaginationControls {...getPaginatedAggregatedData(aggregatedPayrolls)} />;
            })()}
          </TabsContent>

          {/* NIB Compliance Tab */}
          <TabsContent value="nib-compliance" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">NIB Compliance Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  National Insurance Board contributions and compliance tracking (Employee: 4.65%, Employer: 6.65%)
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <TableComponent className="min-w-full">
                    <TableHeader>
                      <TableRow className="border-b border-muted/30 bg-muted/20 hover:bg-muted/20">
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Worker Name</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Gross Pay</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Employee NIB (4.65%)</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Employer NIB (6.65%)</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Total NIB</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Net Pay</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Status</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Compliance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const { paginatedData } = getPaginatedAggregatedData(aggregatedPayrolls);
                        return (
                          <>
                            {paginatedData.map((payroll) => {
                              const employeeNibRate = 0.0465; // 4.65%
                              const employerNibRate = 0.0665; // 6.65%
                              const employeeNib = payroll.gross_pay * employeeNibRate;
                              const employerNib = payroll.gross_pay * employerNibRate;
                              const totalNib = employeeNib + employerNib;
                              const isCompliant = employeeNib > 0;
                              
                              return (
                                <TableRow key={payroll.worker_id} className="border-b border-muted/20 last:border-b-0 hover:bg-muted/40 transition-all duration-200">
                                  <TableCell className="py-4 px-6 font-medium">{payroll.worker_name}</TableCell>
                                  <TableCell className="py-4 px-6">
                                    {new Intl.NumberFormat("en-BS", {
                                      style: "currency",
                                      currency: "BSD",
                                      minimumFractionDigits: 2,
                                    }).format(payroll.gross_pay)}
                                  </TableCell>
                                  <TableCell className="py-4 px-6">
                                    {new Intl.NumberFormat("en-BS", {
                                      style: "currency",
                                      currency: "BSD",
                                      minimumFractionDigits: 2,
                                    }).format(employeeNib)}
                                  </TableCell>
                                  <TableCell className="py-4 px-6">
                                    {new Intl.NumberFormat("en-BS", {
                                      style: "currency",
                                      currency: "BSD",
                                      minimumFractionDigits: 2,
                                    }).format(employerNib)}
                                  </TableCell>
                                  <TableCell className="py-4 px-6 font-medium">
                                    {new Intl.NumberFormat("en-BS", {
                                      style: "currency",
                                      currency: "BSD",
                                      minimumFractionDigits: 2,
                                    }).format(totalNib)}
                                  </TableCell>
                                  <TableCell className="py-4 px-6">
                                    {new Intl.NumberFormat("en-BS", {
                                      style: "currency",
                                      currency: "BSD",
                                      minimumFractionDigits: 2,
                                    }).format(payroll.net_pay)}
                                  </TableCell>
                                  <TableCell className="py-4 px-6">
                                    {getStatusBadge(payroll.status as PayrollRecord['status'])}
                                  </TableCell>
                                  <TableCell className="py-4 px-6">
                                    <Badge className={`px-3 py-1 text-xs ${
                                      isCompliant 
                                        ? "bg-green-100 text-green-800 border-green-200" 
                                        : "bg-red-100 text-red-800 border-red-200"
                                    }`}>
                                      {isCompliant ? "Compliant" : "Non-Compliant"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </>
                        );
                      })()}
                    </TableBody>
                  </TableComponent>
                </div>
              </CardContent>
            </Card>
            {(() => {
              return <PaginationControls {...getPaginatedAggregatedData(aggregatedPayrolls)} />;
            })()}
          </TabsContent>

          {/* Overtime Analysis Tab */}
          <TabsContent value="overtime-analysis" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Overtime Analysis Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Overtime hours tracking and cost analysis
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <TableComponent className="min-w-full">
                    <TableHeader>
                      <TableRow className="border-b border-muted/30 bg-muted/20 hover:bg-muted/20">
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Worker Name</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Regular Hours</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Overtime Hours</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Overtime %</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Regular Pay</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Overtime Pay</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Total Pay</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const { paginatedData } = getPaginatedAggregatedData(aggregatedPayrolls);
                        return (
                          <>
                            {paginatedData.map((payroll) => {
                              const regularHours = payroll.total_hours - payroll.overtime_hours;
                              const overtimePercentage = payroll.total_hours > 0 ? (payroll.overtime_hours / payroll.total_hours) * 100 : 0;
                              const regularPay = regularHours * payroll.hourly_rate;
                              const overtimePay = payroll.gross_pay - regularPay;
                              
                              return (
                                <TableRow key={payroll.worker_id} className="border-b border-muted/20 last:border-b-0 hover:bg-muted/40 transition-all duration-200">
                                  <TableCell className="py-4 px-6 font-medium">{payroll.worker_name}</TableCell>
                                  <TableCell className="py-4 px-6">{regularHours.toFixed(1)}</TableCell>
                                  <TableCell className="py-4 px-6 font-medium">{payroll.overtime_hours.toFixed(1)}</TableCell>
                                  <TableCell className="py-4 px-6">
                                    <Badge className={`px-3 py-1 text-xs ${
                                      overtimePercentage > 20 
                                        ? "bg-orange-100 text-orange-800 border-orange-200" 
                                        : "bg-blue-100 text-blue-800 border-blue-200"
                                    }`}>
                                      {overtimePercentage.toFixed(1)}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4 px-6">
                                    {new Intl.NumberFormat("en-BS", {
                                      style: "currency",
                                      currency: "BSD",
                                      minimumFractionDigits: 2,
                                    }).format(regularPay)}
                                  </TableCell>
                                  <TableCell className="py-4 px-6">
                                    {new Intl.NumberFormat("en-BS", {
                                      style: "currency",
                                      currency: "BSD",
                                      minimumFractionDigits: 2,
                                    }).format(overtimePay)}
                                  </TableCell>
                                  <TableCell className="py-4 px-6">
                                    {new Intl.NumberFormat("en-BS", {
                                      style: "currency",
                                      currency: "BSD",
                                      minimumFractionDigits: 2,
                                    }).format(payroll.gross_pay)}
                                  </TableCell>
                                  <TableCell className="py-4 px-6">
                                    {getStatusBadge(payroll.status as PayrollRecord['status'])}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </>
                        );
                      })()}
                    </TableBody>
                  </TableComponent>
                </div>
              </CardContent>
            </Card>
            {(() => {
              return <PaginationControls {...getPaginatedAggregatedData(aggregatedPayrolls)} />;
            })()}
          </TabsContent>

          {/* Project Allocation Tab */}
          <TabsContent value="project-allocation" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Project Allocation Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Payroll costs allocated by project and worker
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <TableComponent className="min-w-full">
                    <TableHeader>
                      <TableRow className="border-b border-muted/30 bg-muted/20 hover:bg-muted/20">
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Project</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Worker Name</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Position</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Hours</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Hourly Rate</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Gross Pay</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Net Pay</TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const { paginatedData } = getPaginatedAggregatedData(aggregatedPayrolls);
                        return (
                          <>
                            {paginatedData.map((payroll) => (
                              <TableRow key={payroll.worker_id} className="border-b border-muted/20 last:border-b-0 hover:bg-muted/40 transition-all duration-200">
                                <TableCell className="py-4 px-6 font-medium">
                                  {payroll.project_name || "Unassigned"}
                                </TableCell>
                                <TableCell className="py-4 px-6 font-medium">{payroll.worker_name}</TableCell>
                                <TableCell className="py-4 px-6 text-sm text-muted-foreground">{payroll.position}</TableCell>
                                <TableCell className="py-4 px-6">{payroll.total_hours.toFixed(1)}</TableCell>
                                <TableCell className="py-4 px-6">
                                  {new Intl.NumberFormat("en-BS", {
                                    style: "currency",
                                    currency: "BSD",
                                    minimumFractionDigits: 2,
                                  }).format(payroll.hourly_rate)}
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  {new Intl.NumberFormat("en-BS", {
                                    style: "currency",
                                    currency: "BSD",
                                    minimumFractionDigits: 2,
                                  }).format(payroll.gross_pay)}
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  {new Intl.NumberFormat("en-BS", {
                                    style: "currency",
                                    currency: "BSD",
                                    minimumFractionDigits: 2,
                                  }).format(payroll.net_pay)}
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  {getStatusBadge(payroll.status as PayrollRecord['status'])}
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        );
                      })()}
                    </TableBody>
                  </TableComponent>
                </div>
              </CardContent>
            </Card>
            {(() => {
              return <PaginationControls {...getPaginatedAggregatedData(aggregatedPayrolls)} />;
            })()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Visual Analytics Section */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Visual Analytics</h3>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Payroll Distribution</div>
                  <div className="text-2xl font-bold text-primary mt-1">
                    {new Intl.NumberFormat("en-BS", {
                      style: "currency",
                      currency: "BSD",
                      minimumFractionDigits: 0,
                    }).format(aggregatedPayrolls.reduce((sum, payroll) => sum + payroll.gross_pay, 0))}
                  </div>
                  <div className="text-sm font-normal mt-1">
                    <span className="text-muted-foreground">Total gross pay across </span>
                    <span className="text-primary font-medium">{aggregatedPayrolls.length} workers</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <PayrollDistributionChart payrolls={aggregatedPayrolls.map(p => ({
                id: p.worker_id,
                worker_id: p.worker_id,
                worker_name: p.worker_name,
                total_hours: p.total_hours,
                overtime_hours: p.overtime_hours,
                hourly_rate: p.hourly_rate,
                gross_pay: p.gross_pay,
                nib_deduction: p.nib_deduction,
                other_deductions: 0,
                total_deductions: p.nib_deduction,
                net_pay: p.net_pay,
                position: p.position,
                department: "",
                status: p.status as PayrollRecord['status'],
                company_id: "",
                project_id: "",
                project_name: p.project_name,
                created_at: "",
                updated_at: "",
                pay_period_start: "",
                pay_period_end: ""
              }))} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 