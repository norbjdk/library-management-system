import { Component, computed, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Author, Category, Copy, Location, Publisher } from '../../../../core/models/book';
import { Fine } from '../../../../core/models/fine';
import { Loan } from '../../../../core/models/loan';
import { Notification } from '../../../../core/models/notification';
import { Order } from '../../../../core/models/order';
import { Reservation } from '../../../../core/models/reservation';
import { DashboardStats } from '../../../../core/models/stats';
import { User } from '../../../../core/models/user';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  stats = signal<DashboardStats | null>(null);
  recentLoans = signal<Loan[]>([]);
  readers = signal<User[]>([]);
  reservations = signal<Reservation[]>([]);
  fines = signal<Fine[]>([]);
  orders = signal<Order[]>([]);
  notifications = signal<Notification[]>([]);
  authors = signal<Author[]>([]);
  publishers = signal<Publisher[]>([]);
  categories = signal<Category[]>([]);
  locations = signal<Location[]>([]);
  copies = signal<Copy[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  cards = computed(() => {
    const snapshot = this.stats();
    if (!snapshot) {
      return [];
    }

    return [
      {
        label: 'Wszystkich książek',
        value: snapshot.totalBooks,
        icon: '📚',
        color: 'bg-sky-100 text-sky-700',
      },
      {
        label: 'Aktywnych wypożyczeń',
        value: snapshot.activeLoans,
        icon: '🔄',
        color: 'bg-emerald-100 text-emerald-700',
      },
      {
        label: 'Przeterminowanych',
        value: snapshot.overdueLoans,
        icon: '⚠️',
        color: 'bg-rose-100 text-rose-700',
      },
      {
        label: 'Użytkowników',
        value: snapshot.totalUsers,
        icon: '👥',
        color: 'bg-amber-100 text-amber-700',
      },
      {
        label: 'Zamówień otwartych',
        value: snapshot.pendingOrders,
        icon: '📦',
        color: 'bg-violet-100 text-violet-700',
      },
      {
        label: 'Kar (PLN)',
        value: snapshot.totalFines.toFixed(2),
        icon: '💰',
        color: 'bg-orange-100 text-orange-700',
      },
    ];
  });

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);
    this.error.set(null);

    const bulkParams = { page_size: '200' };

    forkJoin({
      books: this.api.getBooks(bulkParams),
      loans: this.api.getLoans(bulkParams),
      overdueLoans: this.api.getLoans({ ...bulkParams, overdue: 'true' }),
      readers: this.api.getReaders(bulkParams),
      reservations: this.api.getReservations(bulkParams),
      fines: this.api.getFines(bulkParams),
      orders: this.api.getOrders(bulkParams),
      notifications: this.api.getNotifications(bulkParams),
      authors: this.api.getAuthors(bulkParams),
      publishers: this.api.getPublishers(bulkParams),
      categories: this.api.getCategories(bulkParams),
      locations: this.api.getLocations(bulkParams),
      copies: this.api.getCopies(bulkParams),
    }).subscribe({
      next: ({
        books,
        loans,
        overdueLoans,
        readers,
        reservations,
        fines,
        orders,
        notifications,
        authors,
        publishers,
        categories,
        locations,
        copies,
      }) => {
        const pendingOrders = orders.results.filter(
          (order) => !['received', 'cancelled'].includes(order.status),
        ).length;
        const totalFines = fines.results.reduce((total, fine) => total + Number(fine.amount), 0);

        this.stats.set({
          totalBooks: books.count,
          activeLoans: loans.count,
          overdueLoans: overdueLoans.count,
          totalUsers: readers.count,
          pendingOrders,
          totalFines,
        });
        this.readers.set(readers.results);
        this.recentLoans.set(loans.results.slice(0, 5));
        this.reservations.set(reservations.results.slice(0, 5));
        this.fines.set(fines.results.slice(0, 5));
        this.orders.set(orders.results.slice(0, 5));
        this.notifications.set(notifications.results.slice(0, 5));
        this.authors.set(authors.results);
        this.publishers.set(publishers.results);
        this.categories.set(categories.results);
        this.locations.set(locations.results);
        this.copies.set(copies.results);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać danych dashboardu.');
        this.loading.set(false);
      },
    });
  }

  getGreeting(): string {
    const user = this.auth.user();
    return user?.first_name
      ? `Witaj z powrotem, ${user.first_name}`
      : 'Przegląd bieżącej sytuacji biblioteki';
  }

  getStatusClasses(status: string): string {
    return status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
  }

  getStatusLabel(status: string): string {
    if (status === 'active') return 'Aktywne';
    if (status === 'overdue') return 'Przeterminowane';
    return 'Zwrócone';
  }

  getCopyConditionLabel(condition: string): string {
    const labels: Record<string, string> = {
      good: 'Dobry',
      worn: 'Zużyty',
      damaged: 'Uszkodzony',
      lost: 'Zagubiony',
    };
    return labels[condition] ?? condition;
  }

  getReservationStatusLabel(status: Reservation['status']): string {
    const labels: Record<Reservation['status'], string> = {
      pending: 'Oczekująca',
      fulfilled: 'Zrealizowana',
      cancelled: 'Anulowana',
      expired: 'Wygasła',
    };
    return labels[status];
  }

  getOrderStatusLabel(status: Order['status']): string {
    const labels: Record<Order['status'], string> = {
      draft: 'Szkic',
      submitted: 'Złożone',
      processing: 'W realizacji',
      received: 'Odebrane',
      cancelled: 'Anulowane',
    };
    return labels[status];
  }

  getNotificationTypeLabel(type: Notification['notification_type']): string {
    const labels: Record<Notification['notification_type'], string> = {
      loan_due: 'Termin zwrotu',
      fine_issued: 'Kara',
      reservation_ready: 'Rezerwacja gotowa',
      order_update: 'Aktualizacja zamówienia',
      system: 'Systemowe',
    };
    return labels[type];
  }
}
