import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { DEFAULT_PAGE_SIZE } from '../../../../core/models/pagination';
import { User } from '../../../../core/models/user';
import { ApiService } from '../../../../core/services/api.service';
import { Alert } from '../../../../shared/components/alert/alert';
import { Badge } from '../../../../shared/components/badge/badge';
import { Breadcrumb, BreadcrumbItem } from '../../../../shared/components/breadcrumb/breadcrumb';
import { Button } from '../../../../shared/components/button/button';
import { Input } from '../../../../shared/components/input/input';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { Spinner } from '../../../../shared/components/spinner/spinner';
import { Table, TableColumn, TableRow } from '../../../../shared/components/table/table';

@Component({
  selector: 'app-user-list',
  imports: [Alert, Badge, Breadcrumb, Button, Input, Pagination, Spinner, Table],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;

  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  search = signal('');
  currentPage = signal(1);
  count = signal(0);

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Panel', path: '/catalog' },
    { label: 'Administracja', path: '/admin' },
    { label: 'Czytelnicy' },
  ];

  columns: TableColumn[] = [
    { key: 'name', label: 'Czytelnik' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Rola' },
    { key: 'loans', label: 'Wypożyczenia', align: 'center', emptyValue: '0' },
    { key: 'reservations', label: 'Rezerwacje', align: 'center', emptyValue: '0' },
    { key: 'fineTotal', label: 'Kary (PLN)', align: 'right', emptyValue: '0.00' },
  ];

  tableRows = computed<TableRow[]>(() => {
    return this.users().map((user) => ({
      id: user.id,
      name: user.full_name ?? `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      role: this.getRoleLabel(user.role),
      loans: user.loan_count ?? 0,
      reservations: user.reservation_count ?? 0,
      fineTotal: Number(user.fine_total ?? 0).toFixed(2),
    }));
  });

  visibleReaders = computed(() => this.users().filter((user) => user.role === 'reader').length);
  visibleStaff = computed(() => this.users().filter((user) => user.is_staff).length);
  totalItems = computed(() => this.count());

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadReaders();
  }

  loadReaders(page = this.currentPage()): void {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = { page: String(page) };
    const query = this.search().trim();
    if (query) {
      params['q'] = query;
    }

    this.api.getReaders(params).subscribe({
      next: (response) => {
        this.users.set(response.results);
        this.count.set(response.count);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać listy użytkowników.');
        this.loading.set(false);
      },
    });
  }

  setSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
    this.loadReaders(1);
  }

  setPage(page: number): void {
    this.currentPage.set(page);
    this.loadReaders(page);
  }

  private getRoleLabel(role: User['role']): string {
    const labels: Record<User['role'], string> = {
      admin: 'Administrator',
      librarian: 'Bibliotekarz',
      reader: 'Czytelnik',
    };

    return labels[role];
  }
}
