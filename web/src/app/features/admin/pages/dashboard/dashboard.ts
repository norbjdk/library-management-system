import { Component } from '@angular/core';
import { DashboardStats } from '../../../../core/models/stats';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  stats: DashboardStats = {
    totalBooks: 1243,
    activeLoans: 87,
    overdueLoans: 12,
    totalUsers: 340,
    pendingOrders: 5,
    totalFines: 230.5,
  };

  cards = [
    {
      label: 'Wszystkich książek',
      value: this.stats.totalBooks,
      icon: '📚',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Aktywnych wypożyczeń',
      value: this.stats.activeLoans,
      icon: '🔄',
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Przeterminowanych',
      value: this.stats.overdueLoans,
      icon: '⚠️',
      color: 'bg-red-50 text-red-700',
    },
    {
      label: 'Użytkowników',
      value: this.stats.totalUsers,
      icon: '👥',
      color: 'bg-purple-50 text-purple-700',
    },
    {
      label: 'Zamówień w kolejce',
      value: this.stats.pendingOrders,
      icon: '📦',
      color: 'bg-yellow-50 text-yellow-700',
    },
    {
      label: 'Kar (PLN)',
      value: this.stats.totalFines,
      icon: '💰',
      color: 'bg-orange-50 text-orange-700',
    },
  ];

  recentLoans = [
    {
      user: 'Anna Nowak',
      book: 'Wiedźmin: Ostatnie życzenie',
      date: '2026-05-01',
      due: '2026-05-15',
      status: 'active',
    },
    {
      user: 'Piotr Wiśniewski',
      book: 'Diuna',
      date: '2026-04-20',
      due: '2026-05-04',
      status: 'overdue',
    },
    {
      user: 'Maria Kowalska',
      book: 'Solaris',
      date: '2026-04-28',
      due: '2026-05-12',
      status: 'active',
    },
    {
      user: 'Tomasz Zając',
      book: 'Pan Tadeusz',
      date: '2026-04-15',
      due: '2026-04-29',
      status: 'overdue',
    },
    {
      user: 'Karolina Lewandowska',
      book: 'Harry Potter',
      date: '2026-05-02',
      due: '2026-05-16',
      status: 'active',
    },
  ];

  getStatusClasses(status: string): string {
    return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Aktywne' : 'Przeterminowane';
  }
}
