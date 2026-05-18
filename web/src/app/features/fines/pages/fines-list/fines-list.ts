import { Component, OnInit, signal } from '@angular/core';
import { Fine } from '../../../../core/models/fine';
import { DEFAULT_PAGE_SIZE } from '../../../../core/models/pagination';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Modal } from '../../../../shared/components/modal/modal';
import { Pagination } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-fines-list',
  imports: [Modal, Pagination],
  templateUrl: './fines-list.html',
  styleUrl: './fines-list.css',
})
export class FinesList implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;

  activeFilter: 'all' | 'paid' | 'unpaid' = 'all';
  fines = signal<Fine[]>([]);
  loading = signal(false);
  actionModalOpen = signal(false);
  error = signal<string | null>(null);
  count = signal(0);
  currentPage = signal(1);
  pendingFineId = signal<number | null>(null);

  filters: { label: string; value: 'all' | 'paid' | 'unpaid' }[] = [
    { label: 'Wszystkie', value: 'all' },
    { label: 'Nieopłacone', value: 'unpaid' },
    { label: 'Opłacone', value: 'paid' },
  ];

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadFines();
  }

  loadFines(page = this.currentPage()) {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = { page: String(page) };
    if (this.activeFilter === 'paid') params['paid'] = 'true';
    if (this.activeFilter === 'unpaid') params['paid'] = 'false';

    this.api.getFines(params).subscribe({
      next: (response) => {
        this.fines.set(response.results);
        this.count.set(response.count);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się załadować kar.');
        this.loading.set(false);
      },
    });
  }

  setFilter(filter: 'all' | 'paid' | 'unpaid') {
    this.activeFilter = filter;
    this.currentPage.set(1);
    this.loadFines(1);
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadFines(page);
  }

  settleFine(id: number) {
    this.api.settleFine(id).subscribe({
      next: () => this.loadFines(),
      error: () => this.error.set('Nie udało się rozliczyć kary.'),
    });
  }

  requestSettleFine(id: number) {
    this.pendingFineId.set(id);
    this.actionModalOpen.set(true);
  }

  closeActionModal() {
    this.actionModalOpen.set(false);
    this.pendingFineId.set(null);
  }

  confirmSettleFine() {
    const id = this.pendingFineId();
    if (id === null) {
      return;
    }

    this.closeActionModal();
    this.settleFine(id);
  }

  isStaff(): boolean {
    return this.auth.isStaff();
  }
}
