"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { getTransactionStats, getCashFlowData, getExpensesByCategory, getTransactionStatusBreakdown } from "@/lib/data/transactions"

// Neutral color palette that complements the app
const colors = {
  primary: '#6366f1', // Indigo
  secondary: '#8b5cf6', // Violet
  success: '#059669', // Emerald
  warning: '#d97706', // Amber
  danger: '#dc2626', // Red
  neutral: '#6b7280', // Gray
  muted: '#9ca3af', // Gray-400
}

export default function AccountingOverview() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalLiabilities: 0,
    netAmount: 0,
    transactionCount: 0
  })
  const [cashFlowData, setCashFlowData] = useState<Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>>([])
  const [expensesData, setExpensesData] = useState<Array<{
    category: string;
    amount: number;
  }>>([])
  const [statusData, setStatusData] = useState<Array<{
    status: string;
    amount: number;
  }>>([])

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      
      // Load all data in parallel
      const [statsResponse, cashFlowResponse, expensesResponse, statusResponse] = await Promise.all([
        getTransactionStats(),
        getCashFlowData(),
        getExpensesByCategory(),
        getTransactionStatusBreakdown()
      ])

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }

      if (cashFlowResponse.success && cashFlowResponse.data) {
        setCashFlowData(cashFlowResponse.data)
      }

      if (expensesResponse.success && expensesResponse.data) {
        setExpensesData(expensesResponse.data)
      }

      if (statusResponse.success && statusResponse.data) {
        setStatusData(statusResponse.data)
      }
    } catch (error) {
      console.error("Error loading accounting data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading accounting data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cash Flow Line Chart */}
        <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-background dark:via-background dark:to-muted/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold">Cash Flow</div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(stats.netAmount)}</div>
                <div className="text-sm font-normal mt-1">
                  <span className="text-muted-foreground">This year </span>
                  <span className={stats.netAmount >= 0 ? "text-green-600" : "text-red-600"}>
                    {stats.netAmount >= 0 ? "+" : ""}{((stats.netAmount / (stats.totalIncome || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.success} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={colors.success} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.danger} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={colors.danger} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="month" 
                    className="text-sm text-muted-foreground"
                    tick={{ fill: 'var(--primary)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis 
                    className="text-sm text-muted-foreground"
                    tick={{ fill: 'var(--primary)', fontSize: 12 }}
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
                    formatter={(value: number) => [
                      <span key="value" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        ${value.toLocaleString()}
                      </span>, 
                      ''
                    ]}
                    labelStyle={{ color: 'var(--primary)', fontWeight: 600 }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke={colors.success}
                    strokeWidth={3}
                    name="Income"
                    dot={{ fill: colors.success, strokeWidth: 2, r: 6, stroke: 'white' }}
                    activeDot={{ r: 8, stroke: colors.success, strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke={colors.danger}
                    strokeWidth={3}
                    name="Expenses"
                    dot={{ fill: colors.danger, strokeWidth: 2, r: 6, stroke: 'white' }}
                    activeDot={{ r: 8, stroke: colors.danger, strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    stroke={colors.primary}
                    strokeWidth={4}
                    name="Net Cash Flow"
                    dot={{ fill: colors.primary, strokeWidth: 2, r: 7, stroke: 'white' }}
                    activeDot={{ r: 9, stroke: colors.primary, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Bar Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-background dark:via-background dark:to-muted/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Expenses by Category</div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(stats.totalExpenses)}</div>
                <div className="text-sm font-normal mt-1">
                  <span className="text-muted-foreground">This year </span>
                  <span className="text-red-600">-{((stats.totalExpenses / (stats.totalIncome || 1)) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="category" 
                    className="text-sm text-muted-foreground"
                    tick={{ fill: 'var(--primary)', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis 
                    className="text-sm text-muted-foreground"
                    tick={{ fill: 'var(--primary)', fontSize: 11 }}
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
                    formatter={(value: number) => [
                      <span key="value" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        ${value.toLocaleString()}
                      </span>, 
                      ''
                    ]}
                    labelStyle={{ color: 'var(--primary)', fontWeight: 600 }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill={colors.danger}
                    radius={[6, 6, 0, 0]}
                    name="Amount"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Bar Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-background dark:via-background dark:to-muted/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Invoices</div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(stats.totalIncome)}</div>
                <div className="text-sm font-normal mt-1">
                  <span className="text-muted-foreground">This year </span>
                  <span className="text-green-600">+{((stats.totalIncome / (stats.totalIncome + stats.totalExpenses || 1)) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="status" 
                    className="text-sm text-muted-foreground"
                    tick={{ fill: 'var(--primary)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis 
                    className="text-sm text-muted-foreground"
                    tick={{ fill: 'var(--primary)', fontSize: 11 }}
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
                    formatter={(value: number) => [
                      <span key="value" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        ${value.toLocaleString()}
                      </span>, 
                      ''
                    ]}
                    labelStyle={{ color: 'var(--primary)', fontWeight: 600 }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill={colors.success}
                    radius={[6, 6, 0, 0]}
                    name="Amount"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 