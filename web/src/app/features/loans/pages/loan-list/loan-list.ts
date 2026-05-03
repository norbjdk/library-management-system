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
    { id: 1, user: 'Anna Nowak', userId: 1, book: 'Wiedźmin: Ostatnie życzenie', bookId: 1, isbn: '978-83-7785-149-2', borrowedDate: '2026-05-01', dueDate: '2026-05-15', status: 'active' },
    { id: 2, user: 'Piotr Wiśniewski', userId: 2, book: 'Diuna', bookId: 6, isbn: '978-83-0000-000-5', borrowedDate: '2026-04-20', dueDate: '2026-05-04', status: 'overdue' },
    { id: 3, user: 'Maria Kowalska', userId: 3, book: 'Solaris', bookId: 3, isbn: '978-83-0000-000-2', borrowedDate: '2026-04-28', dueDate: '2026-05-12', status: 'active' },
    { id: 4, user: 'Tomasz Zając', userId: 4, book: 'Pan Tadeusz', bookId: 2, isbn: '978-83-0000-000-1', borrowedDate: '2026-04-15', dueDate: '2026-04-29', status: 'overdue' },
    { id: 5, user: 'Karolina Lewandowska', userId: 5, book: 'Harry Potter', bookId: 4, isbn: '978-83-0000-000-3', borrowedDate: '2026-05-02', dueDate: '2026-05-16', status: 'active' },
    { id: 6, user: 'Marek Jabłoński', userId: 6, book: 'Zbrodnia i kara', bookId: 5, isbn: '978-83-0000-000-4', borrowedDate: '2026-04-01', dueDate: '2026-04-15', returnedDate: '2026-04-14', status: 'returned' },
    { id: 7, user: 'Ewa Kamińska', userId: 7, book: 'Wiedźmin: Ostatnie życzenie', bookId: 1, isbn: '978-83-7785-149-2', borrowedDate: '2026-05-03', dueDate: '2026-05-17', status: 'reserved' },
  ];

  get filteredLoans(): Loan[] {
    return this.loans.filter(l => {
      const matchesFilter = this.activeFilter === 'all' || l.status === this.activeFilter;
      const matchesSearch = !this.searchQuery ||
        l.user.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        l.book.toLowerCase().includes(this.searchQuery.toLowerCase());
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
