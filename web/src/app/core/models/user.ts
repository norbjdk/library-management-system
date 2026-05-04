export type UserRole = 'reader' | 'librarian' | 'admin';

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    is_staff: boolean;
}

export interface AuthResponse {
    user: User;
    access_token: string;
    refresh_token: string;
}
