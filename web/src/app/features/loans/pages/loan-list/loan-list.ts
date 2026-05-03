import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Loan } from '../../../../core/models/loan';

@Component({
  selector: 'app-loan-list',
  imports: [FormsModule],
  templateUrl: './loan-list.html',
})
export class LoanList {
  searchQuery = '';
  activeFilter: Loan['status'] | 'all' = 'all';

  filters: { label: string; value: Loan['status'] | 'all' }[] = [
    { label: 'Wszystkie', value: 'all' },
    { label: 'Aktywne', value: 'active' },
    { label: 'Przeterminowane', value: 'overdue' },
    { label: 'Zwrócone', value: 'returned' },
    { label: 'Zarezerwowane', value: 'reserved' },
  ];

  loans: Loan[] = [
    { id: 1, user: 1, copy: 1, loan_date: '2026-05-01', due_date: '2026-05-15', return_date: null, status: 'active' },
    { id: 2, user: 2, copy: 6, loan_date: '2026-04-20', due_date: '2026-05-04', return_date: null, status: 'overdue' },
    { id: 3, user: 3, copy: 3, loan_date: '2026-04-28', due_date: '2026-05-12', return_date: null, status: 'active' },
    { id: 4, user: 4, copy: 2, loan_date: '2026-04-15', due_date: '2026-04-29', return_date: null, status: 'overdue' },
    { id: 5, user: 5, copy: 4, loan_date: '2026-05-02', due_date: '2026-05-16', return_date: null, status: 'active' },
    { id: 6, user: 6, copy: 5, loan_date: '2026-04-01', due_date: '2026-04-15', return_date: '2026-04-14', status: 'returned' },
    { id: 7, user: 7, copy: 1, loan_date: '2026-05-03', due_date: '2026-05-17', return_date: null, status: 'reserved' },
  ];

  get filteredLoans(): Loan[] {
    return this.loans.filter(l => {
      const matchesFilter = this.activeFilter === 'all' || l.status === this.activeFilter;
      const matchesSearch = !this.searchQuery ||
        l.user.toString().includes(this.searchQuery) ||
        l.copy.toString().includes(this.searchQuery);
      return matchesFilter && matchesSearch;
    });
  }

  getStatusClasses(status: Loan['status']): string {
    const classes = {
      active: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      returned: 'bg-slate-100 text-slate-600',
      reserved: 'bg-yellow-100 text-yellow-700',
    };
    return classes[status];
  }

  getStatusLabel(status: Loan['status']): string {
    const labels = {
      active: 'Aktywne',
      overdue: 'Przeterminowane',
      returned: 'Zwrócone',
      reserved: 'Zarezerwowane',
    };
    return labels[status];
  }
}
