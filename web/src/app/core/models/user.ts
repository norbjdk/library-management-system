export type UserRole = 'reader' | 'librarian' | 'admin';

export interface ProfileSummary {
  loan_count: number;
  reservation_count: number;
  fine_total: string;
  notification_count: number;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  birthdate?: string;
  role: UserRole;
  is_staff: boolean;
  created_at?: string;
  loan_count?: number;
  reservation_count?: number;
  fine_total?: string;
}

export interface UserProfile extends User {
  full_name: string;
  birthdate: string;
  created_at: string;
  loan_count: number;
  reservation_count: number;
  fine_total: string;
  summary: ProfileSummary;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  birthdate: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}
