import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Queue } from './queue';
import { commonTestProviders } from '../../testing/test-providers';

describe('Queue', () => {
  let component: Queue;
  let fixture: ComponentFixture<Queue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [...commonTestProviders],
      imports: [Queue],
    }).compileComponents();

    fixture = TestBed.createComponent(Queue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
