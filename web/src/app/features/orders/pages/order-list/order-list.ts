import { Component, OnInit, signal } from '@angular/core';
import { Order } from '../../../../core/models/order';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-order-list',
  imports: [],
  templateUrl: './order-list.html',
})
export class OrderList implements OnInit {
  activeFilter: Order['status'] | 'all' = 'all';
  orders = signal<Order[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  count = signal(0);

  filters: { label: string; value: Order['status'] | 'all' }[] = [
    { label: 'Wszystkie', value: 'all' },
    { label: 'Szkic', value: 'draft' },
    { label: 'Złożone', value: 'submitted' },
    { label: 'Odebrane', value: 'received' },
    { label: 'Anulowane', value: 'cancelled' },
  ];

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadOrders();
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
      }
    });
  }

  setFilter(filter: Order['status'] | 'all') {
    this.activeFilter = filter;
    this.loadOrders();
  }

  submitOrder(id: number) {
    this.api.submitOrder(id).subscribe({
      next: () => this.loadOrders(),
      error: () => this.error.set('Nie udało się złożyć zamówienia.')
    });
  }

  receiveOrder(id: number) {
    this.api.receiveOrder(id).subscribe({
      next: () => this.loadOrders(),
      error: () => this.error.set('Nie udało się odebrać zamówienia.')
    });
  }

  cancelOrder(id: number) {
    this.api.cancelOrder(id).subscribe({
      next: () => this.loadOrders(),
      error: () => this.error.set('Nie udało się anulować zamówienia.')
    });
  }

  getStatusClasses(status: Order['status']): string {
    const classes = {
      draft: 'bg-slate-100 text-slate-600',
      submitted: 'bg-blue-100 text-blue-700',
      received: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return classes[status];
  }

  getStatusLabel(status: Order['status']): string {
    const labels = {
      draft: 'Szkic',
      submitted: 'Złożone',
      received: 'Odebrane',
      cancelled: 'Anulowane',
    };
    return labels[status];
  }
}
