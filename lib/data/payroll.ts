import { supabase } from "@/lib/supabaseClient";
import type { PayrollRecord, CreatePayrollInput, UpdatePayrollInput, ApiResponse } from "@/lib/types";
import { getUserProfileWithCompany } from "@/lib/data/userProfiles";
import { getTimesheets } from "@/lib/data/timesheets";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPayrollRecord(data: any): PayrollRecord {
  const workerInfo = Array.isArray(data.worker) && data.worker.length > 0 
    ? data.worker[0] as { id: string; name: string; hourly_rate?: number; position?: string; department?: string; }
    : null;

  const mapped: PayrollRecord = {
    id: data.id,
    company_id: data.company_id,
    worker_id: data.worker_id,
    project_id: data.project_id,
    pay_period_start: data.pay_period_start,
    pay_period_end: data.pay_period_end,
    total_hours: data.total_hours,
    overtime_hours: data.overtime_hours,
    hourly_rate: data.hourly_rate,
    gross_pay: data.gross_pay,
    nib_deduction: data.nib_deduction,
    other_deductions: data.other_deductions,
    total_deductions: data.total_deductions,
    net_pay: data.net_pay,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
    position: data.position || workerInfo?.position || "",
    department: data.department || workerInfo?.department || "",
    worker_name: workerInfo?.name || data.worker_name || "",
  };
  return mapped;
}

export async function getPayrolls(
  filters: { date_from?: string; date_to?: string } = {}
): Promise<ApiResponse<PayrollRecord[]>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "User profile or company ID not found", success: false };
    }

    // Build query with optimized select and filtering
    let query = supabase
      .from("payroll")
      .select(`
        id, 
        worker_id, 
        worker_name, 
        project_id,
        total_hours, 
        overtime_hours, 
        hourly_rate, 
        gross_pay, 
        nib_deduction, 
        other_deductions, 
        total_deductions, 
        net_pay, 
        position, 
        department, 
        status, 
        company_id, 
        created_at, 
        updated_at, 
        pay_period_start, 
        pay_period_end,
        worker:worker_id(id, name, hourly_rate, position, department)
      `)
      .eq("company_id", profile.company_id)
      .order("pay_period_start", { ascending: false });

    // Optimize date filtering - use proper date range logic
    if (filters.date_from && filters.date_to) {
      query = query
        .gte("pay_period_start", filters.date_from)
        .lte("pay_period_end", filters.date_to);
    } else if (filters.date_from) {
      query = query.gte("pay_period_start", filters.date_from);
    } else if (filters.date_to) {
      query = query.lte("pay_period_end", filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching payrolls:", error);
      return { data: null, error: error.message, success: false };
    }

    // Optimize data mapping
    const payrolls = data ? data.map(mapPayrollRecord) : [];

    return { data: payrolls, error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function getPayroll(id: string): Promise<ApiResponse<PayrollRecord>> {
  try {
    const { data, error } = await supabase
      .from("payroll")
      .select("id, worker_id, worker_name, project_id, total_hours, overtime_hours, hourly_rate, gross_pay, nib_deduction, other_deductions, total_deductions, net_pay, position, department, status, company_id, created_at, updated_at, pay_period_start, pay_period_end, worker:worker_id(id, name, hourly_rate, position, department)")
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }
    return { data: mapPayrollRecord(data), error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function createPayroll(input: CreatePayrollInput): Promise<ApiResponse<PayrollRecord>> {
  try {
    const { data, error } = await supabase.from("payroll").insert(input).select().single();
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    return { data: data as PayrollRecord, error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function updatePayroll(input: UpdatePayrollInput): Promise<ApiResponse<PayrollRecord>> {
  try {
    const { id, ...updates } = input;
    const { data, error } = await supabase.from("payroll").update(updates).eq("id", id).select().single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }
    return { data: data as PayrollRecord, error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function updatePayrollStatus(
  payrollIds: string[],
  status: PayrollRecord["status"]
): Promise<ApiResponse<PayrollRecord[]>> {
  try {
    const { data, error } = await supabase
      .from("payroll")
      .update({ status: status })
      .in("id", payrollIds)
      .select();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data as PayrollRecord[], error: null, success: true };
  } catch (error) {
    console.error("Error updating payroll status:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

export async function deletePayroll(id: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase.from("payroll").delete().eq("id", id);
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

/**
 * Generates or updates a payroll record for a specific worker and pay period.
 * Fetches approved timesheets, calculates payroll details, and then creates or updates the payroll record.
 */
export async function generatePayrollForWorkerAndPeriod(
  userId: string,
  workerId: string,
  dateFrom: string, // Start of the pay period (e.g., 'YYYY-MM-DD')
  dateTo: string // End of the pay period (e.g., 'YYYY-MM-DD')
): Promise<ApiResponse<PayrollRecord>> {
  console.log(`[PayrollGen] Entering generatePayrollForWorkerAndPeriod for worker: ${workerId}, period: ${dateFrom} to ${dateTo}`);
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      console.error("[PayrollGen] User profile or company ID not found.");
      return { data: null, error: "User profile or company ID not found.", success: false };
    }
    console.log(`[PayrollGen] Profile found, company ID: ${profile.company_id}`);

    // 1. Fetch approved timesheets for the worker and period
    console.log(`[PayrollGen] Fetching approved timesheets for worker ${workerId} from ${dateFrom} to ${dateTo}`);
    const timesheetsResult = await getTimesheets(userId, {
      worker_id: workerId,
      date_from: dateFrom,
      date_to: dateTo,
      supervisor_approval: "approved", // Only process approved timesheets
    });

    if (!timesheetsResult.success || !timesheetsResult.data) {
      console.error("[PayrollGen] Failed to fetch approved timesheets:", timesheetsResult.error);
      return {
        data: null,
        error: timesheetsResult.error || "Failed to fetch approved timesheets.",
        success: false,
      };
    }

    const approvedTimesheets = timesheetsResult.data;
    console.log(`[PayrollGen] Found ${approvedTimesheets.length} approved timesheets.`);

    if (approvedTimesheets.length === 0) {
      console.warn("[PayrollGen] No approved timesheets for this worker and period. Skipping payroll generation.");
      return { data: null, error: "No approved timesheets for this worker and period.", success: false };
    }

    // 2. Calculate totals from approved timesheets
    let totalHours = 0;
    let totalOvertimeHours = 0;
    let grossPay = 0;
    let workerName = "Unknown Worker";
    let hourlyRate = 0;
    let workerPosition = "";
    let workerDepartment = "";
    
    // Determine the primary project for this payroll period
    // Count timesheets by project to find the most common one
    const projectCounts = new Map<string, number>();
    approvedTimesheets.forEach(ts => {
      if (ts.project_id) {
        projectCounts.set(ts.project_id, (projectCounts.get(ts.project_id) || 0) + 1);
      }
    });
    
    // Get the project with the most timesheets, or the first one if tied
    let primaryProjectId: string | undefined;
    if (projectCounts.size > 0) {
      const sortedProjects = Array.from(projectCounts.entries())
        .sort((a, b) => b[1] - a[1]); // Sort by count descending
      primaryProjectId = sortedProjects[0][0];
    }

    if (approvedTimesheets[0].worker?.hourly_rate) {
      hourlyRate = approvedTimesheets[0].worker.hourly_rate;
      workerName = approvedTimesheets[0].worker.name || "Unknown Worker";
      workerPosition = approvedTimesheets[0].worker.position || "";
      workerDepartment = approvedTimesheets[0].worker.department || "";
    }
    console.log(`[PayrollGen] Worker details: Name=${workerName}, HourlyRate=${hourlyRate}, Position=${workerPosition}, Department=${workerDepartment}`);
    console.log(`[PayrollGen] Primary project for this period: ${primaryProjectId || 'None'}`);

    approvedTimesheets.forEach(ts => {
      totalHours += ts.total_hours;
      totalOvertimeHours += ts.overtime_hours;
      grossPay += (ts.total_hours * hourlyRate) + (ts.overtime_hours * hourlyRate * 1.5);
    });
    console.log(`[PayrollGen] Calculated totals: TotalHours=${totalHours}, OvertimeHours=${totalOvertimeHours}, GrossPay=${grossPay}`);

    const EMPLOYEE_NIB_RATE = 0.0465; // 4.65% - Hardcoded for Bahamas compliance
    const nibDeduction = grossPay * EMPLOYEE_NIB_RATE;
    const otherDeductions = 0;

    // 3. Check for existing payroll record for the worker and period
    console.log(`[PayrollGen] Checking for existing payroll for worker ${workerId} between ${dateFrom} and ${dateTo}`);
    const { data: existingPayroll, error: existingPayrollError } = await supabase
      .from("payroll")
      .select("id")
      .eq("worker_id", workerId)
      .eq("company_id", profile.company_id)
      .gte("pay_period_start", dateFrom)
      .lte("pay_period_end", dateTo)
      .maybeSingle();

    if (existingPayrollError && existingPayrollError.code !== 'PGRST116') {
      console.error("[PayrollGen] Error checking for existing payroll:", existingPayrollError);
      return { data: null, error: existingPayrollError.message, success: false };
    }

    const payrollData: CreatePayrollInput = {
      worker_id: workerId,
      worker_name: workerName,
      project_id: primaryProjectId,
      total_hours: totalHours,
      overtime_hours: totalOvertimeHours,
      hourly_rate: hourlyRate,
      gross_pay: grossPay,
      nib_deduction: nibDeduction,
      other_deductions: otherDeductions,
      position: workerPosition,
      department: workerDepartment,
      status: "pending",
      company_id: profile.company_id,
      pay_period_start: dateFrom,
      pay_period_end: dateTo,
    };

    console.log("[PayrollGen] Payroll data to be processed:", payrollData);

    let result: ApiResponse<PayrollRecord>;
    if (existingPayroll) {
      console.log(`[PayrollGen] Updating existing payroll record with ID: ${existingPayroll.id}`);
      result = await updatePayroll({ id: existingPayroll.id, ...payrollData });
      
      // Update existing liability transaction for updated payroll records
      if (result.success && result.data) {
        console.log(`[PayrollGen] Updating liability transaction for existing payroll ${result.data.id}`)
        try {
          // Find existing liability transaction
          const { data: existingLiability, error: fetchError } = await supabase
            .from('transactions')
            .select('*')
            .eq('reference', `LIABILITY-${result.data.id}`)
            .eq('type', 'liability')
            .eq('status', 'pending')
            .single()
          
          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error(`[PayrollGen] Failed to fetch existing liability transaction: ${fetchError.message}`)
          } else if (existingLiability) {
            // Update existing liability transaction with new amount
            const { error: updateError } = await supabase
              .from('transactions')
              .update({
                amount: grossPay,
                notes: `Wages payable for ${workerName} - Period: ${dateFrom} to ${dateTo} (Updated)`,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingLiability.id)
            
            if (updateError) {
              console.error(`[PayrollGen] Failed to update liability transaction: ${updateError.message}`)
            } else {
              console.log(`[PayrollGen] Successfully updated liability transaction for payroll ${result.data.id}`)
            }
          } else {
            // Create new liability transaction if none exists (fallback)
            console.log(`[PayrollGen] No existing liability found, creating new one for updated payroll ${result.data.id}`)
            const liabilityTransaction = {
              company_id: profile.company_id,
              transaction_id: `TXN-LIABILITY-${result.data.id}`,
              date: new Date().toISOString().split('T')[0],
              description: `Wages Payable - ${workerName}`,
              category: "Wages Payable",
              type: "liability" as const,
              amount: grossPay,
              status: "pending" as const,
              account: "Business Account",
              reference: `LIABILITY-${result.data.id}`,
              notes: `Wages payable for ${workerName} - Period: ${dateFrom} to ${dateTo}`,
              created_by: userId
            };
            
            const { error: createError } = await supabase
              .from('transactions')
              .insert([liabilityTransaction])
              .select();
            
            if (createError) {
              console.error(`[PayrollGen] Failed to create liability transaction for updated payroll: ${createError.message}`)
            } else {
              console.log(`[PayrollGen] Successfully created liability transaction for updated payroll ${result.data.id}`)
            }
          }
        } catch (error) {
          console.error(`[PayrollGen] Exception updating liability transaction:`, error)
        }
      }
    } else {
      console.log("[PayrollGen] Creating new payroll record.");
      result = await createPayroll(payrollData);
      
      // Create liability transaction for new payroll records
      if (result.success && result.data) {
        console.log(`[PayrollGen] Creating liability transaction for new payroll ${result.data.id}`)
        try {
          const liabilityTransaction = {
            company_id: profile.company_id,
            transaction_id: `TXN-LIABILITY-${result.data.id}`,
            date: new Date().toISOString().split('T')[0],
            description: `Wages Payable - ${workerName}`,
            category: "Wages Payable",
            type: "liability" as const,
            amount: grossPay,
            status: "pending" as const,
            account: "Business Account",
            reference: `LIABILITY-${result.data.id}`,
            notes: `Wages payable for ${workerName} - Period: ${dateFrom} to ${dateTo}`,
            created_by: userId
          };
          
          console.log(`[PayrollGen] Liability transaction data:`, liabilityTransaction)
          
          const { error: liabilityError } = await supabase
            .from('transactions')
            .insert([liabilityTransaction])
            .select();
          
          if (liabilityError) {
            console.error(`[PayrollGen] Failed to create liability transaction: ${liabilityError.message}`)
            console.error(`[PayrollGen] Liability error details:`, liabilityError)
          } else {
            console.log(`[PayrollGen] Successfully created liability transaction for payroll ${result.data.id}`)
          }
        } catch (error) {
          console.error(`[PayrollGen] Exception creating liability transaction:`, error)
        }
      } else {
        console.log(`[PayrollGen] Skipping liability transaction creation - payroll result not successful`)
      }
    }

    if (!result.success) {
      console.error(`[PayrollGen] Failed to ${existingPayroll ? 'update' : 'create'} payroll record:`, result.error);
      return {
        data: null,
        error: result.error || `Failed to ${existingPayroll ? 'update' : 'create'} payroll record.`,
        success: false,
      };
    }

    console.log(`[PayrollGen] Payroll ${existingPayroll ? 'updated' : 'created'} successfully. Result:`, result.data);
    return { data: result.data, error: null, success: true };

  } catch (error) {
    console.error("[PayrollGen] Unexpected error in generatePayrollForWorkerAndPeriod:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "An unexpected error occurred during payroll generation.",
      success: false,
    };
  }
}

/**
 * Aggregates payroll records based on the target period type.
 * For example, when viewing monthly payroll, it will aggregate all weekly/bi-weekly
 * payrolls that fall within that month.
 */
export async function getAggregatedPayrolls(
  filters: { date_from?: string; date_to?: string; target_period_type: "weekly" | "bi-weekly" | "monthly" } = { target_period_type: "bi-weekly" }
): Promise<ApiResponse<PayrollRecord[]>> {
  try {
    // First get all payroll records within the date range
    const payrollsResponse = await getPayrolls(filters);
    if (!payrollsResponse.success || !payrollsResponse.data) {
      return payrollsResponse;
    }

    const payrolls = payrollsResponse.data;

    // If we're not aggregating to a larger period, return as is
    if (filters.target_period_type !== "monthly") {
      return payrollsResponse;
    }

    // Group payrolls by worker and month
    const aggregatedPayrolls = new Map<string, PayrollRecord>();
    
    payrolls.forEach(payroll => {
      const periodStart = new Date(payroll.pay_period_start);
      const monthKey = `${payroll.worker_id}-${periodStart.getFullYear()}-${periodStart.getMonth()}`;
      
      if (!aggregatedPayrolls.has(monthKey)) {
        // Initialize monthly aggregate
        const monthStart = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);
        const monthEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
        
        aggregatedPayrolls.set(monthKey, {
          ...payroll,
          id: `monthly-${monthKey}`,
          total_hours: 0,
          overtime_hours: 0,
          gross_pay: 0,
          nib_deduction: 0,
          other_deductions: 0,
          total_deductions: 0,
          net_pay: 0,
          pay_period_start: monthStart.toISOString(),
          pay_period_end: monthEnd.toISOString(),
        });
      }

      const aggregate = aggregatedPayrolls.get(monthKey)!;
      
      // Add up all the numeric values
      aggregate.total_hours += payroll.total_hours;
      aggregate.overtime_hours += payroll.overtime_hours;
      aggregate.gross_pay += payroll.gross_pay;
      aggregate.nib_deduction += payroll.nib_deduction;
      aggregate.other_deductions += payroll.other_deductions;
      aggregate.total_deductions += payroll.total_deductions;
      aggregate.net_pay += payroll.net_pay;
    });

    return {
      data: Array.from(aggregatedPayrolls.values()),
      error: null,
      success: true
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      success: false
    };
  }
}

export async function getPayrollsByProject(
  projectId: string,
  filters: { date_from?: string; date_to?: string } = {}
): Promise<ApiResponse<PayrollRecord[]>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "User profile or company ID not found", success: false };
    }

    // Build query with optimized select and filtering
    let query = supabase
      .from("payroll")
      .select(`
        id, 
        worker_id, 
        worker_name, 
        project_id,
        total_hours, 
        overtime_hours, 
        hourly_rate, 
        gross_pay, 
        nib_deduction, 
        other_deductions, 
        total_deductions, 
        net_pay, 
        position, 
        department, 
        status, 
        company_id, 
        created_at, 
        updated_at, 
        pay_period_start, 
        pay_period_end,
        worker:worker_id(id, name, hourly_rate, position, department)
      `)
      .eq("company_id", profile.company_id)
      .eq("project_id", projectId)
      .in("status", ["confirmed", "paid"]) // Include both confirmed and paid payroll records
      .order("pay_period_start", { ascending: false });

    // Optimize date filtering - use proper date range logic
    if (filters.date_from && filters.date_to) {
      query = query
        .gte("pay_period_start", filters.date_from)
        .lte("pay_period_end", filters.date_to);
    } else if (filters.date_from) {
      query = query.gte("pay_period_start", filters.date_from);
    } else if (filters.date_to) {
      query = query.lte("pay_period_end", filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching payrolls by project:", error);
      return { data: null, error: error.message, success: false };
    }

    // Optimize data mapping
    const payrolls = data ? data.map(mapPayrollRecord) : [];

    return { data: payrolls, error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}