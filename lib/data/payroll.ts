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

    let query = supabase
      .from("payroll")
      .select("id, worker_id, worker_name, total_hours, overtime_hours, hourly_rate, gross_pay, nib_deduction, other_deductions, total_deductions, net_pay, position, department, status, company_id, created_at, updated_at, pay_period_start, pay_period_end, worker:worker_id(id, name, hourly_rate, position, department)")
      .eq("company_id", profile.company_id)
      .order("pay_period_start", { ascending: false });

    if (filters.date_from) {
      query = query.gte("pay_period_start", filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte("pay_period_end", filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching payrolls:", error);
      return { data: null, error: error.message, success: false };
    }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payrolls = data ? (data as any[]).map(mapPayrollRecord) : [];

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
      .select("id, worker_id, worker_name, total_hours, overtime_hours, hourly_rate, gross_pay, nib_deduction, other_deductions, total_deductions, net_pay, position, department, status, company_id, created_at, updated_at, pay_period_start, pay_period_end, worker:worker_id(id, name, hourly_rate, position, department)")
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

    if (approvedTimesheets[0].worker?.hourly_rate) {
      hourlyRate = approvedTimesheets[0].worker.hourly_rate;
      workerName = approvedTimesheets[0].worker.name || "Unknown Worker";
      workerPosition = approvedTimesheets[0].worker.position || "";
      workerDepartment = approvedTimesheets[0].worker.department || "";
    }
    console.log(`[PayrollGen] Worker details: Name=${workerName}, HourlyRate=${hourlyRate}, Position=${workerPosition}, Department=${workerDepartment}`);

    approvedTimesheets.forEach(ts => {
      totalHours += ts.total_hours;
      totalOvertimeHours += ts.overtime_hours;
      grossPay += (ts.regular_hours * hourlyRate) + (ts.overtime_hours * hourlyRate * 1.5);
    });
    console.log(`[PayrollGen] Calculated totals: TotalHours=${totalHours}, OvertimeHours=${totalOvertimeHours}, GrossPay=${grossPay}`);

    const EMPLOYEE_NIB_RATE = 0.0465; // 4.65%
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
    } else {
      console.log("[PayrollGen] Creating new payroll record.");
      result = await createPayroll(payrollData);
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
