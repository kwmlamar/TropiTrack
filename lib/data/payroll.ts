import { supabase } from "@/lib/supabaseClient";
import type { PayrollRecord, CreatePayrollInput, UpdatePayrollInput, ApiResponse, PayrollPayment } from "@/lib/types";
import { getUserProfileWithCompany } from "@/lib/data/userProfiles";
import { getTimesheets } from "@/lib/data/timesheets";
import { completeOnboardingStep } from "@/lib/actions/onboarding-actions";
import { getPayrollSettings } from "@/lib/data/payroll-settings";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPayrollRecord(data: any): PayrollRecord {
  const workerInfo = Array.isArray(data.worker) && data.worker.length > 0 
    ? data.worker[0] as { id: string; name: string; hourly_rate?: number; position?: string; department?: string; }
    : (data.worker ? data.worker as { id: string; name: string; hourly_rate?: number; position?: string; department?: string; } : null);

  const projectInfo = Array.isArray(data.projects) && data.projects.length > 0
    ? data.projects[0] as { id: string; name: string; }
    : (data.projects ? data.projects as { id: string; name: string; } : null);

  const mapped: PayrollRecord = {
    id: data.id,
    company_id: data.company_id,
    worker_id: data.worker_id,
    project_id: data.project_id,
    project_name: projectInfo?.name || data.project_name || "",
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
        worker:worker_id(id, name, hourly_rate, position, department),
        projects!project_id(id, name)
      `)
      .eq("company_id", profile.company_id)
      // Include all statuses for now to debug
      // .in("status", ["confirmed", "paid"]) // Only include confirmed and paid payroll records
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
    const mappedPayrolls = data ? data.map(mapPayrollRecord) : [];

    // Deduplicate payroll records by worker_id and pay period
    // Group by worker_id, pay_period_start, and pay_period_end
    const payrollMap = new Map<string, PayrollRecord>();
    
    mappedPayrolls.forEach((payroll) => {
      // Create a unique key for worker + pay period
      const key = `${payroll.worker_id}-${payroll.pay_period_start}-${payroll.pay_period_end}`;
      
      const existing = payrollMap.get(key);
      
      if (!existing) {
        // First record for this worker + period, add it
        payrollMap.set(key, payroll);
      } else {
        // Duplicate found - keep the most recent one (by updated_at, then created_at)
        const existingDate = new Date(existing.updated_at || existing.created_at || 0);
        const currentDate = new Date(payroll.updated_at || payroll.created_at || 0);
        
        if (currentDate > existingDate) {
          // Current record is more recent, replace it
          payrollMap.set(key, payroll);
        }
        // Otherwise, keep the existing record
      }
    });

    // Convert map back to array
    const payrolls = Array.from(payrollMap.values());

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
      .select("id, worker_id, worker_name, project_id, total_hours, overtime_hours, hourly_rate, gross_pay, nib_deduction, other_deductions, total_deductions, net_pay, position, department, status, company_id, created_at, updated_at, pay_period_start, pay_period_end, worker:worker_id(id, name, hourly_rate, position, department), projects!project_id(id, name)")
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
    console.log("[PayrollCreate] Creating payroll with data:", input);
    const { data, error } = await supabase.from("payroll").insert({ ...input, created_by: input.created_by }).select().single();
    if (error) {
      console.error("[PayrollCreate] Error creating payroll:", error);
      return { data: null, error: error.message, success: false };
    }
    console.log("[PayrollCreate] Successfully created payroll:", data);
    return { data: data as PayrollRecord, error: null, success: true };
  } catch (error) {
    console.error("[PayrollCreate] Exception creating payroll:", error);
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

/**
 * Check for pending timesheets in the pay periods of the given payroll records
 */
export async function checkPendingTimesheetsForPayrolls(
  payrollIds: string[]
): Promise<ApiResponse<{ hasPendingTimesheets: boolean; pendingCount: number; details: Array<{ payrollId: string; workerName: string; payPeriod: string; pendingCount: number }> }>> {
  try {
    // First, get the payroll records to get their pay periods and worker IDs
    const { data: payrolls, error: payrollError } = await supabase
      .from("payroll")
      .select("id, worker_id, worker_name, pay_period_start, pay_period_end, company_id")
      .in("id", payrollIds);

    if (payrollError) {
      return { data: null, error: payrollError.message, success: false };
    }

    if (!payrolls || payrolls.length === 0) {
      return { data: { hasPendingTimesheets: false, pendingCount: 0, details: [] }, error: null, success: true };
    }

    const details: Array<{ payrollId: string; workerName: string; payPeriod: string; pendingCount: number }> = [];
    let totalPendingCount = 0;
    let hasPendingTimesheets = false;

    // Check for pending timesheets for each payroll record
    for (const payroll of payrolls) {
      const { data: pendingTimesheets, error: timesheetError } = await supabase
        .from("timesheets")
        .select("id")
        .eq("worker_id", payroll.worker_id)
        .eq("company_id", payroll.company_id)
        .eq("supervisor_approval", "pending")
        .gte("date", payroll.pay_period_start)
        .lte("date", payroll.pay_period_end);

      if (timesheetError) {
        console.error(`[CheckPendingTimesheets] Error checking timesheets for payroll ${payroll.id}:`, timesheetError);
        continue;
      }

      const pendingCount = pendingTimesheets?.length || 0;
      if (pendingCount > 0) {
        hasPendingTimesheets = true;
        totalPendingCount += pendingCount;
      }

      details.push({
        payrollId: payroll.id,
        workerName: payroll.worker_name,
        payPeriod: `${payroll.pay_period_start} to ${payroll.pay_period_end}`,
        pendingCount
      });
    }

    return {
      data: { hasPendingTimesheets, pendingCount: totalPendingCount, details },
      error: null,
      success: true
    };
  } catch (error) {
    console.error("[CheckPendingTimesheets] Unexpected error:", error);
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
    console.log(`[UpdatePayrollStatus] Updating ${payrollIds.length} payroll records to status: ${status}`);
    
    // Update each payroll individually to avoid potential batch update issues
    const updatedPayrolls: PayrollRecord[] = [];
    
    for (const payrollId of payrollIds) {
      console.log(`[UpdatePayrollStatus] Updating payroll ${payrollId} to status ${status}`);
      
      const { data, error } = await supabase
        .from("payroll")
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq("id", payrollId)
        .select()
        .single();

      if (error) {
        console.error(`[UpdatePayrollStatus] Error updating payroll ${payrollId}:`, error);
        return { data: null, error: `Failed to update payroll ${payrollId}: ${error.message}`, success: false };
      }

      if (data) {
        updatedPayrolls.push(data as PayrollRecord);
      }
    }

    console.log(`[UpdatePayrollStatus] Successfully updated ${updatedPayrolls.length} payroll records`);
    return { data: updatedPayrolls, error: null, success: true };
  } catch (error) {
    console.error("[UpdatePayrollStatus] Unexpected error:", error);
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
      console.warn("[PayrollGen] No approved timesheets for this worker and period. Checking for existing payroll to update/delete.");
      
      // Check for existing payroll record for the worker and period
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

      if (existingPayroll) {
        console.log(`[PayrollGen] Found existing payroll record ${existingPayroll.id} with no approved timesheets. Setting to zero.`);
        
        // Update the existing payroll record to zero values
        const zeroPayrollData = {
          id: existingPayroll.id,
          total_hours: 0,
          overtime_hours: 0,
          gross_pay: 0,
          nib_deduction: 0,
          other_deductions: 0,
          status: "pending" as const,
        };
        
        const result = await updatePayroll(zeroPayrollData);
        
        if (result.success) {
          console.log(`[PayrollGen] Successfully updated payroll record to zero values.`);
          
          // Update liability transaction to zero as well
          try {
            const { data: existingLiability, error: fetchError } = await supabase
              .from('transactions')
              .select('*')
              .eq('reference', `LIABILITY-${existingPayroll.id}`)
              .eq('type', 'liability')
              .eq('status', 'pending')
              .single()
            
            if (!fetchError && existingLiability) {
              const { error: updateError } = await supabase
                .from('transactions')
                .update({
                  amount: 0,
                  notes: `Wages payable set to zero - no approved timesheets for period: ${dateFrom} to ${dateTo}`,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingLiability.id)
              
              if (updateError) {
                console.error(`[PayrollGen] Failed to update liability transaction to zero: ${updateError.message}`)
              } else {
                console.log(`[PayrollGen] Successfully updated liability transaction to zero for payroll ${existingPayroll.id}`)
              }
            }
          } catch (error) {
            console.error(`[PayrollGen] Exception updating liability transaction to zero:`, error)
          }
          
          return { data: result.data, error: null, success: true };
        } else {
          console.error(`[PayrollGen] Failed to update payroll record to zero:`, result.error);
          return { data: null, error: result.error || "Failed to update payroll record to zero.", success: false };
        }
      } else {
        console.log(`[PayrollGen] No existing payroll record found. No action needed.`);
        return { data: null, error: null, success: true };
      }
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

    // Fetch worker details to check NIB exemption status
    const { data: workerData, error: workerError } = await supabase
      .from("workers")
      .select("nib_exempt")
      .eq("id", workerId)
      .single();
    
    if (workerError) {
      console.error("[PayrollGen] Error fetching worker NIB exemption status:", workerError);
    }
    
    const workerNibExempt = workerData?.nib_exempt ?? false; // Default to not exempt if field missing
    console.log(`[PayrollGen] Worker NIB Exemption Status: ${workerNibExempt}`);

    // Fetch payroll settings to get NIB configuration
    const payrollSettingsResult = await getPayrollSettings();
    const companyNibEnabled = payrollSettingsResult.data?.nib_enabled ?? true; // Default to enabled if settings not found
    const nibRate = payrollSettingsResult.data?.nib_rate ?? 4.65; // Default to 4.65% if settings not found
    
    // Apply NIB only if:
    // 1. Company has NIB enabled (companyNibEnabled = true)
    // 2. Worker is NOT exempt (workerNibExempt = false)
    const shouldApplyNib = companyNibEnabled && !workerNibExempt;
    const EMPLOYEE_NIB_RATE = shouldApplyNib ? (nibRate / 100) : 0;
    console.log(`[PayrollGen] NIB Settings: CompanyEnabled=${companyNibEnabled}, WorkerExempt=${workerNibExempt}, ShouldApplyNIB=${shouldApplyNib}, Rate=${nibRate}%, CalculatedRate=${EMPLOYEE_NIB_RATE}`);
    
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
      created_by: userId,
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
    console.log(`[PayrollGen] Returning success response with data:`, result.data);

    // Mark onboarding step as completed if payroll generation was successful
    if (result.success && result.data) {
      try {
        console.log(`[PayrollGen] Attempting to complete onboarding step for user: ${userId}, profile.id: ${profile.id}`);
        await completeOnboardingStep(userId, "payroll", {
          payroll_id: result.data.id,
          generated_at: new Date().toISOString(),
          worker_id: workerId,
          period_start: dateFrom,
          period_end: dateTo
        });
        console.log(`[PayrollGen] Onboarding step "payroll" completed for user ${userId}`);
      } catch (onboardingError) {
        console.error(`[PayrollGen] Error completing onboarding step:`, onboardingError);
        // Don't fail the payroll generation if onboarding completion fails
      }
    } else {
      console.log(`[PayrollGen] Skipping onboarding completion - result not successful:`, { success: result.success, data: !!result.data });
    }

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
    const mappedPayrolls = data ? data.map(mapPayrollRecord) : [];

    // Deduplicate payroll records by worker_id and pay period
    // Group by worker_id, pay_period_start, and pay_period_end
    const payrollMap = new Map<string, PayrollRecord>();
    
    mappedPayrolls.forEach((payroll) => {
      // Create a unique key for worker + pay period
      const key = `${payroll.worker_id}-${payroll.pay_period_start}-${payroll.pay_period_end}`;
      
      const existing = payrollMap.get(key);
      
      if (!existing) {
        // First record for this worker + period, add it
        payrollMap.set(key, payroll);
      } else {
        // Duplicate found - keep the most recent one (by updated_at, then created_at)
        const existingDate = new Date(existing.updated_at || existing.created_at || 0);
        const currentDate = new Date(payroll.updated_at || payroll.created_at || 0);
        
        if (currentDate > existingDate) {
          // Current record is more recent, replace it
          payrollMap.set(key, payroll);
        }
        // Otherwise, keep the existing record
      }
    });

    // Convert map back to array
    const payrolls = Array.from(payrollMap.values());

    return { data: payrolls, error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}

// Fetch all payments for a payroll record
export async function getPayrollPayments(payrollId: string): Promise<PayrollPayment[]> {
  const { data, error } = await supabase
    .from("payroll_payments")
    .select("*")
    .eq("payroll_id", payrollId)
    .order("payment_date", { ascending: true });
  if (error) {
    console.error("Error fetching payroll payments:", error);
    return [];
  }
  return data || [];
}

// Batch fetch payments for multiple payrolls
export async function getPayrollPaymentsBatch(payrollIds: string[]): Promise<Record<string, PayrollPayment[]>> {
  if (payrollIds.length === 0) return {};
  
  const { data, error } = await supabase
    .from("payroll_payments")
    .select("*")
    .in("payroll_id", payrollIds)
    .order("payment_date", { ascending: true });
    
  if (error) {
    console.error("Error fetching payroll payments batch:", error);
    return {};
  }
  
  // Group payments by payroll_id
  const paymentsByPayrollId: Record<string, PayrollPayment[]> = {};
  payrollIds.forEach(id => {
    paymentsByPayrollId[id] = [];
  });
  
  if (data) {
    data.forEach(payment => {
      if (paymentsByPayrollId[payment.payroll_id]) {
        paymentsByPayrollId[payment.payroll_id].push(payment);
      }
    });
  }
  
  return paymentsByPayrollId;
}

// Add a new payment
export async function addPayrollPayment(input: Omit<PayrollPayment, "id" | "created_at" | "updated_at">): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("payroll_payments")
    .insert([{ ...input }]);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Update an existing payroll payment
export async function updatePayrollPayment(
  paymentId: string, 
  updates: Partial<Omit<PayrollPayment, "id" | "created_at" | "updated_at">>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("payroll_payments")
    .update(updates)
    .eq("id", paymentId);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Delete all payments for a payroll record
export async function deletePayrollPayments(payrollId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("payroll_payments")
    .delete()
    .eq("payroll_id", payrollId);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Set total payment amount for a payroll (clears existing payments and adds one new payment)
export async function setPayrollPaymentAmount(
  payrollId: string,
  amount: number,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First delete all existing payments for this payroll
    const deleteResult = await deletePayrollPayments(payrollId);
    if (!deleteResult.success) {
      return deleteResult;
    }

    // If amount is 0, we're done (all payments deleted)
    if (amount === 0) {
      return { success: true };
    }

    // Add a single payment with the total amount
    const addResult = await addPayrollPayment({
      payroll_id: payrollId,
      amount,
      payment_date: new Date().toISOString().slice(0, 10),
      status: "completed",
      notes: "Total payment amount set via inline edit",
      created_by: userId,
    });

    return addResult;
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    };
  }
}

// Update getPayrolls to include payments, total_paid, and remaining_balance
export async function getPayrollsWithPayments(
  filters: { date_from?: string; date_to?: string } = {}
): Promise<ApiResponse<PayrollRecord[]>> {
  const base = await getPayrolls(filters);
  if (!base.success || !base.data) return base;
  const payrolls = await Promise.all(
    base.data.map(async (payroll) => {
      const payments = await getPayrollPayments(payroll.id);
      const total_paid = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining_balance = payroll.net_pay - total_paid;
      return { ...payroll, payments, total_paid, remaining_balance };
    })
  );
  return { ...base, data: payrolls };
}