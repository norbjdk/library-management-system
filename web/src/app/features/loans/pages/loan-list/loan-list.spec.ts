import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoanList } from './loan-list';
import { commonTestProviders } from '../../../../testing/test-providers';

describe('LoanList', () => {
  let component: LoanList;
  let fixture: ComponentFixture<LoanList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [...commonTestProviders],
      imports: [LoanList],
    }).compileComponents();

    fixture = TestBed.createComponent(LoanList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
