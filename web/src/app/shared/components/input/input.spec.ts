import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Input } from './input';
import { commonTestProviders } from '../../../testing/test-providers';

describe('Input', () => {
  let component: Input;
  let fixture: ComponentFixture<Input>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [...commonTestProviders],
      imports: [Input],
    }).compileComponents();

    fixture = TestBed.createComponent(Input);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
