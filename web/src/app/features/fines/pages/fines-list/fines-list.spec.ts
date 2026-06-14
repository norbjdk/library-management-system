import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinesList } from './fines-list';
import { commonTestProviders } from '../../../../testing/test-providers';

describe('FinesList', () => {
  let component: FinesList;
  let fixture: ComponentFixture<FinesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [...commonTestProviders],
      imports: [FinesList],
    }).compileComponents();

    fixture = TestBed.createComponent(FinesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
