export interface Book {
    id: number;
    title: string;
    author: string;
    isbn: string;
    category: string;
    location: string;
    availableCopies: number;
    totalCopies: number;
    coverUrl?: string;
    status: 'available' | 'borrowed' | 'reserved' | 'unavailable';
}
