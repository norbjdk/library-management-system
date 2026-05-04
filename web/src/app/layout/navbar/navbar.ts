import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  navItems = computed(() => {
    const items = [
      { label: 'Katalog', path: '/catalog', icon: '📚', staffOnly: false },
      { label: 'Wypożyczenia', path: '/loans', icon: '🔄', staffOnly: false },
      { label: 'Kolejka', path: '/queue', icon: '⏳', staffOnly: false },
      { label: 'Kary', path: '/fines', icon: '💰', staffOnly: false },
      { label: 'Powiadomienia', path: '/notifications', icon: '🔔', staffOnly: false },
      { label: 'Profil', path: '/profile', icon: '🪪', staffOnly: false },
      { label: 'Zamówienia', path: '/orders', icon: '📦', staffOnly: true },
      { label: 'Dashboard', path: '/admin', icon: '📊', staffOnly: true },
    ];

    return this.auth.isStaff() ? items : items.filter((item) => !item.staffOnly);
  });

  fullName = computed(() => {
    const user = this.auth.user();
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`;
  });

  role = computed(() => {
    const role = this.auth.role();
    const labels: Record<string, string> = {
      admin: 'Administrator',
      librarian: 'Bibliotekarz',
      reader: 'Czytelnik',
    };
    return role ? (labels[role] ?? role) : '';
  });

  constructor(private auth: AuthService) {}

  logout() {
    this.auth.logout();
  }
}
