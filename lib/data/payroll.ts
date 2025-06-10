import { supabase } from "@/lib/supabaseClient";
import type { PayrollRecord } from "@/lib/types/payroll";
import { getUserProfileWithCompany } from "@/lib/data/userProfiles";

export type CreatePayrollInput = Omit<PayrollRecord, "id">;
export type UpdatePayrollInput = Partial<Omit<PayrollRecord, "id">> & { id: string };

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

export async function getPayrolls(): Promise<ApiResponse<PayrollRecord[]>> {
  try {
    const profile = await getUserProfileWithCompany();
    if (!profile || !profile.company_id) {
      return { data: null, error: "User profile or company ID not found.", success: false };
    }

    console.log("Fetching payrolls for company ID:", profile.company_id);

    const { data, error } = await supabase
      .from("payroll")
      .select(`*, worker:workers(name)`)
      .eq("company_id", profile.company_id);

    console.log("Supabase raw payroll data:", data);
    console.log("Supabase raw payroll error:", error);

    if (error) {
      return { data: null, error: error.message, success: false };
    }
    const mapped = (data as unknown[]).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      return {
        ...r,
        workerName: r.worker?.name || r.workerName || "",
        totalHours: r.total_hours,
        overtimeHours: r.overtime_hours,
        hourlyRate: r.hourly_rate,
        grossPay: r.gross_pay,
        nibDeduction: r.nib_deduction,
        otherDeductions: r.other_deductions,
        totalDeductions: r.total_deductions,
        netPay: r.net_pay,
      };
    });
    return { data: mapped as PayrollRecord[], error: null, success: true };
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
      .select(`*, worker:workers(name)`)
      .eq("id", id)
      .single();
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    const mapped = {
      ...data,
      workerName: data?.worker?.name || data?.workerName || "",
    };
    return { data: mapped as PayrollRecord, error: null, success: true };
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
    const { id, ...updateData } = input;
    const { data, error } = await supabase.from("payroll").update(updateData).eq("id", id).select().single();
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
