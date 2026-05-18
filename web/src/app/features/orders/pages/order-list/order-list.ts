import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Book } from '../../../../core/models/book';
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
  imports: [FormsModule, Modal, Pagination],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css',
})
export class OrderList implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;

  activeFilter: Order['status'] | 'all' = 'all';
  orders = signal<Order[]>([]);
  books = signal<Book[]>([]);
  loading = signal(false);
  creating = signal(false);
  showCreateForm = signal(false);
  actionModalOpen = signal(false);
  actionModalTitle = signal('');
  actionModalDescription = signal('');
  error = signal<string | null>(null);
  count = signal(0);
  currentPage = signal(1);
  bookPage = signal(1);
  bookCount = signal(0);
  private pendingAction: (() => void) | null = null;
  bookSearch = '';

  orderForm = {
    bookId: '',
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
    this.loadBooks();
  }

  loadBooks(page = this.bookPage()) {
    const params: Record<string, string> = { page: String(page) };
    const searchQuery = normalizeText(this.bookSearch);
    this.bookSearch = searchQuery;

    if (searchQuery) {
      params['q'] = searchQuery;
    }

    this.api.getBooks(params).subscribe({
      next: (response) => {
        this.books.set(response.results);
        this.bookCount.set(response.count);
        this.bookPage.set(page);
      },
      error: () => {
        this.error.set('Nie udało się pobrać listy książek do formularza zamówienia.');
      },
    });
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

  searchBooks() {
    this.bookPage.set(1);
    this.loadBooks(1);
  }

  setBookPage(page: number) {
    this.bookPage.set(page);
    this.loadBooks(page);
  }

  toggleCreateForm() {
    this.showCreateForm.update((open) => !open);
    this.error.set(null);
  }

  createOrder() {
    const bookId = normalizeText(this.orderForm.bookId);
    const quantity = Number(this.orderForm.quantity);
    const supplier = normalizeText(this.orderForm.supplier);
    const expected_delivery_date = normalizeDateInput(this.orderForm.expected_delivery_date);
    const notes = normalizeText(this.orderForm.notes);

    this.orderForm = {
      bookId,
      quantity: Number.isFinite(quantity) ? quantity : this.orderForm.quantity,
      supplier,
      expected_delivery_date,
      notes,
    };

    if (!hasText(bookId)) {
      this.error.set('Wybierz książkę do zamówienia.');
      return;
    }

    if (!isPositiveInteger(quantity)) {
      this.error.set('Ilość zamówienia musi być dodatnią liczbą całkowitą.');
      return;
    }

    if (expected_delivery_date && !isValidIsoDate(expected_delivery_date)) {
      this.error.set('Wybierz poprawną datę dostawy.');
      return;
    }

    this.creating.set(true);
    this.error.set(null);

    const payload: Partial<Order> & { book: number } = {
      book: Number(bookId),
      quantity,
      supplier,
      notes,
      expected_delivery_date: expected_delivery_date || null,
    };

    this.api.createOrder(payload).subscribe({
      next: () => {
        this.orderForm = {
          bookId: '',
          quantity: 1,
          supplier: '',
          expected_delivery_date: '',
          notes: '',
        };
        this.creating.set(false);
        this.showCreateForm.set(false);
        this.currentPage.set(1);
        this.loadOrders(1);
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail ?? err?.error?.quantity?.[0] ?? 'Nie udało się utworzyć zamówienia.',
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
}
