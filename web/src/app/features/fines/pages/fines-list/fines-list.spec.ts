import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinesList } from './fines-list';

describe('FinesList', () => {
  let component: FinesList;
  let fixture: ComponentFixture<FinesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
