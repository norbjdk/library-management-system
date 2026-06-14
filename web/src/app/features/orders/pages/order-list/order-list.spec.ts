import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { OrderList } from './order-list';
import { commonTestProviders } from '../../../../testing/test-providers';

describe('OrderList', () => {
  let component: OrderList;
  let fixture: ComponentFixture<OrderList>;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'getOrders',
      'getBooks',
      'getPublishers',
      'createOrder',
      'submitOrder',
      'receiveOrder',
      'cancelOrder',
    ]);

    await TestBed.configureTestingModule({
      imports: [OrderList],
      providers: [...commonTestProviders, { provide: ApiService, useValue: api }],
    }).compileComponents();
  });

  function createComponent(): void {
    api.getOrders.and.returnValue(of({ count: 0, next: null, previous: null, results: [] }));
    api.getBooks.and.returnValue(
      of({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            title: 'Solaris',
            ean: '9788308061492',
            description: 'Opis',
            publish_year: 1961,
            publisher: 1,
            publisher_name: 'WL',
            authors: [],
            categories: [],
            copies_count: 1,
            available_copies: 1,
            active_loans: 0,
            active_reservations: 0,
            estimated_wait_days: 0,
          },
        ],
      }),
    );
    api.getPublishers.and.returnValue(
      of({
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 1, name: 'WL', city: 'Warszawa', country: 'Polska' }],
      }),
    );

    fixture = TestBed.createComponent(OrderList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('validates that a book title is provided before creating an order', () => {
    createComponent();
    component.orderForm = {
      bookTitle: '',
      bookEan: '',
      bookAuthors: '',
      bookPublisher: '',
      bookPublishYear: '',
      bookDescription: '',
      quantity: 1,
      supplier: '',
      expected_delivery_date: '',
      notes: '',
    };

    component.createOrder();
    fixture.detectChanges();

    expect(api.createOrder).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Podaj nazwę książki do zamówienia.');
  });

  it('validates a positive integer quantity before submitting', () => {
    createComponent();
    component.orderForm = {
      bookTitle: 'Solaris',
      bookEan: '',
      bookAuthors: '',
      bookPublisher: '',
      bookPublishYear: '',
      bookDescription: '',
      quantity: 0,
      supplier: 'WL',
      expected_delivery_date: '',
      notes: '',
    };

    component.createOrder();
    fixture.detectChanges();

    expect(api.createOrder).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Ilość zamówienia musi być dodatnią liczbą całkowitą.',
    );
  });

  it('sanitizes order payload before calling the API', () => {
    createComponent();
    api.createOrder.and.returnValue(
      of({
        id: 10,
        book: 1,
        book_title: 'Solaris',
        book_ean: '9788308061492',
        book_publish_year: 1961,
        book_publisher_name: 'WL',
        book_author_names: 'Stanisław Lem',
        requested_by: 1,
        requested_by_name: 'Marta Bibliotekarz',
        quantity: 3,
        supplier: 'WL',
        status: 'draft',
        notes: 'pilne',
        requested_at: '2026-05-04T10:15:00Z',
        expected_delivery_date: '2026-05-12',
        age_days: 0,
      }),
    );
    component.orderForm = {
      bookTitle: '  Solaris  ',
      bookEan: ' 9788308061492 ',
      bookAuthors: '  Stanisław Lem ',
      bookPublisher: '  WL ',
      bookPublishYear: ' 1961 ',
      bookDescription: '  Opis  ',
      quantity: 3,
      supplier: '  WL  ',
      expected_delivery_date: ' 2026-05-12 ',
      notes: '  pilne  ',
    };

    component.createOrder();

    expect(api.createOrder).toHaveBeenCalledWith({
      quantity: 3,
      supplier: 'WL',
      expected_delivery_date: '2026-05-12',
      notes: 'pilne',
      requested_book_title: 'Solaris',
      requested_book_ean: '9788308061492',
      requested_book_authors: 'Stanisław Lem',
      requested_book_publisher: 'WL',
      requested_book_publish_year: 1961,
      requested_book_description: 'Opis',
    });
  });

  it('allows creating an order for a new title outside the catalog suggestions', () => {
    createComponent();
    api.createOrder.and.returnValue(
      of({
        id: 11,
        book: 2,
        book_title: 'Projekt Hail Mary',
        book_ean: '9788381883455',
        book_publish_year: 2021,
        book_publisher_name: 'Akurat',
        book_author_names: 'Andy Weir',
        requested_by: 1,
        requested_by_name: 'Marta Bibliotekarz',
        quantity: 2,
        supplier: 'Nowy Dostawca',
        status: 'draft',
        notes: 'priorytet',
        requested_at: '2026-05-04T10:15:00Z',
        expected_delivery_date: '2026-05-12',
        age_days: 0,
      }),
    );
    component.orderForm = {
      bookTitle: 'Projekt Hail Mary',
      bookEan: '9788381883455',
      bookAuthors: 'Andy Weir',
      bookPublisher: 'Akurat',
      bookPublishYear: '2021',
      bookDescription: 'Misja ratunkowa w kosmosie.',
      quantity: 2,
      supplier: 'Nowy Dostawca',
      expected_delivery_date: '2026-05-12',
      notes: 'priorytet',
    };

    component.createOrder();

    expect(api.createOrder).toHaveBeenCalledWith({
      quantity: 2,
      supplier: 'Nowy Dostawca',
      notes: 'priorytet',
      expected_delivery_date: '2026-05-12',
      requested_book_title: 'Projekt Hail Mary',
      requested_book_ean: '9788381883455',
      requested_book_authors: 'Andy Weir',
      requested_book_publisher: 'Akurat',
      requested_book_publish_year: 2021,
      requested_book_description: 'Misja ratunkowa w kosmosie.',
    });
  });

  it('renders backend error messages for invalid order payloads', () => {
    createComponent();
    api.createOrder.and.returnValue(
      throwError(() => ({ error: { quantity: ['Ilość jest nieprawidłowa.'] } })),
    );
    component.orderForm = {
      bookTitle: 'Solaris',
      bookEan: '',
      bookAuthors: '',
      bookPublisher: '',
      bookPublishYear: '',
      bookDescription: '',
      quantity: 2,
      supplier: '',
      expected_delivery_date: '',
      notes: '',
    };

    component.createOrder();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ilość jest nieprawidłowa.');
  });
});
