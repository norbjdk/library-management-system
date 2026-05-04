import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { CatalogList } from './catalog-list';

describe('CatalogList', () => {
  let component: CatalogList;
  let fixture: ComponentFixture<CatalogList>;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['getBooks']);

    await TestBed.configureTestingModule({
      imports: [CatalogList],
      providers: [{ provide: ApiService, useValue: api }],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(CatalogList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('trims the search query before sending it to the API', () => {
    api.getBooks.and.returnValue(of({ count: 0, next: null, previous: null, results: [] }));

    createComponent();
    component.searchQuery = '  Solaris   Lem ';
    component.onSearch();

    expect(api.getBooks.calls.mostRecent().args[0]).toEqual({ q: 'Solaris Lem' });
  });

  it('omits blank search text after sanitization', () => {
    api.getBooks.and.returnValue(of({ count: 0, next: null, previous: null, results: [] }));

    createComponent();
    component.searchQuery = '    ';
    component.onSearch();

    expect(api.getBooks.calls.mostRecent().args[0]).toEqual({});
  });

  it('shows an error message when loading the catalog fails', () => {
    api.getBooks.and.returnValue(throwError(() => new Error('load failed')));

    createComponent();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nie udało się załadować książek.');
  });
});
