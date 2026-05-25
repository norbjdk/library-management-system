import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
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
  submittingReservation = signal(false);
  reserveModalOpen = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  private reservationModalRequested = false;
  private autoReserveRequested = false;

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

    this.reservationModalRequested = this.route.snapshot.queryParamMap.get('reserve') === '1';
    this.autoReserveRequested = this.route.snapshot.queryParamMap.get('autoReserve') === '1';

    this.loadBook(bookId);
  }

  private getDefaultExpiryDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }

  private loadBook(bookId: number, options: { preserveMessages?: boolean } = {}) {
    this.loading.set(true);
    this.error.set(null);
    if (!options.preserveMessages) {
      this.success.set(null);
    }

    const reservationsRequest =
      !this.isLoggedIn() || this.isStaff()
        ? of({ count: 0, next: null, previous: null, results: [] })
        : this.api.getReservations({ book: String(bookId) });

    forkJoin({
      book: this.api.getBook(bookId),
      availability: this.api.getBookAvailability(bookId),
      copies: this.api.getCopies({ book: String(bookId) }),
      reservations: reservationsRequest,
    }).subscribe({
      next: ({ book, availability, copies, reservations }) => {
        this.book.set(book);
        this.availability.set(availability);
        this.copies.set(copies.results);
        this.hasExistingReservation.set(reservations.results.length > 0);
        if (this.autoReserveRequested && this.isLoggedIn() && !this.isStaff()) {
          this.autoReserveRequested = false;
          this.reserveBook();
        }
        if (this.reservationModalRequested && this.isLoggedIn() && !this.isStaff()) {
          this.reserveModalOpen.set(true);
          this.reservationModalRequested = false;
        }
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
    if (!this.isLoggedIn()) {
      this.error.set('Zaloguj się lub załóż konto, aby zarezerwować książkę.');
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
    this.reservationModalRequested = false;

    const hasAvailableCopies = this.hasAvailableCopies();

    this.api
      .createReservation({
        book: currentBook.id,
        user: this.auth.user()?.id,
        expiry_date: reservationExpiry,
      })
      .subscribe({
        next: () => {
          this.success.set(this.getReservationSuccessMessage(hasAvailableCopies));
          this.submittingReservation.set(false);
          this.loadBook(currentBook.id, { preserveMessages: true });
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

  requestReservationConfirmation() {
    this.error.set(null);
    this.reserveModalOpen.set(true);
  }

  closeReservationModal() {
    this.reserveModalOpen.set(false);
  }

  confirmReservation() {
    this.closeReservationModal();
    this.reserveBook();
  }

  hasAvailableCopies(): boolean {
    return this.getEffectiveAvailableCopies() > 0;
  }

  isStaff(): boolean {
    return this.auth.isStaff();
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  getLoginQueryParams(mode?: 'register'): { redirectTo: string; mode?: 'register' } {
    return {
      redirectTo: `/catalog/${this.book()?.id ?? ''}`,
      ...(mode ? { mode } : {}),
    };
  }

  getReservationButtonLabel(): string {
    return this.hasAvailableCopies() ? 'Zarezerwuj' : 'Kolejka';
  }

  getReservationModalTitle(): string {
    return this.hasAvailableCopies() ? 'Potwierdź rezerwację' : 'Dołącz do kolejki rezerwacji';
  }

  getReservationModalDescription(): string {
    return this.hasAvailableCopies()
      ? 'Po potwierdzeniu zapiszesz książkę do odbioru. Bibliotekarz wyda ją na 7 dni.'
      : 'Po potwierdzeniu dołączysz do kolejki. Gdy nadejdzie Twoja kolej, książka będzie gotowa do odbioru w bibliotece.';
  }

  getReservationSubmittingLabel(): string {
    return this.hasAvailableCopies() ? 'Zapisywanie rezerwacji...' : 'Dołączanie do kolejki...';
  }

  private getReservationSuccessMessage(hasAvailableCopies: boolean): string {
    return hasAvailableCopies
      ? 'Rezerwacja została zapisana. Książkę będzie można odebrać w bibliotece po wydaniu przez bibliotekarza.'
      : 'Dołączyłeś do kolejki rezerwacji. Gdy nadejdzie Twoja kolej, książka będzie gotowa do odbioru w bibliotece.';
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
    if (!copy.available) {
      return 'W obiegu';
    }

    if (copy.condition === 'damaged') {
      return 'Niedostępny';
    }

    if (this.isCopyReservedForQueue(copy)) {
      return 'Zajęty';
    }

    return 'Dostępny';
  }

  getCopyStatusClasses(copy: Copy): string {
    if (!copy.available) {
      return 'bg-slate-200 text-slate-700';
    }

    if (copy.condition === 'damaged') {
      return 'bg-rose-100 text-rose-700';
    }

    if (this.isCopyReservedForQueue(copy)) {
      return 'bg-amber-100 text-amber-700';
    }

    return 'bg-emerald-100 text-emerald-700';
  }

  getEffectiveAvailableCopies(): number {
    const availability = this.availability();
    if (availability) {
      return Math.max(availability.available_copies - availability.active_reservations, 0);
    }

    const currentBook = this.book();
    return Math.max(
      (currentBook?.available_copies ?? 0) - (currentBook?.active_reservations ?? 0),
      0,
    );
  }

  private isCopyReservedForQueue(copy: Copy): boolean {
    const loanableAvailableCopies = this.copies()
      .filter((item) => item.available && item.condition !== 'damaged')
      .sort((left, right) => left.id - right.id);
    const activeReservations =
      this.availability()?.active_reservations ?? this.book()?.active_reservations ?? 0;
    const reservedCount = Math.min(activeReservations, loanableAvailableCopies.length);

    return loanableAvailableCopies.slice(0, reservedCount).some((item) => item.id === copy.id);
  }
}
