export interface Loan {
    id: number;
    user: string;
    userId: number;
    book: string;
    bookId: number;
    isbn: string;
    borrowedDate: string;
    dueDate: string;
    returnedDate?: string;
    status: 'active' | 'overdue' | 'returned' | 'reserved';
}
