import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Loan } from '../../../../core/models/loan';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoanDetail } from './loan-detail';
import { commonTestProviders } from '../../../../testing/test-providers';

describe('LoanDetail', () => {
  let component: LoanDetail;
  let fixture: ComponentFixture<LoanDetail>;
  let api: jasmine.SpyObj<ApiService>;
  let auth: { isStaff: jasmine.Spy; user: jasmine.Spy };

  const activeLoan: Loan = {
    id: 200,
    user: 2,
    user_name: 'Anna Czytelnik',
    copy: 12,
    book_id: 1,
    book_title: 'Solaris',
    loan_date: '2026-05-01',
    due_date: '2026-05-10',
    return_date: null,
    status: 'active',
    days_until_due: 6,
    overdue_days: 0,
    is_overdue: false,
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['getLoan', 'returnLoan', 'extendLoan']);
    auth = {
      isStaff: jasmine.createSpy().and.returnValue(true),
      user: jasmine.createSpy().and.returnValue({ id: 1, is_staff: true, role: 'librarian' }),
    };

    await TestBed.configureTestingModule({
      imports: [LoanDetail],
      providers: [
        ...commonTestProviders,
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '200' }),
            },
          },
        },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    api.getLoan.and.returnValue(of(activeLoan));
    fixture = TestBed.createComponent(LoanDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('extends a loan by 7 days and renders a success message', () => {
    createComponent();
    api.extendLoan.and.returnValue(
      of({
        ...activeLoan,
        due_date: '2026-05-17',
        days_until_due: 13,
      }),
    );

    component.extendLoanByWeek();
    fixture.detectChanges();

    expect(api.extendLoan).toHaveBeenCalledWith(200, 7);
    expect(component.loan()?.due_date).toBe('2026-05-17');
    expect(fixture.nativeElement.textContent).toContain(
      'Termin zwrotu został przedłużony o kolejny tydzień.',
    );
  });

  it('renders backend errors when a loan extension fails', () => {
    createComponent();
    api.extendLoan.and.returnValue(
      throwError(() => ({ error: { detail: 'Nie można przedłużyć wypożyczenia.' } })),
    );

    component.extendLoanByWeek();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nie można przedłużyć wypożyczenia.');
  });

  it('shows the reader self-service notice for readers', () => {
    auth.isStaff.and.returnValue(false);
    auth.user.and.returnValue({ id: 2, is_staff: false, role: 'reader' });
    createComponent();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Czytelnik może sam przedłużyć termin o kolejny tydzień',
    );
  });
});
