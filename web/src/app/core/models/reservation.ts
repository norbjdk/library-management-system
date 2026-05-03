export interface Reservation {
    id: number;
    user: number;
    book: number;
    reservation_date: string;
    expiry_date: string;
    status: 'pending' | 'fulfilled' | 'cancelled' | 'expired';
}
