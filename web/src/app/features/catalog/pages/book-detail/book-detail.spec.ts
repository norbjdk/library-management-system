import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BookDetail } from './book-detail';

describe('BookDetail', () => {
  let component: BookDetail;
  let fixture: ComponentFixture<BookDetail>;
  let api: jasmine.SpyObj<ApiService>;
  let routeSnapshot: {
    paramMap: ReturnType<typeof convertToParamMap>;
    queryParamMap: ReturnType<typeof convertToParamMap>;
  };

  beforeEach(async () => {
    routeSnapshot = {
      paramMap: convertToParamMap({ id: '1' }),
      queryParamMap: convertToParamMap({}),
    };

    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'getBook',
      'getBookAvailability',
      'getCopies',
      'createReservation',
    ]);

    await TestBed.configureTestingModule({
      imports: [BookDetail],
      providers: [
        { provide: ApiService, useValue: api },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            isStaff: () => false,
            user: () => ({
              id: 2,
              first_name: 'Anna',
              last_name: 'Czytelnik',
              role: 'reader',
              is_staff: false,
            }),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: routeSnapshot,
          },
        },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    api.getBook.and.returnValue(
      of({
        id: 1,
        title: 'Solaris',
        ean: '9788308061492',
        description: 'Opis',
        publish_year: 1961,
        publisher: 1,
        publisher_name: 'WL',
        authors: [{ id: 1, first_name: 'Stanisław', last_name: 'Lem' }],
        categories: [{ id: 1, name: 'Science fiction' }],
        copies_count: 1,
        available_copies: 1,
        active_loans: 0,
        active_reservations: 0,
        estimated_wait_days: 0,
      }),
    );
    api.getBookAvailability.and.returnValue(
      of({
        book_id: 1,
        title: 'Solaris',
        total_copies: 1,
        available_copies: 1,
        active_loans: 0,
        active_reservations: 0,
        estimated_wait_days: 0,
        estimated_ready_date: '2099-01-01',
      }),
    );
    api.getCopies.and.returnValue(
      of({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 11,
            book: 1,
            book_title: 'Solaris',
            condition: 'good',
            available: true,
            location: 1,
            location_label: 'A1 / Sci-Fi / floor 1',
          },
        ],
      }),
    );

    fixture = TestBed.createComponent(BookDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('validates reservation expiry dates that are already in the past', () => {
    createComponent();
    component.reservationExpiry = '2000-01-01';

    component.reserveBook();
    fixture.detectChanges();

    expect(api.createReservation).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Data ważności rezerwacji nie może być z przeszłości.',
    );
  });

  it('sanitizes the reservation date before sending it to the API', () => {
    createComponent();
    api.createReservation.and.returnValue(
      of({
        id: 101,
        user: 2,
        user_name: 'Anna Czytelnik',
        book: 1,
        book_title: 'Solaris',
        reservation_date: '2026-05-04',
        expiry_date: '2099-01-01',
        status: 'pending',
        queue_position: 1,
        estimated_ready_date: '2099-01-01',
      }),
    );
    component.reservationExpiry = ' 2099-01-01 ';

    component.reserveBook();
    fixture.detectChanges();

    expect(api.createReservation).toHaveBeenCalledWith({
      book: 1,
      user: 2,
      expiry_date: '2099-01-01',
    });
    expect(fixture.nativeElement.textContent).toContain(
      'Rezerwacja została zapisana. Książkę będzie można odebrać w bibliotece po wydaniu przez bibliotekarza.',
    );
  });

  it('opens the reservation modal when the catalog card requests it', () => {
    routeSnapshot.queryParamMap = convertToParamMap({ reserve: '1' });

    createComponent();

    expect(component.reserveModalOpen()).toBeTrue();
  });

  it('auto-reserves when the catalog confirmation sends the detail view there', () => {
    routeSnapshot.queryParamMap = convertToParamMap({ autoReserve: '1' });
    api.createReservation.and.returnValue(
      of({
        id: 101,
        user: 2,
        user_name: 'Anna Czytelnik',
        book: 1,
        book_title: 'Solaris',
        reservation_date: '2026-05-04',
        expiry_date: '2099-01-01',
        status: 'pending',
        queue_position: 1,
        estimated_ready_date: '2099-01-01',
      }),
    );

    createComponent();

    expect(api.createReservation).toHaveBeenCalled();
    const payload = api.createReservation.calls.mostRecent().args[0] as {
      book?: number;
      user?: number;
      expiry_date?: string;
    };
    expect(payload.book).toBe(1);
    expect(payload.user).toBe(2);
    expect(payload.expiry_date).toBe(component.reservationExpiry);
  });

  it('shows backend reservation errors in the view', () => {
    createComponent();
    api.createReservation.and.returnValue(
      throwError(() => ({ error: { non_field_errors: ['Rezerwacja już istnieje.'] } })),
    );
    component.reservationExpiry = '2099-01-01';

    component.reserveBook();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Rezerwacja już istnieje.');
  });

  it('shows an error when the live book details cannot be loaded', () => {
    api.getBook.and.returnValue(throwError(() => new Error('load failed')));
    api.getBookAvailability.and.returnValue(
      of({
        book_id: 1,
        title: 'Solaris',
        total_copies: 1,
        available_copies: 1,
        active_loans: 0,
        active_reservations: 0,
        estimated_wait_days: 0,
        estimated_ready_date: '2099-01-01',
      }),
    );
    api.getCopies.and.returnValue(of({ count: 0, next: null, previous: null, results: [] }));

    fixture = TestBed.createComponent(BookDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Nie udało się załadować szczegółów książki.',
    );
  });
});
