"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Receipt } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

// Sample data for charts
const cashFlowData = [
  { month: 'Jan', income: 45000, expenses: 32000, net: 13000 },
  { month: 'Feb', income: 52000, expenses: 38000, net: 14000 },
  { month: 'Mar', income: 48000, expenses: 35000, net: 13000 },
  { month: 'Apr', income: 61000, expenses: 42000, net: 19000 },
  { month: 'May', income: 55000, expenses: 39000, net: 16000 },
  { month: 'Jun', income: 67000, expenses: 45000, net: 22000 },
]

const expensesData = [
  { category: 'Materials', amount: 25000 },
  { category: 'Labor', amount: 35000 },
  { category: 'Equipment', amount: 15000 },
  { category: 'Subcontractors', amount: 20000 },
  { category: 'Overhead', amount: 12000 },
  { category: 'Insurance', amount: 8000 },
]

const invoicesData = [
  { status: 'Paid', amount: 85000 },
  { status: 'Pending', amount: 45000 },
  { status: 'Overdue', amount: 15000 },
  { status: 'Draft', amount: 25000 },
]

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
  return (
    <div className="space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cash Flow Line Chart */}
        <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold">Cash Flow</div>
                <div className="text-2xl font-bold text-primary mt-1">$170,000</div>
                <div className="text-sm font-normal mt-1">
                  <span className="text-muted-foreground">This year </span>
                  <span className="text-green-600">+23.5%</span>
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
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    className="text-sm text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Expenses</div>
                <div className="text-2xl font-bold text-primary mt-1">$115,000</div>
                <div className="text-sm font-normal mt-1">
                  <span className="text-muted-foreground">This year </span>
                  <span className="text-red-600">-12.3%</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="category" 
                    className="text-sm text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    className="text-sm text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Invoices</div>
                <div className="text-2xl font-bold text-primary mt-1">$170,000</div>
                <div className="text-sm font-normal mt-1">
                  <span className="text-muted-foreground">This year </span>
                  <span className="text-green-600">+15.8%</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={invoicesData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="status" 
                    className="text-sm text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    className="text-sm text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
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