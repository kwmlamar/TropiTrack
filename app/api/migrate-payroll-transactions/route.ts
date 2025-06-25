import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user's profile to find their company
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: "User profile not found or no company associated" },
        { status: 400 }
      );
    }

    // First, let's check if there are any payroll records that need transactions
    const { data: payrolls, error: payrollError } = await supabase
      .from("payroll")
      .select("id, status")
      .eq("company_id", profile.company_id);

    if (payrollError) {
      return NextResponse.json(
        { error: "Failed to fetch payroll records", details: payrollError.message },
        { status: 500 }
      );
    }

    if (!payrolls || payrolls.length === 0) {
      return NextResponse.json(
        { message: "No payroll records found for this company" },
        { status: 200 }
      );
    }

    // Execute the migration function
    const { error: migrationError } = await supabase
      .rpc("create_transactions_for_existing_payrolls");

    if (migrationError) {
      console.error("Migration error:", migrationError);
      return NextResponse.json(
        { 
          error: "Migration failed", 
          details: migrationError.message,
          hint: "Check if the migration function exists in the database"
        },
        { status: 500 }
      );
    }

    // Get a count of transactions created for this company
    const { data: transactions, error: transactionError } = await supabase
      .from("transactions")
      .select("id, type, reference")
      .eq("company_id", profile.company_id)
      .or("reference.like.LIABILITY-%,reference.like.PAYROLL-%");

    if (transactionError) {
      return NextResponse.json(
        { error: "Failed to verify transactions", details: transactionError.message },
        { status: 500 }
      );
    }

    const liabilityCount = transactions?.filter(t => t.type === 'liability').length || 0;
    const expenseCount = transactions?.filter(t => t.type === 'expense').length || 0;

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      summary: {
        totalPayrolls: payrolls.length,
        liabilityTransactions: liabilityCount,
        expenseTransactions: expenseCount,
        totalTransactions: transactions?.length || 0
      }
    });

  } catch (error) {
    console.error("Unexpected error during migration:", error);
    return NextResponse.json(
      { 
        error: "Unexpected error occurred", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 