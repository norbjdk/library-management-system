import { Component, OnInit, signal } from '@angular/core';
import { Notification, NotificationType } from '../../../../core/models/notification';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-notifications-list',
  imports: [],
  templateUrl: './notifications-list.html',
})
export class NotificationsList implements OnInit {
  activeFilter: 'all' | 'unread' | 'read' = 'all';
  notifications = signal<Notification[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  count = signal(0);

  filters: { label: string; value: 'all' | 'unread' | 'read' }[] = [
    { label: 'Wszystkie', value: 'all' },
    { label: 'Nieprzeczytane', value: 'unread' },
    { label: 'Przeczytane', value: 'read' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = {};
    if (this.activeFilter === 'unread') params['unread'] = 'true';
    if (this.activeFilter === 'read') params['unread'] = 'false';

    this.api.getNotifications(params).subscribe({
      next: (response) => {
        this.notifications.set(response.results);
        this.count.set(response.count);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się załadować powiadomień.');
        this.loading.set(false);
      },
    });
  }

  setFilter(filter: 'all' | 'unread' | 'read') {
    this.activeFilter = filter;
    this.loadNotifications();
  }

  markRead(id: number) {
    this.api.markNotificationRead(id).subscribe({
      next: () => this.loadNotifications(),
      error: () => this.error.set('Nie udało się oznaczyć powiadomienia.'),
    });
  }

  markAllRead() {
    this.api.markAllNotificationsRead().subscribe({
      next: () => this.loadNotifications(),
      error: () => this.error.set('Nie udało się oznaczyć wszystkich powiadomień.'),
    });
  }

  getTypeLabel(type: Notification['notification_type']): string {
    const labels: Record<NotificationType, string> = {
      loan_due: 'Termin',
      fine_issued: 'Kara',
      reservation_ready: 'Rezerwacja',
      order_update: 'Zamówienie',
      system: 'System',
    };
    return labels[type] ?? type;
  }

  getTypeClasses(type: Notification['notification_type']): string {
    const classes: Record<NotificationType, string> = {
      loan_due: 'bg-amber-100 text-amber-700',
      fine_issued: 'bg-red-100 text-red-700',
      reservation_ready: 'bg-green-100 text-green-700',
      order_update: 'bg-violet-100 text-violet-700',
      system: 'bg-blue-100 text-blue-700',
    };
    return classes[type] ?? 'bg-slate-100 text-slate-600';
  }
}
