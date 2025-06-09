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
  status: 'pending' | 'approved' | 'rejected'
};
