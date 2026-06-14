import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookManagement } from './book-management';
import { commonTestProviders } from '../../../../testing/test-providers';

describe('BookManagement', () => {
  let component: BookManagement;
  let fixture: ComponentFixture<BookManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [...commonTestProviders],
      imports: [BookManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(BookManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
