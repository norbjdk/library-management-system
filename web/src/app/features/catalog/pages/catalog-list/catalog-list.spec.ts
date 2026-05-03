import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogList } from './catalog-list';

describe('CatalogList', () => {
  let component: CatalogList;
  let fixture: ComponentFixture<CatalogList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
