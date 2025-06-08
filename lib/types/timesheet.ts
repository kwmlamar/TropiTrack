export type Timesheet = {
  id: string;
  workerId: string;
  // ... other fields ...
  status: 'pending' | 'approved' | 'rejected';
}; 