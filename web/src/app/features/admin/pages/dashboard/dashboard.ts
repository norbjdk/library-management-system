import { Component, computed, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Author, Category, Copy, Location, Publisher } from '../../../../core/models/book';
import { Fine } from '../../../../core/models/fine';
import { Loan } from '../../../../core/models/loan';
import { Notification } from '../../../../core/models/notification';
import { Order } from '../../../../core/models/order';
import { DEFAULT_PAGE_SIZE } from '../../../../core/models/pagination';
import { Reservation } from '../../../../core/models/reservation';
import { DashboardStats } from '../../../../core/models/stats';
import { User } from '../../../../core/models/user';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Pagination } from '../../../../shared/components/pagination/pagination';

type DashboardSection =
  | 'readers'
  | 'loans'
  | 'authors'
  | 'publishers'
  | 'categories'
  | 'locations'
  | 'copies'
  | 'reservations'
  | 'fines'
  | 'orders'
  | 'notifications';

const INITIAL_SECTION_PAGES: Record<DashboardSection, number> = {
  readers: 1,
  loans: 1,
  authors: 1,
  publishers: 1,
  categories: 1,
  locations: 1,
  copies: 1,
  reservations: 1,
  fines: 1,
  orders: 1,
  notifications: 1,
};

const INITIAL_SECTION_COUNTS: Record<DashboardSection, number> = {
  readers: 0,
  loans: 0,
  authors: 0,
  publishers: 0,
  categories: 0,
  locations: 0,
  copies: 0,
  reservations: 0,
  fines: 0,
  orders: 0,
  notifications: 0,
};

@Component({
  selector: 'app-dashboard',
  imports: [Pagination],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;

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
  sectionPages = signal<Record<DashboardSection, number>>({ ...INITIAL_SECTION_PAGES });
  sectionCounts = signal<Record<DashboardSection, number>>({ ...INITIAL_SECTION_COUNTS });

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
        label: 'Nieopłacone kary',
        value: snapshot.unpaidFines,
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

    const summaryParams = { page: '1', page_size: String(this.pageSize) };

    forkJoin({
      books: this.api.getBooks(summaryParams),
      loans: this.api.getLoans(this.buildSectionParams('loans')),
      overdueLoans: this.api.getLoans({ ...summaryParams, overdue: 'true' }),
      readers: this.api.getReaders(this.buildSectionParams('readers')),
      reservations: this.api.getReservations(this.buildSectionParams('reservations')),
      fines: this.api.getFines(this.buildSectionParams('fines')),
      unpaidFines: this.api.getFines({ ...summaryParams, paid: 'false' }),
      orders: this.api.getOrders(this.buildSectionParams('orders')),
      draftOrders: this.api.getOrders({ ...summaryParams, status: 'draft' }),
      submittedOrders: this.api.getOrders({ ...summaryParams, status: 'submitted' }),
      processingOrders: this.api.getOrders({ ...summaryParams, status: 'processing' }),
      notifications: this.api.getNotifications(this.buildSectionParams('notifications')),
      authors: this.api.getAuthors(this.buildSectionParams('authors')),
      publishers: this.api.getPublishers(this.buildSectionParams('publishers')),
      categories: this.api.getCategories(this.buildSectionParams('categories')),
      locations: this.api.getLocations(this.buildSectionParams('locations')),
      copies: this.api.getCopies(this.buildSectionParams('copies')),
    }).subscribe({
      next: ({
        books,
        loans,
        overdueLoans,
        readers,
        reservations,
        fines,
        unpaidFines,
        orders,
        draftOrders,
        submittedOrders,
        processingOrders,
        notifications,
        authors,
        publishers,
        categories,
        locations,
        copies,
      }) => {
        const pendingOrders = draftOrders.count + submittedOrders.count + processingOrders.count;

        this.stats.set({
          totalBooks: books.count,
          activeLoans: loans.count,
          overdueLoans: overdueLoans.count,
          totalUsers: readers.count,
          pendingOrders,
          unpaidFines: unpaidFines.count,
        });

        this.sectionCounts.set({
          readers: readers.count,
          loans: loans.count,
          authors: authors.count,
          publishers: publishers.count,
          categories: categories.count,
          locations: locations.count,
          copies: copies.count,
          reservations: reservations.count,
          fines: fines.count,
          orders: orders.count,
          notifications: notifications.count,
        });
        this.readers.set(readers.results);
        this.recentLoans.set(loans.results);
        this.reservations.set(reservations.results);
        this.fines.set(fines.results);
        this.orders.set(orders.results);
        this.notifications.set(notifications.results);
        this.authors.set(authors.results);
        this.publishers.set(publishers.results);
        this.categories.set(categories.results);
        this.locations.set(locations.results);
        this.copies.set(copies.results);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać danych panelu.');
        this.loading.set(false);
      },
    });
  }

  private buildSectionParams(
    section: DashboardSection,
    extraParams: Record<string, string> = {},
  ): Record<string, string> {
    return {
      ...extraParams,
      page: String(this.sectionPages()[section]),
      page_size: String(this.pageSize),
    };
  }

  getGreeting(): string {
    const user = this.auth.user();
    return user?.first_name
      ? `Witaj z powrotem, ${user.first_name}`
      : 'Podgląd bieżącej sytuacji biblioteki';
  }

  getStatusClasses(status: string): string {
    if (status === 'active') {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (status === 'overdue') {
      return 'bg-rose-100 text-rose-700';
    }
    return 'bg-slate-200 text-slate-700';
  }

  getStatusLabel(status: string): string {
    if (status === 'active') return 'Aktywne';
    if (status === 'overdue') return 'Przeterminowane';
    return 'Zwrócono';
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
      pending: 'Oczekuje',
      fulfilled: 'Wydano',
      cancelled: 'Anulowano',
      expired: 'Wygasło',
    };
    return labels[status];
  }

  getRoleLabel(role: User['role']): string {
    const labels: Record<User['role'], string> = {
      admin: 'Administrator',
      librarian: 'Bibliotekarz',
      reader: 'Czytelnik',
    };

    return labels[role];
  }

  getSectionPage(section: DashboardSection): number {
    return this.sectionPages()[section];
  }

  getSectionCount(section: DashboardSection): number {
    return this.sectionCounts()[section];
  }

  setSectionPage(section: DashboardSection, page: number): void {
    this.sectionPages.update((state) => ({
      ...state,
      [section]: page,
    }));
    this.loadDashboard();
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
