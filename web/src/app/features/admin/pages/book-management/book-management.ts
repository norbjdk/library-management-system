import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Author, Book, Category, Publisher } from '../../../../core/models/book';
import { DEFAULT_PAGE_SIZE } from '../../../../core/models/pagination';
import { ApiService } from '../../../../core/services/api.service';
import { Alert } from '../../../../shared/components/alert/alert';
import { Badge } from '../../../../shared/components/badge/badge';
import { Breadcrumb, BreadcrumbItem } from '../../../../shared/components/breadcrumb/breadcrumb';
import { Modal } from '../../../../shared/components/modal/modal';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { Spinner } from '../../../../shared/components/spinner/spinner';
import {
  hasText,
  isPositiveInteger,
  normalizeText,
} from '../../../../shared/utils/form-normalization';

type BookFormValue = {
  title: string;
  ean: string;
  publish_year: string;
  description: string;
  publisher: string;
  author_ids: number[];
  category_ids: number[];
};

@Component({
  selector: 'app-book-management',
  imports: [FormsModule, Alert, Badge, Breadcrumb, Modal, Pagination, Spinner],
  templateUrl: './book-management.html',
  styleUrl: './book-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookManagement implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;

  books = signal<Book[]>([]);
  authors = signal<Author[]>([]);
  publishers = signal<Publisher[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(false);
  metadataLoading = signal(false);
  error = signal<string | null>(null);
  metadataError = signal<string | null>(null);
  currentPage = signal(1);
  count = signal(0);
  saveModalOpen = signal(false);
  deleteModalOpen = signal(false);
  saving = signal(false);
  deleting = signal(false);
  saveError = signal<string | null>(null);
  deleteError = signal<string | null>(null);
  editingBook = signal<Book | null>(null);
  pendingDeleteBook = signal<Book | null>(null);
  searchQuery = '';
  bookForm: BookFormValue = this.createEmptyForm();

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Panel', path: '/catalog' },
    { label: 'Administracja', path: '/admin' },
    { label: 'Książki' },
  ];

  totalItems = computed(() => this.count());
  loadedMetadataCount = computed(
    () => this.authors().length + this.publishers().length + this.categories().length,
  );

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadBooks();
  }

  loadBooks(page = this.currentPage()): void {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = {
      page: String(page),
      page_size: String(this.pageSize),
    };
    const query = normalizeText(this.searchQuery);
    this.searchQuery = query;
    if (query) {
      params['q'] = query;
    }

    this.api.getBooks(params).subscribe({
      next: (response) => {
        this.books.set(response.results);
        this.count.set(response.count);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać listy książek.');
        this.loading.set(false);
      },
    });
  }

  loadReferenceData(): void {
    this.metadataLoading.set(true);
    this.metadataError.set(null);

    const params = { page: '1', page_size: '300' };

    forkJoin({
      authors: this.api.getAuthors(params),
      publishers: this.api.getPublishers(params),
      categories: this.api.getCategories(params),
    }).subscribe({
      next: ({ authors, publishers, categories }) => {
        this.authors.set(authors.results);
        this.publishers.set(publishers.results);
        this.categories.set(categories.results);
        this.metadataLoading.set(false);
      },
      error: () => {
        this.metadataError.set('Nie udało się pobrać słowników autorów, wydawców i kategorii.');
        this.metadataLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadBooks(1);
  }

  setPage(page: number): void {
    this.currentPage.set(page);
    this.loadBooks(page);
  }

  openCreateModal(): void {
    this.editingBook.set(null);
    this.bookForm = this.createEmptyForm();
    this.saveError.set(null);
    this.saveModalOpen.set(true);
  }

  openEditModal(book: Book): void {
    this.editingBook.set(book);
    this.bookForm = {
      title: book.title,
      ean: book.ean ?? '',
      publish_year: book.publish_year ? String(book.publish_year) : '',
      description: book.description ?? '',
      publisher: book.publisher ? String(book.publisher) : '',
      author_ids: book.authors.map((author) => author.id),
      category_ids: book.categories.map((category) => category.id),
    };
    this.saveError.set(null);
    this.saveModalOpen.set(true);
  }

  closeSaveModal(): void {
    if (this.saving()) {
      return;
    }

    this.saveModalOpen.set(false);
    this.editingBook.set(null);
    this.saveError.set(null);
  }

  submitBookForm(): void {
    const payload = this.buildBookPayload();
    if (!payload) {
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    const editedBook = this.editingBook();
    const request = editedBook
      ? this.api.updateBook(editedBook.id, payload)
      : this.api.createBook(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.saveModalOpen.set(false);
        this.editingBook.set(null);
        this.loadBooks(this.currentPage());
      },
      error: (error) => {
        this.saveError.set(this.extractErrorMessage(error, 'Nie udało się zapisać książki.'));
        this.saving.set(false);
      },
    });
  }

  requestDeleteBook(book: Book): void {
    this.pendingDeleteBook.set(book);
    this.deleteError.set(null);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    if (this.deleting()) {
      return;
    }

    this.pendingDeleteBook.set(null);
    this.deleteError.set(null);
    this.deleteModalOpen.set(false);
  }

  confirmDeleteBook(): void {
    const book = this.pendingDeleteBook();
    if (!book) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.api.deleteBook(book.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteModalOpen.set(false);
        this.pendingDeleteBook.set(null);
        const nextPage =
          this.books().length === 1 && this.currentPage() > 1
            ? this.currentPage() - 1
            : this.currentPage();
        this.loadBooks(nextPage);
      },
      error: (error) => {
        this.deleteError.set(this.extractErrorMessage(error, 'Nie udało się usunąć książki.'));
        this.deleting.set(false);
      },
    });
  }

  toggleAuthor(authorId: number, checked: boolean): void {
    this.bookForm.author_ids = this.toggleSelection(this.bookForm.author_ids, authorId, checked);
  }

  toggleCategory(categoryId: number, checked: boolean): void {
    this.bookForm.category_ids = this.toggleSelection(
      this.bookForm.category_ids,
      categoryId,
      checked,
    );
  }

  isAuthorSelected(authorId: number): boolean {
    return this.bookForm.author_ids.includes(authorId);
  }

  isCategorySelected(categoryId: number): boolean {
    return this.bookForm.category_ids.includes(categoryId);
  }

  getAuthorNames(book: Book): string {
    if (!book.authors.length) {
      return '—';
    }

    return book.authors.map((author) => `${author.first_name} ${author.last_name}`).join(', ');
  }

  getCategoryNames(book: Book): string {
    if (!book.categories.length) {
      return '—';
    }

    return book.categories.map((category) => category.name).join(', ');
  }

  getDeleteTargetName(): string {
    return this.pendingDeleteBook()?.title ?? 'wybraną książkę';
  }

  isEditing(): boolean {
    return this.editingBook() !== null;
  }

  private buildBookPayload(): Record<string, unknown> | null {
    const title = normalizeText(this.bookForm.title);
    const ean = normalizeText(this.bookForm.ean);
    const publishYear = this.bookForm.publish_year.trim();
    const description = normalizeText(this.bookForm.description);
    const publisher = this.bookForm.publisher.trim();

    this.bookForm.title = title;
    this.bookForm.ean = ean;
    this.bookForm.description = description;

    if (!hasText(title)) {
      this.saveError.set('Tytuł książki jest wymagany.');
      return null;
    }

    let publishYearValue: number | null = null;
    if (publishYear) {
      publishYearValue = Number(publishYear);
      if (!isPositiveInteger(publishYearValue)) {
        this.saveError.set('Rok wydania musi być dodatnią liczbą całkowitą.');
        return null;
      }
    }

    return {
      title,
      ean: hasText(ean) ? ean : null,
      publish_year: publishYearValue,
      description: hasText(description) ? description : null,
      publisher: publisher ? Number(publisher) : null,
      author_ids: [...this.bookForm.author_ids],
      category_ids: [...this.bookForm.category_ids],
    };
  }

  private createEmptyForm(): BookFormValue {
    return {
      title: '',
      ean: '',
      publish_year: '',
      description: '',
      publisher: '',
      author_ids: [],
      category_ids: [],
    };
  }

  private toggleSelection(values: number[], selectedId: number, checked: boolean): number[] {
    if (checked) {
      return values.includes(selectedId) ? values : [...values, selectedId];
    }

    return values.filter((value) => value !== selectedId);
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    const detail = this.extractDetail(error);
    return detail || fallback;
  }

  private extractDetail(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const apiError = (error as { error?: unknown }).error;
    if (typeof apiError === 'string') {
      return apiError;
    }

    if (!apiError || typeof apiError !== 'object') {
      return null;
    }

    const detail = (apiError as { detail?: unknown }).detail;
    if (typeof detail === 'string') {
      return detail;
    }

    for (const value of Object.values(apiError as Record<string, unknown>)) {
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0];
      }
    }

    return null;
  }
}
