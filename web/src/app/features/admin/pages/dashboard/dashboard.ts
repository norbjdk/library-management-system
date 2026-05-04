import { Component, computed, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Loan } from '../../../../core/models/loan';
import { DashboardStats } from '../../../../core/models/stats';
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

    forkJoin({
      books: this.api.getBooks(),
      loans: this.api.getLoans(),
      overdueLoans: this.api.getLoans({ overdue: 'true' }),
      readers: this.api.getReaders(),
      orders: this.api.getOrders(),
      fines: this.api.getFines(),
    }).subscribe({
      next: ({ books, loans, overdueLoans, readers, orders, fines }) => {
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
        this.recentLoans.set(loans.results.slice(0, 5));
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
    return status === 'active' ? 'Aktywne' : 'Przeterminowane';
  }
}
