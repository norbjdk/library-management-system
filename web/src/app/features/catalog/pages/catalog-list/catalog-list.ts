import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Book } from '../../../../core/models/book';
import { ApiService } from '../../../../core/services/api.service';
import { Modal } from '../../../../shared/components/modal/modal';
import { normalizeText } from '../../../../shared/utils/form-normalization';

@Component({
  selector: 'app-catalog-list',
  imports: [FormsModule, RouterLink, Modal],
  templateUrl: './catalog-list.html',
  styleUrl: './catalog-list.css',
})
export class CatalogList implements OnInit {
  searchQuery = '';
  books = signal<Book[]>([]);
  loading = signal(false);
  borrowingBookId = signal<number | null>(null);
  borrowModalOpen = signal(false);
  pendingBorrowBook = signal<Book | null>(null);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  count = signal(0);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const params: Record<string, string> = {};
    const searchQuery = normalizeText(this.searchQuery);
    this.searchQuery = searchQuery;
    if (searchQuery) params['q'] = searchQuery;

    this.api.getBooks(params).subscribe({
      next: (response) => {
        this.books.set(response.results);
        this.count.set(response.count);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się załadować książek.');
        this.loading.set(false);
      },
    });
  }

  onSearch() {
    this.loadBooks();
  }

  openBorrowModal(book: Book) {
    if (this.borrowingBookId() !== null || this.getAvailableCopies(book) < 1) {
      return;
    }

    this.pendingBorrowBook.set(book);
    this.borrowModalOpen.set(true);
  }

  closeBorrowModal() {
    this.borrowModalOpen.set(false);
    this.pendingBorrowBook.set(null);
  }

  confirmBorrow() {
    const book = this.pendingBorrowBook();
    if (!book) {
      return;
    }

    this.closeBorrowModal();
    this.borrowBook(book);
  }

  private borrowBook(book: Book) {
    if (this.borrowingBookId() !== null || this.getAvailableCopies(book) < 1) {
      return;
    }

    this.borrowingBookId.set(book.id);
    this.error.set(null);
    this.success.set(null);

    this.api.borrowBook(book.id).subscribe({
      next: () => {
        this.books.update((snapshot) =>
          snapshot.map((item) => {
            if (item.id !== book.id) {
              return item;
            }

            return {
              ...item,
              available_copies: Math.max(0, item.available_copies - 1),
              active_loans: item.active_loans + 1,
            };
          }),
        );
        this.success.set('Książka została wypożyczona i przypisana do Twojego konta.');
        this.borrowingBookId.set(null);
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail ??
            err?.error?.book?.[0] ??
            'Nie udało się wypożyczyć książki. Spróbuj ponownie.',
        );
        this.borrowingBookId.set(null);
      },
    });
  }

  isBorrowing(bookId: number): boolean {
    return this.borrowingBookId() === bookId;
  }

  getPrimaryAuthor(book: Book): string {
    if (!book.authors.length) {
      return 'Autor nieznany';
    }

    return book.authors.map((author) => `${author.first_name} ${author.last_name}`).join(', ');
  }

  getPrimaryCategory(book: Book): string {
    return book.categories.length ? book.categories[0].name : '—';
  }

  getPublisherName(book: Book): string {
    return book.publisher_name ?? '—';
  }

  getWaitLabel(book: Book): string {
    return book.estimated_wait_days > 0 ? `${book.estimated_wait_days} dni` : 'Od ręki';
  }

  getAvailableCopies(book: Book): number {
    return book.available_copies;
  }

  getTotalCopies(book: Book): number {
    return book.copies_count;
  }

  getStatus(book: Book): 'available' | 'unavailable' {
    return this.getAvailableCopies(book) > 0 ? 'available' : 'unavailable';
  }

  getStatusLabel(book: Book): string {
    return this.getAvailableCopies(book) > 0 ? 'Dostępna' : 'Niedostępna';
  }

  getStatusClasses(book: Book): string {
    return this.getAvailableCopies(book) > 0
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  }
}
