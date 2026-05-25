import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Book, Publisher } from '../../../../core/models/book';
import { Order } from '../../../../core/models/order';
import { DEFAULT_PAGE_SIZE } from '../../../../core/models/pagination';
import { ApiService } from '../../../../core/services/api.service';
import { Modal } from '../../../../shared/components/modal/modal';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import {
  hasText,
  isPositiveInteger,
  isValidIsoDate,
  normalizeDateInput,
  normalizeText,
} from '../../../../shared/utils/form-normalization';

@Component({
  selector: 'app-order-list',
  imports: [DatePipe, FormsModule, Modal, Pagination],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css',
})
export class OrderList implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;

  activeFilter: Order['status'] | 'all' = 'all';
  orders = signal<Order[]>([]);
  bookSuggestions = signal<Book[]>([]);
  supplierSuggestions = signal<Publisher[]>([]);
  selectedBook = signal<Book | null>(null);
  loading = signal(false);
  creating = signal(false);
  showCreateForm = signal(false);
  actionModalOpen = signal(false);
  actionModalTitle = signal('');
  actionModalDescription = signal('');
  error = signal<string | null>(null);
  count = signal(0);
  currentPage = signal(1);
  private pendingAction: (() => void) | null = null;
  private lastBookQuery = '';

  orderForm = {
    bookTitle: '',
    bookEan: '',
    bookAuthors: '',
    bookPublisher: '',
    bookPublishYear: '',
    bookDescription: '',
    quantity: 1,
    supplier: '',
    expected_delivery_date: '',
    notes: '',
  };

  filters: { label: string; value: Order['status'] | 'all' }[] = [
    { label: 'Wszystkie', value: 'all' },
    { label: 'Szkic', value: 'draft' },
    { label: 'Złożone', value: 'submitted' },
    { label: 'W realizacji', value: 'processing' },
    { label: 'Odebrane', value: 'received' },
    { label: 'Anulowane', value: 'cancelled' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadOrders();
    this.loadSupplierSuggestions();
  }

  loadOrders(page = this.currentPage()) {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = { page: String(page) };
    if (this.activeFilter !== 'all') params['status'] = this.activeFilter;

    this.api.getOrders(params).subscribe({
      next: (response) => {
        this.orders.set(response.results);
        this.count.set(response.count);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się załadować zamówień.');
        this.loading.set(false);
      },
    });
  }

  setFilter(filter: Order['status'] | 'all') {
    this.activeFilter = filter;
    this.currentPage.set(1);
    this.loadOrders(1);
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadOrders(page);
  }

  loadSupplierSuggestions() {
    this.api.getPublishers({ page: '1' }).subscribe({
      next: (response) => {
        this.supplierSuggestions.set(response.results);
      },
      error: () => {
        this.supplierSuggestions.set([]);
      },
    });
  }

  onBookTitleInput(value: string) {
    const query = normalizeText(value);
    this.lastBookQuery = query;
    const matchedBook = this.findBookByTitle(query, this.bookSuggestions());
    this.selectedBook.set(matchedBook);

    if (matchedBook) {
      this.populateBookMetadata(matchedBook);
    }

    if (query.length < 2) {
      this.bookSuggestions.set([]);
      return;
    }

    this.api.getBooks({ q: query, page: '1' }).subscribe({
      next: (response) => {
        if (this.lastBookQuery !== query) {
          return;
        }

        this.bookSuggestions.set(response.results);
        const nextMatchedBook = this.findBookByTitle(query, response.results);
        this.selectedBook.set(nextMatchedBook);
        if (nextMatchedBook) {
          this.populateBookMetadata(nextMatchedBook);
        }
      },
      error: () => {
        if (this.lastBookQuery === query) {
          this.bookSuggestions.set([]);
          this.selectedBook.set(null);
        }
      },
    });
  }

  toggleCreateForm() {
    const nextOpen = !this.showCreateForm();
    this.showCreateForm.set(nextOpen);
    this.error.set(null);

    if (!nextOpen) {
      this.resetOrderForm();
    }
  }

  createOrder() {
    const bookTitle = normalizeText(this.orderForm.bookTitle);
    const bookEan = normalizeText(this.orderForm.bookEan);
    const bookAuthors = normalizeText(this.orderForm.bookAuthors);
    const bookPublisher = normalizeText(this.orderForm.bookPublisher);
    const bookPublishYear = normalizeText(this.orderForm.bookPublishYear);
    const bookDescription = normalizeText(this.orderForm.bookDescription);
    const quantity = Number(this.orderForm.quantity);
    const supplier = normalizeText(this.orderForm.supplier);
    const expected_delivery_date = normalizeDateInput(this.orderForm.expected_delivery_date);
    const notes = normalizeText(this.orderForm.notes);
    const parsedPublishYear = hasText(bookPublishYear) ? Number(bookPublishYear) : null;

    this.orderForm = {
      bookTitle,
      bookEan,
      bookAuthors,
      bookPublisher,
      bookPublishYear,
      bookDescription,
      quantity: Number.isFinite(quantity) ? quantity : this.orderForm.quantity,
      supplier,
      expected_delivery_date,
      notes,
    };

    if (!hasText(bookTitle)) {
      this.error.set('Podaj nazwę książki do zamówienia.');
      return;
    }

    if (!isPositiveInteger(quantity)) {
      this.error.set('Ilość zamówienia musi być dodatnią liczbą całkowitą.');
      return;
    }

    if (
      hasText(bookPublishYear) &&
      (!Number.isInteger(parsedPublishYear) || Number(parsedPublishYear) <= 0)
    ) {
      this.error.set('Rok wydania musi być dodatnią liczbą całkowitą.');
      return;
    }

    if (expected_delivery_date && !isValidIsoDate(expected_delivery_date)) {
      this.error.set('Wybierz poprawną datę dostawy.');
      return;
    }

    this.creating.set(true);
    this.error.set(null);

    const payload: Partial<Order> = {
      quantity,
      supplier,
      notes,
      expected_delivery_date: expected_delivery_date || null,
      requested_book_title: bookTitle,
      requested_book_ean: bookEan || undefined,
      requested_book_authors: bookAuthors || undefined,
      requested_book_publisher: bookPublisher || undefined,
      requested_book_publish_year: parsedPublishYear,
      requested_book_description: bookDescription || undefined,
    };

    this.api.createOrder(payload).subscribe({
      next: () => {
        this.resetOrderForm();
        this.creating.set(false);
        this.showCreateForm.set(false);
        this.currentPage.set(1);
        this.loadOrders(1);
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail ??
            err?.error?.quantity?.[0] ??
            err?.error?.requested_book_title?.[0] ??
            'Nie udało się utworzyć zamówienia.',
        );
        this.creating.set(false);
      },
    });
  }

  requestCreateOrder() {
    this.openActionModal(
      'Utworzyć zamówienie?',
      'Nowe zamówienie pojawi się na liście ze statusem szkicu.',
      () => this.createOrder(),
    );
  }

  submitOrder(id: number) {
    this.api.submitOrder(id).subscribe({
      next: () => this.loadOrders(),
      error: () => this.error.set('Nie udało się złożyć zamówienia.'),
    });
  }

  requestSubmitOrder(id: number) {
    this.openActionModal(
      'Złożyć zamówienie?',
      'Po zatwierdzeniu zamówienie przejdzie do realizacji.',
      () => this.submitOrder(id),
    );
  }

  receiveOrder(id: number) {
    this.api.receiveOrder(id).subscribe({
      next: () => this.loadOrders(),
      error: () => this.error.set('Nie udało się odebrać zamówienia.'),
    });
  }

  requestReceiveOrder(id: number) {
    this.openActionModal(
      'Potwierdzić odbiór?',
      'Zamówienie zostanie oznaczone jako odebrane.',
      () => this.receiveOrder(id),
    );
  }

  cancelOrder(id: number) {
    this.api.cancelOrder(id).subscribe({
      next: () => this.loadOrders(),
      error: () => this.error.set('Nie udało się anulować zamówienia.'),
    });
  }

  requestCancelOrder(id: number) {
    this.openActionModal(
      'Anulować zamówienie?',
      'Tej operacji nie można cofnąć z poziomu listy zamówień.',
      () => this.cancelOrder(id),
    );
  }

  openActionModal(title: string, description: string, action: () => void) {
    this.actionModalTitle.set(title);
    this.actionModalDescription.set(description);
    this.pendingAction = action;
    this.actionModalOpen.set(true);
  }

  closeActionModal() {
    this.actionModalOpen.set(false);
    this.pendingAction = null;
  }

  confirmActionModal() {
    const action = this.pendingAction;
    this.closeActionModal();
    action?.();
  }

  getStatusClasses(status: Order['status']): string {
    const classes = {
      draft: 'bg-slate-100 text-slate-600',
      submitted: 'bg-blue-100 text-blue-700',
      processing: 'bg-violet-100 text-violet-700',
      received: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return classes[status];
  }

  getStatusLabel(status: Order['status']): string {
    const labels = {
      draft: 'Szkic',
      submitted: 'Złożone',
      processing: 'W realizacji',
      received: 'Odebrane',
      cancelled: 'Anulowane',
    };
    return labels[status];
  }

  private resetOrderForm() {
    this.orderForm = {
      bookTitle: '',
      bookEan: '',
      bookAuthors: '',
      bookPublisher: '',
      bookPublishYear: '',
      bookDescription: '',
      quantity: 1,
      supplier: '',
      expected_delivery_date: '',
      notes: '',
    };
    this.bookSuggestions.set([]);
    this.selectedBook.set(null);
    this.lastBookQuery = '';
  }

  private findBookByTitle(title: string, books: Book[]): Book | null {
    const normalizedTitle = this.normalizeBookTitle(title);
    const exactMatch = books.find(
      (book) => this.normalizeBookTitle(book.title) === normalizedTitle,
    );

    return exactMatch ?? (books.length === 1 ? books[0] : null);
  }

  private normalizeBookTitle(title: string): string {
    return normalizeText(title).toLocaleLowerCase();
  }

  private populateBookMetadata(book: Book) {
    this.orderForm = {
      ...this.orderForm,
      bookEan: book.ean ?? this.orderForm.bookEan,
      bookAuthors: this.getAuthorNames(book) || this.orderForm.bookAuthors,
      bookPublisher: book.publisher_name ?? this.orderForm.bookPublisher,
      bookPublishYear: book.publish_year
        ? String(book.publish_year)
        : this.orderForm.bookPublishYear,
      bookDescription: book.description ?? this.orderForm.bookDescription,
    };
  }

  private getAuthorNames(book: Book): string {
    return book.authors.map((author) => `${author.first_name} ${author.last_name}`).join(', ');
  }
}
