import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../../../core/models/user';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';

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
    if (!this.form.first_name || !this.form.last_name || !this.form.email || !this.form.birthdate) {
      this.error.set('Wszystkie pola profilu są wymagane.');
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
