export interface Order {
  id: number;
  book: number;
  book_title: string;
  requested_by: number | null;
  requested_by_name: string | null;
  quantity: number;
  supplier: string;
  status: 'draft' | 'submitted' | 'processing' | 'received' | 'cancelled';
  notes: string;
  requested_at: string;
  expected_delivery_date: string | null;
  age_days: number;
}
