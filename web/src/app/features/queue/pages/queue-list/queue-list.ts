import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DEFAULT_PAGE_SIZE } from '../../../../core/models/pagination';
import { Reservation } from '../../../../core/models/reservation';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Modal } from '../../../../shared/components/modal/modal';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { getTodayIsoDate } from '../../../../shared/utils/form-normalization';

@Component({
  selector: 'app-queue-list',
  imports: [RouterLink, Modal, Pagination],
  templateUrl: './queue-list.html',
  styleUrl: './queue-list.css',
})
export class QueueList implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;

  activeFilter: Reservation['status'] | 'all' = 'all';
  reservations = signal<Reservation[]>([]);
  loading = signal(false);
  actionModalOpen = signal(false);
  actionModalTitle = signal('');
  actionModalDescription = signal('');
  error = signal<string | null>(null);
  count = signal(0);
  currentPage = signal(1);
  private pendingAction: (() => void) | null = null;

  filters: { label: string; value: Reservation['status'] | 'all' }[] = [
    { label: 'Wszystkie', value: 'all' },
    { label: 'Oczekujące', value: 'pending' },
    { label: 'Wydane', value: 'fulfilled' },
    { label: 'Anulowane', value: 'cancelled' },
    { label: 'Wygasłe', value: 'expired' },
  ];

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadReservations();
  }

  isStaff(): boolean {
    return this.auth.isStaff();
  }

  loadReservations(page = this.currentPage()) {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = { page: String(page) };
    if (this.activeFilter !== 'all') {
      params['status'] = this.activeFilter;
    }

    this.api.getReservations(params).subscribe({
      next: (response) => {
        this.reservations.set(response.results);
        this.count.set(response.count);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać rezerwacji.');
        this.loading.set(false);
      },
    });
  }

  setFilter(filter: Reservation['status'] | 'all') {
    this.activeFilter = filter;
    this.currentPage.set(1);
    this.loadReservations(1);
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadReservations(page);
  }

  cancelReservation(id: number) {
    this.api.cancelReservation(id).subscribe({
      next: () => this.loadReservations(),
      error: () => this.error.set('Nie udało się anulować rezerwacji.'),
    });
  }

  requestCancelReservation(id: number) {
    this.openActionModal(
      'Anulować rezerwację?',
      'Rezerwacja zostanie usunięta z aktywnej kolejki.',
      () => this.cancelReservation(id),
    );
  }

  issueReservation(id: number) {
    this.api.issueReservation(id).subscribe({
      next: () => this.loadReservations(),
      error: (err) => {
        this.error.set(
          err?.error?.detail?.[0] ??
            err?.error?.detail ??
            'Nie udało się wydać książki z rezerwacji.',
        );
      },
    });
  }

  requestIssueReservation(id: number) {
    this.openActionModal(
      'Wydać książkę czytelnikowi?',
      'System utworzy 7-dniowe wypożyczenie na podstawie tej rezerwacji.',
      () => this.issueReservation(id),
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

  getStatusLabel(status: Reservation['status']): string {
    const labels = {
      pending: 'Oczekuje',
      fulfilled: 'Wydano',
      cancelled: 'Anulowano',
      expired: 'Wygasło',
    };

    return labels[status];
  }

  getStatusClasses(status: Reservation['status']): string {
    const classes = {
      pending: 'bg-amber-100 text-amber-700',
      fulfilled: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-rose-100 text-rose-700',
      expired: 'bg-slate-200 text-slate-700',
    };

    return classes[status];
  }

  canIssueReservation(reservation: Reservation): boolean {
    return Boolean(
      reservation.status === 'pending' &&
      reservation.estimated_ready_date &&
      reservation.estimated_ready_date <= getTodayIsoDate(),
    );
  }
}
