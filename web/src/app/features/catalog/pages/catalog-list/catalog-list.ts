import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Book } from '../../../../core/models/book';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-catalog-list',
  imports: [FormsModule],
  templateUrl: './catalog-list.html',
})
export class CatalogList implements OnInit {
  searchQuery = '';
  books = signal<Book[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  count = signal(0);

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = {};
    if (this.searchQuery) params['q'] = this.searchQuery;

    this.api.getBooks(params).subscribe({
      next: (response) => {
        this.books.set(response.results);
        this.count.set(response.count);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się załadować książek.');
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.loadBooks();
  }

  getAvailableCopies(book: Book): number {
    return book.copies.filter(c => c.available).length;
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
