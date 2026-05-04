import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  page = input(1);
  pageSize = input(10);
  totalItems = input(0);
  maxVisiblePages = input(5);
  pageChange = output<number>();

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const visible = Math.min(this.maxVisiblePages(), total);
    const half = Math.floor(visible / 2);
    let start = Math.max(current - half, 1);
    const end = Math.min(start + visible - 1, total);

    start = Math.max(end - visible + 1, 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) {
      return;
    }

    this.pageChange.emit(page);
  }
}
