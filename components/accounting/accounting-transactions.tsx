"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
  MoreHorizontal, 
  Download,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { getTransactions, deleteTransaction } from "@/lib/data/transactions"
import type { Transaction } from "@/lib/types"
import { toast } from "sonner"
import { NewTransactionButton } from "@/components/forms/transaction-sheet"
import { format, parseISO } from "date-fns"
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import { TransactionForm } from "@/components/forms/transaction-form"

const categories = [
  "All Categories",
  "Income",
  "Expenses",
  "Equipment",
  "Materials",
  "Labor",
  "Insurance",
  "Utilities",
  "Wages Payable"
]

const statuses = [
  "All Statuses",
  "completed",
  "pending",
  "failed",
  "cancelled"
]

const ITEMS_PER_PAGE = 20;

export default function AccountingTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedStatus, setSelectedStatus] = useState("All Statuses")
  const [selectedType, setSelectedType] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const response = await getTransactions()
      if (response.success && response.data) {
        setTransactions(response.data)
      } else {
        console.error("Failed to load transactions:", response.error)
        toast.error("Failed to load transactions")
      }
    } catch (error) {
      console.error("Error loading transactions:", error)
      toast.error("Error loading transactions")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const response = await deleteTransaction(transactionId)
      if (response.success) {
        toast.success("Transaction deleted successfully")
        loadTransactions() // Reload stats
      } else {
        toast.error("Failed to delete transaction")
      }
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast.error("Error deleting transaction")
    }
  }

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === "All Categories" || transaction.category === selectedCategory
    const matchesStatus = selectedStatus === "All Statuses" || transaction.status === selectedStatus
    const matchesType = selectedType === "all" || transaction.type === selectedType

    return matchesSearch && matchesCategory && matchesStatus && matchesType
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, selectedType]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        label: "Completed",
        className: "bg-success/10 text-success border-success/20 hover:bg-success/20 dark:bg-success/20 dark:text-success-foreground dark:border-success/30 px-3 py-1 text-xs font-medium",
      },
      pending: {
        label: "Pending",
        className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 dark:bg-warning/20 dark:text-warning-foreground dark:border-warning/30 px-3 py-1 text-xs font-medium",
      },
      failed: {
        label: "Failed",
        className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 dark:bg-destructive/20 dark:text-destructive-foreground dark:border-destructive/30 px-3 py-1 text-xs font-medium",
      },
      cancelled: {
        label: "Cancelled",
        className: "bg-muted/10 text-gray-500 border-muted/20 hover:bg-muted/20 dark:bg-muted/20 dark:text-gray-500 dark:border-muted/30 px-3 py-1 text-xs font-medium",
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
    const date = parseISO(dateString)
    return format(date, 'MMM dd, yyyy')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading transactions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Transactions</h2>
          <p className="text-sm text-gray-500">
            {transactions.length} total transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          <NewTransactionButton onSuccess={() => {
            loadTransactions()
          }} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
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
              <SelectItem value="liability">Liability</SelectItem>
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
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-background dark:via-background dark:to-muted/20 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-muted/30 bg-muted/20 hover:bg-muted/20">
                  <TableHead className="font-semibold text-sm text-gray-500 py-4 px-6">Transaction ID</TableHead>
                  <TableHead className="font-semibold text-sm text-gray-500 py-4 px-6">Date</TableHead>
                  <TableHead className="font-semibold text-sm text-gray-500 py-4 px-6">Description</TableHead>
                  <TableHead className="font-semibold text-sm text-gray-500 py-4 px-6">Category</TableHead>
                  <TableHead className="font-semibold text-sm text-gray-500 py-4 px-6 text-right">Amount</TableHead>
                  <TableHead className="font-semibold text-sm text-gray-500 py-4 px-6">Status</TableHead>
                  <TableHead className="font-semibold text-sm text-gray-500 py-4 px-6">Account</TableHead>
                  <TableHead className="font-semibold text-sm text-gray-500 py-4 px-6">Reference</TableHead>
                  <TableHead className="font-semibold text-sm text-gray-500 py-4 px-6 w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id} 
                    className="hover:bg-muted/40 transition-all duration-200 border-b border-muted/20 last:border-b-0 group"
                  >
                    <TableCell className="font-medium text-sm py-4 px-6">
                      <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded-md">
                        {transaction.transaction_id}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-gray-500" />
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
                      <span className="text-gray-500">{transaction.account}</span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {transaction.reference && (
                        <span className="font-mono text-xs bg-muted/30 px-2 py-1 rounded text-gray-500">
                          {transaction.reference}
                        </span>
                      )}
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
                          <DropdownMenuItem 
                            className="text-sm"
                            onClick={() => setEditingTransaction(transaction)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Transaction
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-sm text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
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
                <DollarSign className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-500 mb-2">No transactions found</h3>
              <p className="text-sm text-gray-500 text-center max-w-sm">
                {searchTerm || selectedCategory !== "All Categories" || selectedStatus !== "All Statuses" || selectedType !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Get started by creating your first transaction"
                }
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredTransactions.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
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
                          ? "bg-[#E8EDF5] text-primary border-[#E8EDF5] dark:bg-primary dark:text-primary-foreground dark:border-primary" 
                          : "hover:bg-[#E8EDF5]/70 dark:hover:bg-primary dark:hover:text-primary-foreground"
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
        </CardContent>
      </Card>

      {/* Edit Transaction Sheet */}
      {editingTransaction && (
        <Sheet open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
          <SheetContent side="right" className="w-[50%]">
            <SheetHeader>
              <SheetTitle>Edit Transaction</SheetTitle>
              <SheetDescription>
                Update the transaction details.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-0">
              <TransactionForm
                transaction={editingTransaction}
                onSuccess={() => {
                  setEditingTransaction(null)
                  loadTransactions()
                }}
                onCancel={() => setEditingTransaction(null)}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
} 