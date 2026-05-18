import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  isLoggedIn = computed(() => this.auth.isLoggedIn());

  fullName = computed(() => {
    const user = this.auth.user();
    if (!user) return 'Dostęp publiczny';
    return `${user.first_name} ${user.last_name}`;
  });

  role = computed(() => {
    const role = this.auth.role();
    const labels: Record<string, string> = {
      admin: 'Administrator',
      librarian: 'Bibliotekarz',
      reader: 'Czytelnik',
    };
    return role ? (labels[role] ?? role) : 'Konto gościa';
  });

  constructor(private auth: AuthService) {}

  logout() {
    this.auth.logout();
  }
}
