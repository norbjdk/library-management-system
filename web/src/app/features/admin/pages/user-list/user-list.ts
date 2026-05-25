import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFAULT_PAGE_SIZE } from '../../../../core/models/pagination';
import { User, UserRole } from '../../../../core/models/user';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Alert } from '../../../../shared/components/alert/alert';
import { Badge } from '../../../../shared/components/badge/badge';
import { Breadcrumb, BreadcrumbItem } from '../../../../shared/components/breadcrumb/breadcrumb';
import { Modal } from '../../../../shared/components/modal/modal';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { Spinner } from '../../../../shared/components/spinner/spinner';
import {
  hasText,
  isValidEmail,
  isValidIsoDate,
  normalizeDateInput,
  normalizeEmail,
  normalizeText,
} from '../../../../shared/utils/form-normalization';

type UserFormValue = {
  first_name: string;
  last_name: string;
  email: string;
  birthdate: string;
  role: UserRole;
  password: string;
};

@Component({
  selector: 'app-user-list',
  imports: [FormsModule, Alert, Badge, Breadcrumb, Modal, Pagination, Spinner],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList implements OnInit {
  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly roleOptions: { value: UserRole; label: string }[] = [
    { value: 'reader', label: 'Czytelnik' },
    { value: 'librarian', label: 'Bibliotekarz' },
    { value: 'admin', label: 'Administrator' },
  ];

  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  count = signal(0);
  saveModalOpen = signal(false);
  deleteModalOpen = signal(false);
  saving = signal(false);
  deleting = signal(false);
  saveError = signal<string | null>(null);
  deleteError = signal<string | null>(null);
  editingUser = signal<User | null>(null);
  pendingDeleteUser = signal<User | null>(null);
  searchQuery = '';
  roleFilter: UserRole | 'all' = 'all';
  userForm: UserFormValue = this.createEmptyForm();

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Panel', path: '/catalog' },
    { label: 'Administracja', path: '/admin' },
    { label: 'Użytkownicy' },
  ];

  visibleReaders = computed(() => this.users().filter((user) => user.role === 'reader').length);
  visibleStaff = computed(() => this.users().filter((user) => user.is_staff).length);
  totalItems = computed(() => this.count());

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page = this.currentPage()): void {
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
    if (this.roleFilter !== 'all') {
      params['role'] = this.roleFilter;
    }

    this.api.getReaders(params).subscribe({
      next: (response) => {
        this.users.set(response.results);
        this.count.set(response.count);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać listy użytkowników.');
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadUsers(1);
  }

  setPage(page: number): void {
    this.currentPage.set(page);
    this.loadUsers(page);
  }

  openCreateModal(): void {
    this.editingUser.set(null);
    this.userForm = this.createEmptyForm();
    this.saveError.set(null);
    this.saveModalOpen.set(true);
  }

  openEditModal(user: User): void {
    this.editingUser.set(user);
    this.userForm = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      birthdate: user.birthdate ?? '',
      role: user.role,
      password: '',
    };
    this.saveError.set(null);
    this.saveModalOpen.set(true);
  }

  closeSaveModal(): void {
    if (this.saving()) {
      return;
    }

    this.saveModalOpen.set(false);
    this.saveError.set(null);
    this.editingUser.set(null);
  }

  submitUserForm(): void {
    const payload = this.buildUserPayload();
    if (!payload) {
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    const editedUser = this.editingUser();
    const request = editedUser
      ? this.api.updateReader(editedUser.id, payload)
      : this.api.createReader(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.saveModalOpen.set(false);
        this.editingUser.set(null);
        this.loadUsers(this.currentPage());
      },
      error: (error) => {
        this.saveError.set(this.extractErrorMessage(error, 'Nie udało się zapisać użytkownika.'));
        this.saving.set(false);
      },
    });
  }

  requestDeleteUser(user: User): void {
    this.pendingDeleteUser.set(user);
    this.deleteError.set(null);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    if (this.deleting()) {
      return;
    }

    this.pendingDeleteUser.set(null);
    this.deleteError.set(null);
    this.deleteModalOpen.set(false);
  }

  confirmDeleteUser(): void {
    const user = this.pendingDeleteUser();
    if (!user) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.api.deleteReader(user.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteModalOpen.set(false);
        this.pendingDeleteUser.set(null);

        if (this.auth.user()?.id === user.id) {
          this.auth.logout();
          return;
        }

        const nextPage =
          this.users().length === 1 && this.currentPage() > 1
            ? this.currentPage() - 1
            : this.currentPage();
        this.loadUsers(nextPage);
      },
      error: (error) => {
        this.deleteError.set(this.extractErrorMessage(error, 'Nie udało się usunąć użytkownika.'));
        this.deleting.set(false);
      },
    });
  }

  getRoleLabel(role: User['role']): string {
    const labels: Record<User['role'], string> = {
      admin: 'Administrator',
      librarian: 'Bibliotekarz',
      reader: 'Czytelnik',
    };

    return labels[role];
  }

  getDisplayName(user: User): string {
    return user.full_name ?? `${user.first_name} ${user.last_name}`.trim();
  }

  getCreatedAtLabel(user: User): string {
    return user.created_at?.slice(0, 10) ?? '—';
  }

  getDeleteTargetName(): string {
    const user = this.pendingDeleteUser();
    return user ? this.getDisplayName(user) : 'wybranego użytkownika';
  }

  isEditing(): boolean {
    return this.editingUser() !== null;
  }

  private buildUserPayload(): Record<string, unknown> | null {
    const firstName = normalizeText(this.userForm.first_name);
    const lastName = normalizeText(this.userForm.last_name);
    const email = normalizeEmail(this.userForm.email);
    const birthdate = normalizeDateInput(this.userForm.birthdate);
    const password = this.userForm.password.trim();

    this.userForm.first_name = firstName;
    this.userForm.last_name = lastName;
    this.userForm.email = email;
    this.userForm.birthdate = birthdate;

    if (!hasText(firstName) || !hasText(lastName)) {
      this.saveError.set('Imię i nazwisko są wymagane.');
      return null;
    }

    if (!isValidEmail(email)) {
      this.saveError.set('Podaj poprawny adres e-mail.');
      return null;
    }

    if (!isValidIsoDate(birthdate)) {
      this.saveError.set('Data urodzenia musi mieć format RRRR-MM-DD.');
      return null;
    }

    if (!this.isEditing() && !hasText(password)) {
      this.saveError.set('Hasło jest wymagane przy tworzeniu użytkownika.');
      return null;
    }

    const payload: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      email,
      birthdate,
      role: this.userForm.role,
    };

    if (hasText(password)) {
      payload['password'] = password;
    }

    return payload;
  }

  private createEmptyForm(): UserFormValue {
    return {
      first_name: '',
      last_name: '',
      email: '',
      birthdate: '',
      role: 'reader',
      password: '',
    };
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
