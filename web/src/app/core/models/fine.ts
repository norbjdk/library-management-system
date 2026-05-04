export interface Fine {
  id: number;
  user: number;
  user_name: string;
  loan: number;
  loan_summary: string;
  amount: string;
  issue_date: string;
  paid: boolean;
  paid_date: string | null;
  remaining_amount: string;
}
