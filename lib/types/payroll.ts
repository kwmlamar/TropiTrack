export type PayrollRecord = {
  id: string;
  workerId: string;
  workerName: string;
  totalHours: number;
  overtimeHours: number;
  hourlyRate: number;
  grossPay: number;
  nibDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  position: string;
  department: string;
  company_id: string;
  status: 'pending' | 'approved' | 'rejected'
};

export type CreatePayrollInput = Omit<PayrollRecord, "id">;
export type UpdatePayrollInput = Partial<Omit<PayrollRecord, "id">> & { id: string };
