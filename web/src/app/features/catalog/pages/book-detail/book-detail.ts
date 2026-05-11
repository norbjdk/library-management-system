import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Book, BookAvailability, Copy } from '../../../../core/models/book';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Modal } from '../../../../shared/components/modal/modal';
import {
  getTodayIsoDate,
  hasText,
  isValidIsoDate,
  normalizeDateInput,
} from '../../../../shared/utils/form-normalization';

@Component({
  selector: 'app-book-detail',
  imports: [FormsModule, RouterLink, DatePipe, Modal],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.css',
})
export class BookDetail implements OnInit {
  book = signal<Book | null>(null);
  availability = signal<BookAvailability | null>(null);
  copies = signal<Copy[]>([]);
  hasExistingReservation = signal(false);
  loading = signal(false);
  borrowing = signal(false);
  submittingReservation = signal(false);
  borrowModalOpen = signal(false);
  reserveModalOpen = signal(false);
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
      reservations: this.api.getReservations({ book: String(bookId) }),
    }).subscribe({
      next: ({ book, availability, copies, reservations }) => {
        this.book.set(book);
        this.availability.set(availability);
        this.copies.set(copies.results);
        this.hasExistingReservation.set(reservations.results.length > 0);
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

    const reservationExpiry = normalizeDateInput(this.reservationExpiry);
    this.reservationExpiry = reservationExpiry;

    if (!hasText(reservationExpiry)) {
      this.error.set('Wybierz datę ważności rezerwacji.');
      return;
    }

    if (!isValidIsoDate(reservationExpiry)) {
      this.error.set('Wybierz poprawną datę ważności rezerwacji.');
      return;
    }

    if (reservationExpiry < getTodayIsoDate()) {
      this.error.set('Data ważności rezerwacji nie może być z przeszłości.');
      return;
    }

    if (this.hasExistingReservation()) {
      this.error.set('Masz już rezerwację tej książki. Sprawdź jej status w kolejce.');
      return;
    }

    this.submittingReservation.set(true);
    this.error.set(null);

    this.api
      .createReservation({
        book: currentBook.id,
        user: this.auth.user()?.id,
        expiry_date: reservationExpiry,
      })
      .subscribe({
        next: () => {
          this.success.set('Rezerwacja została zapisana w kolejce.');
          this.submittingReservation.set(false);
          this.loadBook(currentBook.id);
        },
        error: (err) => {
          const duplicateReservationMessage =
            err?.error?.non_field_errors?.[0]?.includes('unique set') ||
            err?.error?.non_field_errors?.[0]?.includes('Masz już rezerwację')
              ? 'Masz już rezerwację tej książki. Sprawdź jej status w kolejce.'
              : null;
          this.error.set(
            err?.error?.detail ??
              err?.error?.expiry_date?.[0] ??
              duplicateReservationMessage ??
              err?.error?.non_field_errors?.[0] ??
              'Nie udało się utworzyć rezerwacji.',
          );
          this.submittingReservation.set(false);
        },
      });
  }

  requestBorrowConfirmation() {
    this.borrowModalOpen.set(true);
  }

  closeBorrowModal() {
    this.borrowModalOpen.set(false);
  }

  confirmBorrow() {
    this.closeBorrowModal();
    this.borrowBook();
  }

  requestReservationConfirmation() {
    this.reserveModalOpen.set(true);
  }

  closeReservationModal() {
    this.reserveModalOpen.set(false);
  }

  confirmReservation() {
    this.closeReservationModal();
    this.reserveBook();
  }

  borrowBook() {
    const currentBook = this.book();
    if (!currentBook) {
      return;
    }

    this.borrowing.set(true);
    this.error.set(null);
    this.success.set(null);

    this.api.borrowBook(currentBook.id).subscribe({
      next: () => {
        this.success.set('Książka została wypożyczona i przypisana do Twojego konta.');
        this.borrowing.set(false);
        this.loadBook(currentBook.id);
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail ?? err?.error?.book?.[0] ?? 'Nie udało się wypożyczyć książki.',
        );
        this.borrowing.set(false);
      },
    });
  }

  hasAvailableCopies(): boolean {
    const availability = this.availability();
    if (availability) {
      return availability.available_copies > 0;
    }

    const currentBook = this.book();
    return (currentBook?.available_copies ?? 0) > 0;
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
