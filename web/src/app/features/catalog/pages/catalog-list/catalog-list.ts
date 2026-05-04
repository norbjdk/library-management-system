import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Book } from '../../../../core/models/book';
import { ApiService } from '../../../../core/services/api.service';
import { normalizeText } from '../../../../shared/utils/form-normalization';

@Component({
  selector: 'app-catalog-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './catalog-list.html',
  styleUrl: './catalog-list.css',
})
export class CatalogList implements OnInit {
  searchQuery = '';
  books = signal<Book[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  count = signal(0);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = {};
    const searchQuery = normalizeText(this.searchQuery);
    this.searchQuery = searchQuery;
    if (searchQuery) params['q'] = searchQuery;

    this.api.getBooks(params).subscribe({
      next: (response) => {
        this.books.set(response.results);
        this.count.set(response.count);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się załadować książek.');
        this.loading.set(false);
      },
    });
  }

  onSearch() {
    this.loadBooks();
  }

  getPrimaryAuthor(book: Book): string {
    if (!book.authors.length) {
      return 'Autor nieznany';
    }

    return book.authors.map((author) => `${author.first_name} ${author.last_name}`).join(', ');
  }

  getPrimaryCategory(book: Book): string {
    return book.categories.length ? book.categories[0].name : '—';
  }

  getPublisherName(book: Book): string {
    return book.publisher_name ?? '—';
  }

  getWaitLabel(book: Book): string {
    return book.estimated_wait_days > 0 ? `${book.estimated_wait_days} dni` : 'Od ręki';
  }

  getAvailableCopies(book: Book): number {
    return book.available_copies;
  }

  getTotalCopies(book: Book): number {
    return book.copies_count;
  }

  getStatus(book: Book): 'available' | 'unavailable' {
    return this.getAvailableCopies(book) > 0 ? 'available' : 'unavailable';
  }

  getStatusLabel(book: Book): string {
    return this.getAvailableCopies(book) > 0 ? 'Dostępna' : 'Niedostępna';
  }

  getStatusClasses(book: Book): string {
    return this.getAvailableCopies(book) > 0
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  }
}
