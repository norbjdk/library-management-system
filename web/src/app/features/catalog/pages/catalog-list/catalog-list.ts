import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Book } from '../../../../core/models/book';

@Component({
  selector: 'app-catalog-list',
  imports: [FormsModule],
  templateUrl: './catalog-list.html',
  styleUrl: './catalog-list.css'
})
export class CatalogList {
  searchQuery = '';

  books: Book[] = [
    {
      id: 1,
      title: 'Wiedźmin: Ostatnie życzenie',
      author: 'Andrzej Sapkowski',
      isbn: '978-83-7785-149-2',
      category: 'Fantasy',
      location: 'A1/2/3',
      availableCopies: 2,
      totalCopies: 3,
      status: 'available'
    },
    {
      id: 2,
      title: 'Pan Tadeusz',
      author: 'Adam Mickiewicz',
      isbn: '978-83-0000-000-1',
      category: 'Poezja',
      location: 'B2/1/1',
      availableCopies: 0,
      totalCopies: 2,
      status: 'borrowed'
    },
    {
      id: 3,
      title: 'Solaris',
      author: 'Stanisław Lem',
      isbn: '978-83-0000-000-2',
      category: 'Sci-Fi',
      location: 'A3/1/2',
      availableCopies: 1,
      totalCopies: 1,
      status: 'available'
    },
    {
      id: 4,
      title: 'Harry Potter i Kamień Filozoficzny',
      author: 'J.K. Rowling',
      isbn: '978-83-0000-000-3',
      category: 'Fantasy',
      location: 'C1/3/1',
      availableCopies: 0,
      totalCopies: 4,
      status: 'reserved'
    },
    {
      id: 5,
      title: 'Zbrodnia i kara',
      author: 'Fiodor Dostojewski',
      isbn: '978-83-0000-000-4',
      category: 'Klasyka',
      location: 'B1/2/4',
      availableCopies: 3,
      totalCopies: 3,
      status: 'available'
    },
    {
      id: 6,
      title: 'Diuna',
      author: 'Frank Herbert',
      isbn: '978-83-0000-000-5',
      category: 'Sci-Fi',
      location: 'A3/2/1',
      availableCopies: 0,
      totalCopies: 2,
      status: 'borrowed'
    },
  ];

  get filteredBooks(): Book[] {
    if (!this.searchQuery) return this.books;
    const q = this.searchQuery.toLowerCase();
    return this.books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }

  getStatusLabel(status: Book['status']): string {
    const labels = {
      available: 'Dostępna',
      borrowed: 'Wypożyczona',
      reserved: 'Zarezerwowana',
      unavailable: 'Niedostępna'
    };
    return labels[status];
  }

  getStatusClasses(status: Book['status']): string {
    const classes = {
      available: 'bg-green-100 text-green-700',
      borrowed: 'bg-red-100 text-red-700',
      reserved: 'bg-yellow-100 text-yellow-700',
      unavailable: 'bg-slate-100 text-slate-500'
    };
    return classes[status];
  }
}
