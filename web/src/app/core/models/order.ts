export interface Order {
  id: number;
  book: number;
  book_title: string;
  book_ean?: string | null;
  book_publish_year?: number | null;
  book_publisher_name?: string | null;
  book_author_names?: string;
  requested_by: number | null;
  requested_by_name: string | null;
  quantity: number;
  supplier: string;
  status: 'draft' | 'submitted' | 'processing' | 'received' | 'cancelled';
  notes: string;
  requested_at: string;
  expected_delivery_date: string | null;
  age_days: number;
  requested_book_title?: string;
  requested_book_ean?: string;
  requested_book_publish_year?: number | null;
  requested_book_publisher?: string;
  requested_book_authors?: string;
  requested_book_description?: string;
}
