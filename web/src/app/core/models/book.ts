export interface Author {
  id: number;
  first_name: string;
  last_name: string;
  birthdate?: string | null;
  nationality?: string | null;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
}

export interface Publisher {
  id: number;
  name: string;
  city?: string | null;
  country?: string | null;
}

export interface Location {
  id: number;
  floor: number;
  section: string;
  shelf: string;
}

export interface Copy {
  id: number;
  book?: number;
  book_title?: string;
  condition: string;
  available: boolean;
  location: number | Location | null;
  location_label?: string | null;
}

export interface BookAvailability {
  book_id: number;
  title: string;
  total_copies: number;
  available_copies: number;
  active_loans: number;
  active_reservations: number;
  estimated_wait_days: number;
  estimated_ready_date: string;
}

export interface Book {
  id: number;
  title: string;
  ean: string | null;
  description: string | null;
  publish_year: number | null;
  publisher: number | null;
  publisher_name: string | null;
  authors: Author[];
  categories: Category[];
  author_ids?: number[];
  category_ids?: number[];
  copies?: Copy[];
  copies_count: number;
  available_copies: number;
  active_loans: number;
  active_reservations: number;
  estimated_wait_days: number;
  user_has_active_reservation?: boolean;
}
