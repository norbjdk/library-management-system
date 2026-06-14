import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Button } from './button';
import { commonTestProviders } from '../../../testing/test-providers';

describe('Button', () => {
  let component: Button;
  let fixture: ComponentFixture<Button>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [...commonTestProviders],
      imports: [Button],
    }).compileComponents();

    fixture = TestBed.createComponent(Button);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
