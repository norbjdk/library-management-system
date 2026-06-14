import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fines } from './fines';
import { commonTestProviders } from '../../testing/test-providers';

describe('Fines', () => {
  let component: Fines;
  let fixture: ComponentFixture<Fines>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [...commonTestProviders],
      imports: [Fines],
    }).compileComponents();

    fixture = TestBed.createComponent(Fines);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
