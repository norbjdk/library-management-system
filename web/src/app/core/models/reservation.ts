export interface Reservation {
  id: number;
  user: number;
  book: number;
  user_name: string;
  book_title: string;
  reservation_date: string;
  expiry_date: string;
  status: 'pending' | 'fulfilled' | 'cancelled' | 'expired';
  queue_position: number;
  estimated_ready_date: string | null;
}
