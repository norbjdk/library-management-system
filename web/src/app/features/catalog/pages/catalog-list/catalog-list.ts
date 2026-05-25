import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Book } from '../../../../core/models/book';
import { DEFAULT_PAGE_SIZE } from '../../../../core/models/pagination';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Modal } from '../../../../shared/components/modal/modal';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { normalizeText } from '../../../../shared/utils/form-normalization';

@Component({
  selector: 'app-catalog-list',
  imports: [FormsModule, RouterLink, Modal, Pagination],
  templateUrl: './catalog-list.html',
  styleUrl: './catalog-list.css',
})
export class CatalogList implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;

  searchQuery = '';
  books = signal<Book[]>([]);
  selectedReservationBook = signal<Book | null>(null);
  reserveModalOpen = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  count = signal(0);
  currentPage = signal(1);

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks(page = this.currentPage()) {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = { page: String(page) };
    const searchQuery = normalizeText(this.searchQuery);
    this.searchQuery = searchQuery;
    if (searchQuery) params['q'] = searchQuery;

    this.api.getBooks(params).subscribe({
      next: (response) => {
        this.books.set(response.results);
        this.count.set(response.count);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się załadować książek.');
        this.loading.set(false);
      },
    });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadBooks(1);
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadBooks(page);
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  isStaff(): boolean {
    return this.auth.isStaff();
  }

  getLoginQueryParams(bookId: number): { redirectTo: string } {
    return { redirectTo: `/catalog/${bookId}` };
  }

  getReservationLabel(book: Book): string {
    if (book.user_has_active_reservation) {
      return 'Masz rezerwację';
    }

    return this.getAvailableCopies(book) > 0 ? 'Zarezerwuj' : 'Kolejka';
  }

  isReservationDisabled(book: Book): boolean {
    return Boolean(book.user_has_active_reservation);
  }

  requestReservation(book: Book): void {
    if (this.isReservationDisabled(book)) {
      return;
    }

    this.selectedReservationBook.set(book);
    this.error.set(null);
    this.reserveModalOpen.set(true);
  }

  closeReservationModal(): void {
    this.reserveModalOpen.set(false);
    this.selectedReservationBook.set(null);
  }

  confirmReservation(): void {
    const book = this.selectedReservationBook();
    if (!book) {
      return;
    }

    this.closeReservationModal();
    this.router.navigate(['/catalog', book.id], {
      queryParams: { autoReserve: '1' },
    });
  }

  getReservationModalTitle(): string {
    const book = this.selectedReservationBook();
    if (!book) {
      return 'Kontynuuj';
    }

    return this.getAvailableCopies(book) > 0 ? 'Zarezerwuj odbiór' : 'Dołącz do kolejki';
  }

  getReservationModalDescription(): string {
    const book = this.selectedReservationBook();
    if (!book) {
      return 'Przejdziesz do szczegółów książki, gdzie dokończysz rezerwację.';
    }

    if (this.getAvailableCopies(book) > 0) {
      return 'Najpierw przejdziemy do szczegółów książki, a potem zapiszesz egzemplarz do odbioru.';
    }

    return 'Najpierw przejdziemy do szczegółów książki, a potem dołączysz do kolejki rezerwacji.';
  }

  getReservationConfirmLabel(): string {
    return 'Kontynuuj';
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
    return Math.max(book.available_copies - book.active_reservations, 0);
  }

  getTotalCopies(book: Book): number {
    return book.copies_count;
  }

  getStatus(book: Book): 'available' | 'unavailable' {
    return this.getAvailableCopies(book) > 0 ? 'available' : 'unavailable';
  }

  getStatusLabel(book: Book): string {
    return this.getAvailableCopies(book) > 0 ? 'Dostępna' : 'Zajęta';
  }

  getStatusClasses(book: Book): string {
    return this.getAvailableCopies(book) > 0
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  }
}
