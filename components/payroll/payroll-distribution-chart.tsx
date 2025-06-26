"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { PayrollRecord } from "@/lib/types"

interface PayrollDistributionChartProps {
  payrolls: PayrollRecord[]
  maxWorkers?: number // Optional limit for number of workers to display
}

// Color palette that complements the app
const colors = {
  primary: '#6366f1', // Indigo
  secondary: '#8b5cf6', // Violet
  success: '#059669', // Emerald
  warning: '#d97706', // Amber
  danger: '#dc2626', // Red
  neutral: '#6b7280', // Gray
  muted: '#9ca3af', // Gray-400
  blue: '#3b82f6', // Blue
}

export function PayrollDistributionChart({ payrolls, maxWorkers }: PayrollDistributionChartProps) {
  const chartData = useMemo(() => {
    // Group payrolls by worker and calculate total gross pay
    const workerTotals = payrolls.reduce((acc, payroll) => {
      const workerName = payroll.worker_name || 'Unknown'
      if (!acc[workerName]) {
        acc[workerName] = {
          name: workerName,
          grossPay: 0,
          netPay: 0,
          totalHours: 0,
        }
      }
      acc[workerName].grossPay += payroll.gross_pay
      acc[workerName].netPay += payroll.net_pay
      acc[workerName].totalHours += payroll.total_hours
      return acc
    }, {} as Record<string, { name: string; grossPay: number; netPay: number; totalHours: number }>)

    // Convert to array and sort by gross pay (descending)
    let sortedData = Object.values(workerTotals)
      .sort((a, b) => b.grossPay - a.grossPay)
      .map((worker) => ({
        name: worker.name,
        grossPay: Math.round(worker.grossPay * 100) / 100,
        netPay: Math.round(worker.netPay * 100) / 100,
        totalHours: Math.round(worker.totalHours * 10) / 10,
      }))

    // Apply maxWorkers limit if specified
    if (maxWorkers && maxWorkers > 0) {
      sortedData = sortedData.slice(0, maxWorkers)
    }

    return sortedData
  }, [payrolls, maxWorkers])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BS', {
      style: 'currency',
      currency: 'BSD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No payroll data available</h3>
          <p className="text-sm">Payroll distribution chart will appear here when data is available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis 
            dataKey="name" 
            className="text-sm text-muted-foreground"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={80}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={{ stroke: 'var(--border)' }}
          />
          <YAxis 
            className="text-sm text-muted-foreground"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={{ stroke: 'var(--border)' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number, name: string) => [
              <span key="value" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                {name === 'grossPay' ? formatCurrency(value) : `${value.toFixed(1)}h`}
              </span>, 
              name === 'grossPay' ? 'Gross Pay' : name === 'totalHours' ? 'Hours' : name
            ]}
            labelStyle={{ color: 'var(--primary)', fontWeight: 600 }}
            itemStyle={{ color: 'var(--primary)' }}
          />
          <Bar 
            dataKey="grossPay" 
            fill={colors.blue}
            radius={[6, 6, 0, 0]}
            name="Gross Pay"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 