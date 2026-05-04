export interface Order {
    id: number;
    book: number;
    requested_by: number;
    supplier: string;
    status: 'draft' | 'submitted' | 'received' | 'cancelled';
    notes: string;
    requested_at: string;
    expected_delivery_date: string | null;
}
