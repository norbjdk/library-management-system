import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Badge } from './badge';
import { commonTestProviders } from '../../../testing/test-providers';

describe('Badge', () => {
  let component: Badge;
  let fixture: ComponentFixture<Badge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [...commonTestProviders],
      imports: [Badge],
    }).compileComponents();

    fixture = TestBed.createComponent(Badge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
