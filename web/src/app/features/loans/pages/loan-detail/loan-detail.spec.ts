import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Loan } from '../../../../core/models/loan';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoanDetail } from './loan-detail';

describe('LoanDetail', () => {
  let component: LoanDetail;
  let fixture: ComponentFixture<LoanDetail>;
  let api: jasmine.SpyObj<ApiService>;
  let auth: { isStaff: jasmine.Spy };

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
    auth = { isStaff: jasmine.createSpy().and.returnValue(true) };

    await TestBed.configureTestingModule({
      imports: [LoanDetail],
      providers: [
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
      'Termin zwrotu został przedłużony o 7 dni.',
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

  it('shows a read-only notice for readers', () => {
    auth.isStaff.and.returnValue(false);
    createComponent();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tryb tylko do odczytu');
  });
});
