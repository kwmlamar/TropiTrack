import { supabase } from "@/lib/supabaseClient";
import type { Transaction, CreateTransactionInput, UpdateTransactionInput, TransactionFilters, ApiResponse } from "@/lib/types";
import { getUserProfileWithCompany } from "@/lib/data/userProfiles";
import { escapeSearchTerm } from "@/lib/utils";

// Helper function to generate unique transaction ID
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN-${timestamp}-${random}`.toUpperCase();
}

// Map database record to Transaction type
function mapTransactionRecord(data: {
  id: string;
  company_id: string;
  transaction_id: string;
  date: string;
  description: string;
  category: string;
  type: string;
  amount: number;
  status: string;
  account: string;
  reference: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}): Transaction {
  return {
    id: data.id,
    company_id: data.company_id,
    transaction_id: data.transaction_id,
    date: data.date,
    description: data.description,
    category: data.category,
    type: data.type as "income" | "expense" | "liability",
    amount: data.amount,
    status: data.status as "completed" | "pending" | "failed" | "cancelled",
    account: data.account,
    reference: data.reference || undefined,
    notes: data.notes || undefined,
    created_by: data.created_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<ApiResponse<Transaction[]>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "User profile or company ID not found", success: false };
    }

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.date_from) {
      query = query.gte("date", filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte("date", filters.date_to);
    }
    if (filters.type) {
      query = query.eq("type", filters.type);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.search) {
      // Escape special characters that could cause PostgreSQL parsing errors
      const escapedSearch = escapeSearchTerm(filters.search);
      
      query = query.or(`description.ilike.%${escapedSearch}%,transaction_id.ilike.%${escapedSearch}%,reference.ilike.%${escapedSearch}%`);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching transactions:", error);
      return { data: null, error: error.message, success: false };
    }

    const transactions = data ? data.map(mapTransactionRecord) : [];
    return { data: transactions, error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function getTransaction(id: string): Promise<ApiResponse<Transaction>> {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: mapTransactionRecord(data), error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function createTransaction(input: CreateTransactionInput): Promise<ApiResponse<Transaction>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "User profile or company ID not found", success: false };
    }

    const transactionData = {
      ...input,
      company_id: profile.company_id,
      transaction_id: input.transaction_id || generateTransactionId(),
      created_by: profile.id,
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: mapTransactionRecord(data), error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function updateTransaction(input: UpdateTransactionInput): Promise<ApiResponse<Transaction>> {
  try {
    const { id, ...updates } = input;
    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: mapTransactionRecord(data), error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function deleteTransaction(id: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: true, error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function getTransactionStats(
  filters: TransactionFilters = {}
): Promise<ApiResponse<{
  totalIncome: number;
  totalExpenses: number;
  totalLiabilities: number;
  netAmount: number;
  transactionCount: number;
}>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "User profile or company ID not found", success: false };
    }

    let query = supabase
      .from("transactions")
      .select("type, amount, status")
      .eq("company_id", profile.company_id);

    // Apply date filters if provided
    if (filters.date_from) {
      query = query.gte("date", filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte("date", filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching transaction stats:", error);
      return { data: null, error: error.message, success: false };
    }

    const transactions = data || [];
    
    const totalIncome = transactions
      .filter(t => t.type === "income" && t.status === "completed")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === "expense" && t.status === "completed")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalLiabilities = transactions
      .filter(t => t.type === "liability" && t.status === "pending")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netAmount = totalIncome - totalExpenses;
    const transactionCount = transactions.length;

    return {
      data: {
        totalIncome,
        totalExpenses,
        totalLiabilities,
        netAmount,
        transactionCount,
      },
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function getCashFlowData(
  filters: TransactionFilters = {}
): Promise<ApiResponse<Array<{
  month: string;
  income: number;
  expenses: number;
  net: number;
}>>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "User profile or company ID not found", success: false };
    }

    let query = supabase
      .from("transactions")
      .select("type, amount, status, date")
      .eq("company_id", profile.company_id);

    // Apply date filters if provided
    if (filters.date_from) {
      query = query.gte("date", filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte("date", filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching cash flow data:", error);
      return { data: null, error: error.message, success: false };
    }

    const transactions = data || [];
    
    // Get current year and month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Create a map for all months from January to current month
    const monthlyData = new Map<string, { income: number; expenses: number; net: number }>();
    
    // Initialize all months from January to current month with zero values
    for (let month = 0; month <= currentMonth; month++) {
      const date = new Date(currentYear, month, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData.set(monthKey, { income: 0, expenses: 0, net: 0 });
    }
    
    // Populate with actual transaction data
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Only include transactions from current year
      if (date.getFullYear() === currentYear && monthlyData.has(monthKey)) {
        const monthData = monthlyData.get(monthKey)!;
        
        if (transaction.type === "income" && transaction.status === "completed") {
          monthData.income += Number(transaction.amount);
        } else if (transaction.type === "expense" && transaction.status === "completed") {
          monthData.expenses += Number(transaction.amount);
        }
        
        monthData.net = monthData.income - monthData.expenses;
      }
    });

    // Convert to array and sort by date
    const cashFlowData = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.net
    })).sort((a, b) => {
      const dateA = new Date(a.month + " 1, " + currentYear);
      const dateB = new Date(b.month + " 1, " + currentYear);
      return dateA.getTime() - dateB.getTime();
    });

    return {
      data: cashFlowData,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function getExpensesByCategory(
  filters: TransactionFilters = {}
): Promise<ApiResponse<Array<{
  category: string;
  amount: number;
}>>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "User profile or company ID not found", success: false };
    }

    let query = supabase
      .from("transactions")
      .select("category, amount, type, status")
      .eq("company_id", profile.company_id)
      .eq("type", "expense");

    // Apply date filters if provided
    if (filters.date_from) {
      query = query.gte("date", filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte("date", filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching expenses by category:", error);
      return { data: null, error: error.message, success: false };
    }

    const transactions = data || [];
    
    // Group expenses by category
    const categoryData = new Map<string, number>();
    
    transactions.forEach(transaction => {
      if (transaction.status === "completed") {
        // Group payroll under labor category
        const displayCategory = transaction.category === "Payroll" ? "Labor" : transaction.category;
        const currentAmount = categoryData.get(displayCategory) || 0;
        categoryData.set(displayCategory, currentAmount + Number(transaction.amount));
      }
    });

    // Convert to array and sort by amount (descending)
    const expensesData = Array.from(categoryData.entries()).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount);

    return {
      data: expensesData,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function getTransactionStatusBreakdown(
  filters: TransactionFilters = {}
): Promise<ApiResponse<Array<{
  status: string;
  amount: number;
}>>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "User profile or company ID not found", success: false };
    }

    let query = supabase
      .from("transactions")
      .select("type, amount, status")
      .eq("company_id", profile.company_id)
      .eq("type", "income"); // Only include income transactions for invoices chart

    // Apply date filters if provided
    if (filters.date_from) {
      query = query.gte("date", filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte("date", filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching transaction status breakdown:", error);
      return { data: null, error: error.message, success: false };
    }

    const transactions = data || [];
    
    // Group transactions by status
    const statusData = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const currentAmount = statusData.get(transaction.status) || 0;
      statusData.set(transaction.status, currentAmount + Number(transaction.amount));
    });

    // Convert to array and sort by amount (descending)
    const statusBreakdown = Array.from(statusData.entries()).map(([status, amount]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      amount
    })).sort((a, b) => b.amount - a.amount);

    return {
      data: statusBreakdown,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
} 