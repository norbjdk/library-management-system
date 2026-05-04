import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Loan } from '../../../../core/models/loan';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Alert } from '../../../../shared/components/alert/alert';
import { Badge, BadgeTone } from '../../../../shared/components/badge/badge';
import { Breadcrumb, BreadcrumbItem } from '../../../../shared/components/breadcrumb/breadcrumb';
import { Button } from '../../../../shared/components/button/button';
import { Modal } from '../../../../shared/components/modal/modal';
import { Spinner } from '../../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-loan-detail',
  imports: [RouterLink, Alert, Badge, Breadcrumb, Button, Modal, Spinner],
  templateUrl: './loan-detail.html',
  styleUrl: './loan-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanDetail implements OnInit {
  loan = signal<Loan | null>(null);
  loading = signal(false);
  returning = signal(false);
  extending = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  showReturnModal = signal(false);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const current = this.loan();
    return [
      { label: 'Panel', path: '/catalog' },
      { label: 'Wypożyczenia', path: '/loans' },
      { label: current ? `Pozycja #${current.id}` : 'Szczegóły' },
    ];
  });

  statusLabel = computed(() => {
    const current = this.loan();
    if (!current) {
      return 'Brak danych';
    }

    const labels: Record<Loan['status'], string> = {
      active: 'Aktywne',
      overdue: 'Przeterminowane',
      returned: 'Zwrócone',
    };

    return labels[current.status];
  });

  statusTone = computed<BadgeTone>(() => {
    const status = this.loan()?.status;
    if (status === 'overdue') {
      return 'danger';
    }

    if (status === 'returned') {
      return 'neutral';
    }

    return 'success';
  });

  canReturn = computed(() => {
    const current = this.loan();
    return !!current && current.status !== 'returned' && this.auth.isStaff();
  });

  canExtend = computed(() => {
    const current = this.loan();
    return !!current && current.status !== 'returned' && this.auth.isStaff();
  });

  showReadOnlyNotice = computed(() => {
    const current = this.loan();
    return !!current && current.status !== 'returned' && !this.auth.isStaff();
  });

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const loanId = Number(this.route.snapshot.paramMap.get('id'));
    if (!loanId) {
      this.error.set('Nieprawidłowy identyfikator wypożyczenia.');
      return;
    }

    this.loadLoan(loanId);
  }

  loadLoan(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.api.getLoan(id).subscribe({
      next: (loan) => {
        this.loan.set(loan);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać szczegółów wypożyczenia.');
        this.loading.set(false);
      },
    });
  }

  openReturnModal(): void {
    this.showReturnModal.set(true);
  }

  closeReturnModal(): void {
    this.showReturnModal.set(false);
  }

  confirmReturn(): void {
    const current = this.loan();
    if (!current) {
      return;
    }

    this.returning.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api.returnLoan(current.id).subscribe({
      next: (loan) => {
        this.loan.set(loan);
        this.returning.set(false);
        this.showReturnModal.set(false);
        this.success.set('Zwrot został zaksięgowany.');
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'Nie udało się zaksięgować zwrotu.');
        this.returning.set(false);
        this.showReturnModal.set(false);
      },
    });
  }

  extendLoanByWeek(): void {
    const current = this.loan();
    if (!current) {
      return;
    }

    this.extending.set(true);
    this.error.set(null);
    this.success.set(null);

    this.api.extendLoan(current.id, 7).subscribe({
      next: (loan) => {
        this.loan.set(loan);
        this.extending.set(false);
        this.success.set('Termin zwrotu został przedłużony o 7 dni.');
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'Nie udało się przedłużyć wypożyczenia.');
        this.extending.set(false);
      },
    });
  }
}
