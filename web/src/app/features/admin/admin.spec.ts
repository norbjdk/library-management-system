import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Admin } from './admin';
import { commonTestProviders } from '../../testing/test-providers';

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [...commonTestProviders],
      imports: [Admin],
    }).compileComponents();

    fixture = TestBed.createComponent(Admin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
