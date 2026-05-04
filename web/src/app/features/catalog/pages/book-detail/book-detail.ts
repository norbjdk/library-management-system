import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Book, BookAvailability, Copy } from '../../../../core/models/book';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-book-detail',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.css',
})
export class BookDetail implements OnInit {
  book = signal<Book | null>(null);
  availability = signal<BookAvailability | null>(null);
  copies = signal<Copy[]>([]);
  loading = signal(false);
  submittingReservation = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  reservationExpiry = this.getDefaultExpiryDate();

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    const bookId = Number(this.route.snapshot.paramMap.get('id'));
    if (!bookId) {
      this.error.set('Nieprawidłowy identyfikator książki.');
      return;
    }

    this.loadBook(bookId);
  }

  private getDefaultExpiryDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }

  private loadBook(bookId: number) {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    forkJoin({
      book: this.api.getBook(bookId),
      availability: this.api.getBookAvailability(bookId),
      copies: this.api.getCopies({ book: String(bookId) }),
    }).subscribe({
      next: ({ book, availability, copies }) => {
        this.book.set(book);
        this.availability.set(availability);
        this.copies.set(copies.results);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się załadować szczegółów książki.');
        this.loading.set(false);
      },
    });
  }

  reserveBook() {
    const currentBook = this.book();
    if (!currentBook) {
      return;
    }

    if (!this.reservationExpiry) {
      this.error.set('Wybierz datę ważności rezerwacji.');
      return;
    }

    this.submittingReservation.set(true);
    this.error.set(null);

    this.api
      .createReservation({
        book: currentBook.id,
        expiry_date: this.reservationExpiry,
      })
      .subscribe({
        next: () => {
          this.success.set('Rezerwacja została zapisana w kolejce.');
          this.submittingReservation.set(false);
          this.loadBook(currentBook.id);
        },
        error: (err) => {
          this.error.set(
            err?.error?.detail ??
              err?.error?.non_field_errors?.[0] ??
              'Nie udało się utworzyć rezerwacji.',
          );
          this.submittingReservation.set(false);
        },
      });
  }

  isStaff(): boolean {
    return this.auth.isStaff();
  }

  getAuthorList(book: Book): string {
    return book.authors.length
      ? book.authors.map((author) => `${author.first_name} ${author.last_name}`).join(', ')
      : 'Autor nieznany';
  }

  getCategoryList(book: Book): string {
    return book.categories.length
      ? book.categories.map((category) => category.name).join(', ')
      : 'Brak kategorii';
  }

  getConditionLabel(condition: string): string {
    const labels: Record<string, string> = {
      new: 'Nowy',
      good: 'Dobry',
      worn: 'Zużyty',
      damaged: 'Uszkodzony',
    };

    return labels[condition] ?? condition;
  }

  getLocationLabel(copy: Copy): string {
    if (copy.location_label) {
      return copy.location_label;
    }

    if (!copy.location || typeof copy.location === 'number') {
      return 'Brak lokalizacji';
    }

    return [copy.location.section, copy.location.shelf].filter(Boolean).join(' / ');
  }

  getCopyStatus(copy: Copy): string {
    return copy.available ? 'Dostępny' : 'W obiegu';
  }

  getCopyStatusClasses(copy: Copy): string {
    return copy.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700';
  }
}
