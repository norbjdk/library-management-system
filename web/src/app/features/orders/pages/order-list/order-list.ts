import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Book } from '../../../../core/models/book';
import { Order } from '../../../../core/models/order';
import { ApiService } from '../../../../core/services/api.service';
import {
  hasText,
  isPositiveInteger,
  isValidIsoDate,
  normalizeDateInput,
  normalizeText,
} from '../../../../shared/utils/form-normalization';

@Component({
  selector: 'app-order-list',
  imports: [FormsModule],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css',
})
export class OrderList implements OnInit {
  activeFilter: Order['status'] | 'all' = 'all';
  orders = signal<Order[]>([]);
  books = signal<Book[]>([]);
  loading = signal(false);
  creating = signal(false);
  showCreateForm = signal(false);
  error = signal<string | null>(null);
  count = signal(0);

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

  loadBooks() {
    this.api.getBooks().subscribe({
      next: (response) => {
        this.books.set(response.results);
      },
      error: () => {
        this.error.set('Nie udało się pobrać listy książek do formularza zamówienia.');
      },
    });
  }

  loadOrders() {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = {};
    if (this.activeFilter !== 'all') params['status'] = this.activeFilter;

    this.api.getOrders(params).subscribe({
      next: (response) => {
        this.orders.set(response.results);
        this.count.set(response.count);
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
    this.loadOrders();
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
        this.loadOrders();
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail ?? err?.error?.quantity?.[0] ?? 'Nie udało się utworzyć zamówienia.',
        );
        this.creating.set(false);
      },
    });
  }

  submitOrder(id: number) {
    this.api.submitOrder(id).subscribe({
      next: () => this.loadOrders(),
      error: () => this.error.set('Nie udało się złożyć zamówienia.'),
    });
  }

  receiveOrder(id: number) {
    this.api.receiveOrder(id).subscribe({
      next: () => this.loadOrders(),
      error: () => this.error.set('Nie udało się odebrać zamówienia.'),
    });
  }

  cancelOrder(id: number) {
    this.api.cancelOrder(id).subscribe({
      next: () => this.loadOrders(),
      error: () => this.error.set('Nie udało się anulować zamówienia.'),
    });
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
