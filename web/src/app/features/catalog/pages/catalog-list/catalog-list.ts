import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Book } from '../../../../core/models/book';

@Component({
  selector: 'app-catalog-list',
  imports: [FormsModule],
  templateUrl: './catalog-list.html',
})
export class CatalogList {
  searchQuery = '';

  books: Book[] = [
    {
      id: 1,
      title: 'Wiedźmin: Ostatnie życzenie',
      ean: '978-83-7785-149-2',
      description: '',
      publish_year: 1993,
      publisher: { id: 1, name: 'SuperNowa' },
      authors: [{ id: 1, first_name: 'Andrzej', last_name: 'Sapkowski' }],
      categories: [{ id: 1, name: 'Fantasy' }],
      copies: [
        { id: 1, condition: 'good', available: true, location: { id: 1, floor: 1, section: 'A', shelf: 'A1/2/3' } },
        { id: 2, condition: 'good', available: true, location: { id: 1, floor: 1, section: 'A', shelf: 'A1/2/3' } },
      ]
    },
    {
      id: 2,
      title: 'Pan Tadeusz',
      ean: '978-83-0000-000-1',
      description: '',
      publish_year: 1834,
      publisher: { id: 2, name: 'Ossolineum' },
      authors: [{ id: 2, first_name: 'Adam', last_name: 'Mickiewicz' }],
      categories: [{ id: 2, name: 'Poezja' }],
      copies: []
    },
    {
      id: 3,
      title: 'Solaris',
      ean: '978-83-0000-000-2',
      description: '',
      publish_year: 1961,
      publisher: { id: 3, name: 'Wydawnictwo Literackie' },
      authors: [{ id: 3, first_name: 'Stanisław', last_name: 'Lem' }],
      categories: [{ id: 3, name: 'Sci-Fi' }],
      copies: [
        { id: 3, condition: 'good', available: true, location: { id: 2, floor: 1, section: 'A', shelf: 'A3/1/2' } },
      ]
    },
    {
      id: 4,
      title: 'Harry Potter i Kamień Filozoficzny',
      ean: '978-83-0000-000-3',
      description: '',
      publish_year: 1997,
      publisher: { id: 4, name: 'Media Rodzina' },
      authors: [{ id: 4, first_name: 'J.K.', last_name: 'Rowling' }],
      categories: [{ id: 1, name: 'Fantasy' }],
      copies: []
    },
    {
      id: 5,
      title: 'Zbrodnia i kara',
      ean: '978-83-0000-000-4',
      description: '',
      publish_year: 1866,
      publisher: { id: 5, name: 'PIW' },
      authors: [{ id: 5, first_name: 'Fiodor', last_name: 'Dostojewski' }],
      categories: [{ id: 6, name: 'Klasyka' }],
      copies: [
        { id: 4, condition: 'good', available: true, location: { id: 3, floor: 2, section: 'B', shelf: 'B1/2/4' } },
        { id: 5, condition: 'good', available: true, location: { id: 3, floor: 2, section: 'B', shelf: 'B1/2/4' } },
        { id: 6, condition: 'good', available: true, location: { id: 3, floor: 2, section: 'B', shelf: 'B1/2/4' } },
      ]
    },
    {
      id: 6,
      title: 'Diuna',
      ean: '978-83-0000-000-5',
      description: '',
      publish_year: 1965,
      publisher: { id: 6, name: 'Rebis' },
      authors: [{ id: 6, first_name: 'Frank', last_name: 'Herbert' }],
      categories: [{ id: 3, name: 'Sci-Fi' }],
      copies: []
    },
  ];

  get filteredBooks(): Book[] {
    if (!this.searchQuery) return this.books;
    const q = this.searchQuery.toLowerCase();
    return this.books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.authors.some(a => `${a.first_name} ${a.last_name}`.toLowerCase().includes(q)) ||
      b.categories.some(c => c.name.toLowerCase().includes(q))
    );
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
