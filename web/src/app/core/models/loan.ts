export interface Loan {
  id: number;
  user: number;
  copy: number;
  loan_date: string;
  due_date: string;
  return_date: string | null;
  status: 'active' | 'overdue' | 'returned' | 'reserved';
}
