import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Book, Category } from '../../../../core/models/book';
import { DEFAULT_PAGE_SIZE } from '../../../../core/models/pagination';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Modal } from '../../../../shared/components/modal/modal';
import { Pagination } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-category-browser',
  imports: [Modal, RouterLink, Pagination],
  templateUrl: './category-browser.html',
  styleUrl: './category-browser.css',
})
export class CategoryBrowser implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;

  categories = signal<Category[]>([]);
  books = signal<Book[]>([]);
  selectedCategory = signal<Category | null>(null);
  selectedReservationBook = signal<Book | null>(null);
  reserveModalOpen = signal(false);
  loadingCategories = signal(false);
  loadingBooks = signal(false);
  error = signal<string | null>(null);
  count = signal(0);
  currentPage = signal(1);

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loadingCategories.set(true);
    this.error.set(null);

    this.api.getCategories().subscribe({
      next: (response) => {
        const categories = response.results;
        this.categories.set(categories);
        this.loadingCategories.set(false);
        this.initializeSelection(categories);
      },
      error: () => {
        this.error.set('Nie udało się załadować kategorii.');
        this.loadingCategories.set(false);
      },
    });
  }

  private initializeSelection(categories: Category[]): void {
    if (!categories.length) {
      this.selectedCategory.set(null);
      this.books.set([]);
      return;
    }

    const requestedId = Number(this.route.snapshot.queryParamMap.get('category'));
    const initialCategory =
      categories.find((category) => category.id === requestedId) ?? categories[0] ?? null;

    if (!initialCategory) {
      return;
    }

    this.currentPage.set(1);
    this.selectCategory(initialCategory.id, false);
  }

  selectCategory(categoryId: number, updateUrl = true): void {
    const category = this.categories().find((item) => item.id === categoryId) ?? null;
    this.selectedCategory.set(category);

    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { category: categoryId },
        queryParamsHandling: 'merge',
      });
    }

    this.currentPage.set(1);
    this.loadBooks(categoryId, 1);
  }

  private loadBooks(categoryId: number, page = this.currentPage()): void {
    this.loadingBooks.set(true);
    this.error.set(null);

    this.api.getBooks({ category: String(categoryId), page: String(page) }).subscribe({
      next: (response) => {
        this.books.set(response.results);
        this.count.set(response.count);
        this.currentPage.set(page);
        this.loadingBooks.set(false);
      },
      error: () => {
        this.error.set('Nie udało się załadować książek dla wybranej kategorii.');
        this.loadingBooks.set(false);
      },
    });
  }

  setPage(page: number): void {
    const categoryId = this.selectedCategory()?.id;
    if (!categoryId) {
      return;
    }

    this.currentPage.set(page);
    this.loadBooks(categoryId, page);
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  isStaff(): boolean {
    return this.auth.isStaff();
  }

  getAuthorNames(book: Book): string {
    if (!book.authors.length) {
      return 'Autor nieznany';
    }

    return book.authors.map((author) => `${author.first_name} ${author.last_name}`).join(', ');
  }

  getReserveLabel(book: Book): string {
    if (book.user_has_active_reservation) {
      return 'Masz rezerwację';
    }

    return this.getBorrowableCopies(book) > 0 ? 'Zarezerwuj' : 'Kolejka';
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

    return this.getBorrowableCopies(book) > 0 ? 'Zarezerwuj odbiór' : 'Dołącz do kolejki';
  }

  getReservationModalDescription(): string {
    const book = this.selectedReservationBook();
    if (!book) {
      return 'Przejdziesz do szczegółów książki, gdzie dokończysz rezerwację.';
    }

    if (this.getBorrowableCopies(book) > 0) {
      return 'Najpierw przejdziemy do szczegółów książki, a potem zapiszesz egzemplarz do odbioru.';
    }

    return 'Najpierw przejdziemy do szczegółów książki, a potem dołączysz do kolejki rezerwacji.';
  }

  getReservationConfirmLabel(): string {
    return 'Kontynuuj';
  }

  getAvailabilityLabel(book: Book): string {
    const borrowableCopies = this.getBorrowableCopies(book);
    if (borrowableCopies > 0) {
      return `${borrowableCopies} z ${book.copies_count} egz. dostępne`;
    }

    return 'Brak wolnych egzemplarzy';
  }

  getBorrowableCopies(book: Book): number {
    return Math.max(book.available_copies - book.active_reservations, 0);
  }

  getLoginQueryParams(bookId: number): { redirectTo: string } {
    return { redirectTo: `/catalog/${bookId}` };
  }
}
