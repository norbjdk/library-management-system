import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueueList } from './queue-list';
import { commonTestProviders } from '../../../../testing/test-providers';

describe('QueueList', () => {
  let component: QueueList;
  let fixture: ComponentFixture<QueueList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [...commonTestProviders],
      imports: [QueueList],
    }).compileComponents();

    fixture = TestBed.createComponent(QueueList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
