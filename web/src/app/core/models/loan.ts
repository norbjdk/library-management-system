export interface Loan {
  id: number;
  user: number;
  user_name: string;
  copy: number;
  book_id: number;
  book_title: string;
  loan_date: string;
  due_date: string;
  return_date: string | null;
  status: 'active' | 'overdue' | 'returned';
  days_until_due: number;
  overdue_days: number;
  is_overdue: boolean;
}
