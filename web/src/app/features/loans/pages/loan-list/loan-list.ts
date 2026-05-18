import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Loan } from '../../../../core/models/loan';
import { DEFAULT_PAGE_SIZE } from '../../../../core/models/pagination';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Modal } from '../../../../shared/components/modal/modal';
import { Pagination } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-loan-list',
  imports: [FormsModule, RouterLink, Modal, Pagination],
  templateUrl: './loan-list.html',
  styleUrl: './loan-list.css',
})
export class LoanList implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;

  activeFilter: Loan['status'] | 'all' = 'all';
  loans = signal<Loan[]>([]);
  loading = signal(false);
  returnModalOpen = signal(false);
  error = signal<string | null>(null);
  count = signal(0);
  currentPage = signal(1);
  pendingReturnLoanId = signal<number | null>(null);

  filters: { label: string; value: Loan['status'] | 'all' }[] = [
    { label: 'Wszystkie', value: 'all' },
    { label: 'Aktywne', value: 'active' },
    { label: 'Przeterminowane', value: 'overdue' },
    { label: 'Zwrócone', value: 'returned' },
  ];

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadLoans();
  }

  loadLoans(page = this.currentPage()) {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = { page: String(page) };
    if (this.activeFilter !== 'all') params['status'] = this.activeFilter;

    this.api.getLoans(params).subscribe({
      next: (response) => {
        this.loans.set(response.results);
        this.count.set(response.count);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się załadować wypożyczeń.');
        this.loading.set(false);
      },
    });
  }

  setFilter(filter: Loan['status'] | 'all') {
    this.activeFilter = filter;
    this.currentPage.set(1);
    this.loadLoans(1);
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadLoans(page);
  }

  returnLoan(id: number) {
    this.api.returnLoan(id).subscribe({
      next: () => this.loadLoans(),
      error: () => this.error.set('Nie udało się zwrócić książki.'),
    });
  }

  requestReturnLoan(id: number) {
    this.pendingReturnLoanId.set(id);
    this.returnModalOpen.set(true);
  }

  closeReturnModal() {
    this.returnModalOpen.set(false);
    this.pendingReturnLoanId.set(null);
  }

  confirmReturnLoan() {
    const id = this.pendingReturnLoanId();
    if (id === null) {
      return;
    }

    this.closeReturnModal();
    this.returnLoan(id);
  }

  getStatusClasses(status: Loan['status']): string {
    const classes: Record<Loan['status'], string> = {
      active: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      returned: 'bg-slate-100 text-slate-600',
    };
    return classes[status];
  }

  getStatusLabel(status: Loan['status']): string {
    const labels: Record<Loan['status'], string> = {
      active: 'Aktywne',
      overdue: 'Przeterminowane',
      returned: 'Zwrócono',
    };
    return labels[status];
  }

  isStaff(): boolean {
    return this.auth.isStaff();
  }
}
