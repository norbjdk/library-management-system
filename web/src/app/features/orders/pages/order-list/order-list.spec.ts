import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { OrderList } from './order-list';

describe('OrderList', () => {
  let component: OrderList;
  let fixture: ComponentFixture<OrderList>;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'getOrders',
      'getBooks',
      'createOrder',
      'submitOrder',
      'receiveOrder',
      'cancelOrder',
    ]);

    await TestBed.configureTestingModule({
      imports: [OrderList],
      providers: [{ provide: ApiService, useValue: api }],
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

    fixture = TestBed.createComponent(OrderList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('validates that a book is selected before creating an order', () => {
    createComponent();
    component.orderForm = {
      bookId: '',
      quantity: 1,
      supplier: '',
      expected_delivery_date: '',
      notes: '',
    };

    component.createOrder();
    fixture.detectChanges();

    expect(api.createOrder).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Wybierz książkę do zamówienia.');
  });

  it('validates a positive integer quantity before submitting', () => {
    createComponent();
    component.orderForm = {
      bookId: '1',
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
      bookId: '1',
      quantity: 3,
      supplier: '  WL  ',
      expected_delivery_date: ' 2026-05-12 ',
      notes: '  pilne  ',
    };

    component.createOrder();

    expect(api.createOrder).toHaveBeenCalledWith({
      book: 1,
      quantity: 3,
      supplier: 'WL',
      expected_delivery_date: '2026-05-12',
      notes: 'pilne',
    });
  });

  it('renders backend error messages for invalid order payloads', () => {
    createComponent();
    api.createOrder.and.returnValue(
      throwError(() => ({ error: { quantity: ['Ilość jest nieprawidłowa.'] } })),
    );
    component.orderForm = {
      bookId: '1',
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
