import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reservation } from '../../../../core/models/reservation';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Modal } from '../../../../shared/components/modal/modal';

@Component({
  selector: 'app-queue-list',
  imports: [RouterLink, Modal],
  templateUrl: './queue-list.html',
  styleUrl: './queue-list.css',
})
export class QueueList implements OnInit {
  activeFilter: Reservation['status'] | 'all' = 'all';
  reservations = signal<Reservation[]>([]);
  loading = signal(false);
  actionModalOpen = signal(false);
  actionModalTitle = signal('');
  actionModalDescription = signal('');
  error = signal<string | null>(null);
  count = signal(0);
  private pendingAction: (() => void) | null = null;

  filters: { label: string; value: Reservation['status'] | 'all' }[] = [
    { label: 'Wszystkie', value: 'all' },
    { label: 'Oczekujące', value: 'pending' },
    { label: 'Zrealizowane', value: 'fulfilled' },
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

  loadReservations() {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = {};
    if (this.activeFilter !== 'all') {
      params['status'] = this.activeFilter;
    }

    this.api.getReservations(params).subscribe({
      next: (response) => {
        this.reservations.set(response.results);
        this.count.set(response.count);
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
    this.loadReservations();
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

  fulfillReservation(id: number) {
    this.api.fulfillReservation(id).subscribe({
      next: () => this.loadReservations(),
      error: (err) => {
        this.error.set(err?.error?.book?.[0] ?? 'Nie udało się zrealizować rezerwacji.');
      },
    });
  }

  requestFulfillReservation(id: number) {
    this.openActionModal(
      'Zrealizować rezerwację?',
      'System oznaczy rezerwację jako gotową do odbioru dla czytelnika.',
      () => this.fulfillReservation(id),
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
      pending: 'Oczekująca',
      fulfilled: 'Zrealizowana',
      cancelled: 'Anulowana',
      expired: 'Wygasła',
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
}
