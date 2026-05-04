import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../../../core/models/user';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  getTodayIsoDate,
  hasText,
  isValidEmail,
  isValidIsoDate,
  normalizeDateInput,
  normalizeEmail,
  normalizeText,
} from '../../../../shared/utils/form-normalization';

@Component({
  selector: 'app-user-profile',
  imports: [FormsModule, DatePipe],
  templateUrl: './user-profile.html',
})
export class UserProfileComponent implements OnInit {
  profile = signal<UserProfile | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = {
    first_name: '',
    last_name: '',
    email: '',
    birthdate: '',
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  private syncForm(profile: UserProfile) {
    this.form.first_name = profile.first_name;
    this.form.last_name = profile.last_name;
    this.form.email = profile.email;
    this.form.birthdate = profile.birthdate;
  }

  loadProfile() {
    this.loading.set(true);
    this.error.set(null);

    this.api.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.syncForm(profile);
        this.auth.updateCurrentUser(profile);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nie udało się pobrać profilu użytkownika.');
        this.loading.set(false);
      },
    });
  }

  saveProfile() {
    const first_name = normalizeText(this.form.first_name);
    const last_name = normalizeText(this.form.last_name);
    const email = normalizeEmail(this.form.email);
    const birthdate = normalizeDateInput(this.form.birthdate);

    this.form = {
      first_name,
      last_name,
      email,
      birthdate,
    };

    if (!hasText(first_name) || !hasText(last_name) || !hasText(email) || !hasText(birthdate)) {
      this.error.set('Wszystkie pola profilu są wymagane.');
      return;
    }

    if (!isValidEmail(email)) {
      this.error.set('Podaj poprawny adres email.');
      return;
    }

    if (!isValidIsoDate(birthdate) || birthdate > getTodayIsoDate()) {
      this.error.set('Podaj poprawną datę urodzenia.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    this.api.updateProfile({ ...this.form }).subscribe({
      next: (profile) => {
        const currentProfile = this.profile();
        const nextProfile = currentProfile?.summary
          ? { ...profile, summary: currentProfile.summary }
          : profile;

        this.profile.set(nextProfile as UserProfile);
        this.auth.updateCurrentUser(nextProfile);
        this.success.set('Profil został zapisany.');
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail ?? err?.error?.email?.[0] ?? 'Nie udało się zapisać zmian.',
        );
        this.saving.set(false);
      },
    });
  }
}
