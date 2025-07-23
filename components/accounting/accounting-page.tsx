"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AccountingOverview from "./accounting-overview"
import AccountingTransactions from "./accounting-transactions"

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className='space-y-4'>
            <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
            <p className="text-gray-500">
              Manage your financial records and transactions
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-muted">
              <TabsList className="inline-flex h-12 items-center justify-start p-0 bg-transparent border-none">
                <TabsTrigger
                  value="overview"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
                >
                  Overview
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="transactions"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
                >
                  Transactions
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="reconcile"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[120px] border-none"
                >
                  Reconcile
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="chart-of-accounts"
                  className="group relative px-4 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-300 ease-in-out data-[state=active]:text-primary data-[state=active]:shadow-none min-w-[140px] border-none"
                >
                  Chart of Accounts
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="container mx-auto py-4 space-y-6">
              <AccountingOverview />
            </TabsContent>

            <TabsContent value="transactions" className="container mx-auto py-4 space-y-6">
              <AccountingTransactions />
            </TabsContent>

            <TabsContent value="reconcile" className="container mx-auto py-4 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Reconcile</h2>
                  <p className="text-gray-500">
                    This is the reconcile tab. Bank reconciliation and account balancing tools will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chart-of-accounts" className="container mx-auto py-4 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Chart of Accounts</h2>
                  <p className="text-gray-500">
                    This is the chart of accounts tab. Account structure and management will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 