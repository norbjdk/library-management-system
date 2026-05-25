import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Notification, NotificationType } from '../../../../core/models/notification';
import { DEFAULT_PAGE_SIZE } from '../../../../core/models/pagination';
import { ApiService } from '../../../../core/services/api.service';
import { Modal } from '../../../../shared/components/modal/modal';
import { Pagination } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-notifications-list',
  imports: [DatePipe, Modal, Pagination],
  templateUrl: './notifications-list.html',
  styleUrl: './notifications-list.css',
})
export class NotificationsList implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;

  activeFilter: 'all' | 'unread' | 'read' = 'all';
  notifications = signal<Notification[]>([]);
  loading = signal(false);
  markAllModalOpen = signal(false);
  deleteModalOpen = signal(false);
  notificationToDelete = signal<Notification | null>(null);
  error = signal<string | null>(null);
  count = signal(0);
  currentPage = signal(1);

  filters: { label: string; value: 'all' | 'unread' | 'read' }[] = [
    { label: 'Wszystkie', value: 'all' },
    { label: 'Nieprzeczytane', value: 'unread' },
    { label: 'Przeczytane', value: 'read' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications(page = this.currentPage()) {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = { page: String(page) };
    if (this.activeFilter === 'unread') params['unread'] = 'true';
    if (this.activeFilter === 'read') params['unread'] = 'false';

    this.api.getNotifications(params).subscribe({
      next: (response) => {
        this.notifications.set(response.results);
        this.count.set(response.count);
        this.currentPage.set(page);
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
    this.currentPage.set(1);
    this.loadNotifications(1);
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadNotifications(page);
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

  deleteNotification(id: number) {
    this.api.deleteNotification(id).subscribe({
      next: () => this.loadNotifications(),
      error: () => this.error.set('Nie udało się usunąć powiadomienia.'),
    });
  }

  requestMarkAllRead() {
    this.markAllModalOpen.set(true);
  }

  closeMarkAllModal() {
    this.markAllModalOpen.set(false);
  }

  confirmMarkAllRead() {
    this.closeMarkAllModal();
    this.markAllRead();
  }

  requestDeleteNotification(notification: Notification) {
    this.notificationToDelete.set(notification);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.deleteModalOpen.set(false);
    this.notificationToDelete.set(null);
  }

  confirmDeleteNotification() {
    const notification = this.notificationToDelete();
    this.closeDeleteModal();

    if (notification) {
      this.deleteNotification(notification.id);
    }
  }

  getDeleteModalDescription(): string {
    const notification = this.notificationToDelete();
    if (!notification) {
      return 'Powiadomienie zostanie trwale usunięte z Twojej listy.';
    }

    return `Powiadomienie „${notification.title}” zostanie trwale usunięte z Twojej listy.`;
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
