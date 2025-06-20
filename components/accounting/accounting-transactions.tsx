"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"

// Sample transaction data
const transactions = [
  {
    id: "TXN-001",
    date: "2024-01-15",
    description: "Office Supplies Purchase",
    category: "Expenses",
    type: "expense",
    amount: 1250.00,
    status: "completed",
    account: "Business Account",
    reference: "INV-2024-001"
  },
  {
    id: "TXN-002",
    date: "2024-01-14",
    description: "Client Payment - Project Alpha",
    category: "Income",
    type: "income",
    amount: 15000.00,
    status: "completed",
    account: "Business Account",
    reference: "PAY-2024-001"
  },
  {
    id: "TXN-003",
    date: "2024-01-13",
    description: "Equipment Rental",
    category: "Expenses",
    type: "expense",
    amount: 850.00,
    status: "pending",
    account: "Business Account",
    reference: "INV-2024-002"
  },
  {
    id: "TXN-004",
    date: "2024-01-12",
    description: "Subcontractor Payment",
    category: "Expenses",
    type: "expense",
    amount: 3200.00,
    status: "completed",
    account: "Business Account",
    reference: "PAY-2024-002"
  },
  {
    id: "TXN-005",
    date: "2024-01-11",
    description: "Client Payment - Project Beta",
    category: "Income",
    type: "income",
    amount: 8500.00,
    status: "completed",
    account: "Business Account",
    reference: "PAY-2024-003"
  },
  {
    id: "TXN-006",
    date: "2024-01-10",
    description: "Insurance Premium",
    category: "Expenses",
    type: "expense",
    amount: 1200.00,
    status: "completed",
    account: "Business Account",
    reference: "INV-2024-003"
  },
  {
    id: "TXN-007",
    date: "2024-01-09",
    description: "Client Payment - Project Gamma",
    category: "Income",
    type: "income",
    amount: 22000.00,
    status: "pending",
    account: "Business Account",
    reference: "PAY-2024-004"
  },
  {
    id: "TXN-008",
    date: "2024-01-08",
    description: "Utility Bills",
    category: "Expenses",
    type: "expense",
    amount: 450.00,
    status: "completed",
    account: "Business Account",
    reference: "INV-2024-004"
  }
]

const categories = [
  "All Categories",
  "Income",
  "Expenses",
  "Equipment",
  "Materials",
  "Labor",
  "Insurance",
  "Utilities"
]

const statuses = [
  "All Statuses",
  "completed",
  "pending",
  "failed",
  "cancelled"
]

export default function AccountingTransactions() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedStatus, setSelectedStatus] = useState("All Statuses")
  const [selectedType, setSelectedType] = useState("all")

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "All Categories" || transaction.category === selectedCategory
    const matchesStatus = selectedStatus === "All Statuses" || transaction.status === selectedStatus
    const matchesType = selectedType === "all" || transaction.type === selectedType

    return matchesSearch && matchesCategory && matchesStatus && matchesType
  })

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const netAmount = totalIncome - totalExpenses

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        label: "Completed",
        className: "bg-[#E8EDF5] text-primary px-3 py-1 text-xs font-medium",
      },
      pending: {
        label: "Pending",
        className: "bg-[#E8EDF5] text-primary px-3 py-1 text-xs font-medium",
      },
      failed: {
        label: "Failed",
        className: "bg-[#E8EDF5] text-primary px-3 py-1 text-xs font-medium",
      },
      cancelled: {
        label: "Cancelled",
        className: "bg-[#E8EDF5] text-primary px-3 py-1 text-xs font-medium",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Transactions</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm">
            New Transaction
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-muted/30 bg-muted/20 hover:bg-muted/20">
                  <TableHead className="font-semibold text-sm text-muted-foreground py-4 px-6">Transaction ID</TableHead>
                  <TableHead className="font-semibold text-sm text-muted-foreground py-4 px-6">Date</TableHead>
                  <TableHead className="font-semibold text-sm text-muted-foreground py-4 px-6">Description</TableHead>
                  <TableHead className="font-semibold text-sm text-muted-foreground py-4 px-6">Category</TableHead>
                  <TableHead className="font-semibold text-sm text-muted-foreground py-4 px-6 text-right">Amount</TableHead>
                  <TableHead className="font-semibold text-sm text-muted-foreground py-4 px-6">Status</TableHead>
                  <TableHead className="font-semibold text-sm text-muted-foreground py-4 px-6">Account</TableHead>
                  <TableHead className="font-semibold text-sm text-muted-foreground py-4 px-6">Reference</TableHead>
                  <TableHead className="font-semibold text-sm text-muted-foreground py-4 px-6 w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction, index) => (
                  <TableRow 
                    key={transaction.id} 
                    className="hover:bg-muted/40 transition-all duration-200 border-b border-muted/20 last:border-b-0 group"
                  >
                    <TableCell className="font-medium text-sm py-4 px-6">
                      <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded-md">
                        {transaction.id}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(transaction.date)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs py-4 px-6">
                      <div className="truncate font-medium">{transaction.description}</div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge variant="outline" className="text-xs font-medium">
                        {transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-semibold text-sm py-4 px-6 text-right ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-3 w-3 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-600" />
                        )}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell className="text-sm py-4 px-6">
                      <span className="text-muted-foreground">{transaction.account}</span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="font-mono text-xs bg-muted/30 px-2 py-1 rounded text-muted-foreground">
                        {transaction.reference}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted/60"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs font-medium">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Transaction
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-sm text-red-600 focus:text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Transaction
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Empty State */}
          {filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No transactions found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {searchTerm || selectedCategory !== "All Categories" || selectedStatus !== "All Statuses" || selectedType !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Get started by creating your first transaction"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 